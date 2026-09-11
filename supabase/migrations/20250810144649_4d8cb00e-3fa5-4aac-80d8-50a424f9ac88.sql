-- 1) Types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delegation_event_type') THEN
    CREATE TYPE public.delegation_event_type AS ENUM (
      'created',
      'status_changed',
      'reminder_sent',
      'note_added'
    );
  END IF;
END $$;

-- 2) Table
CREATE TABLE IF NOT EXISTS public.delegation_task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_task_id uuid NOT NULL,
  event_type public.delegation_event_type NOT NULL,
  actor_id uuid,
  old_status public.delegation_status,
  new_status public.delegation_status,
  note text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) RLS
ALTER TABLE public.delegation_task_events ENABLE ROW LEVEL SECURITY;

-- Allow reading events for tasks where user is delegator or delegatee
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'delegation_task_events' AND polname = 'Users can view task events'
  ) THEN
    CREATE POLICY "Users can view task events"
    ON public.delegation_task_events
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.delegation_tasks t
        WHERE t.id = delegation_task_id 
          AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
      )
    );
  END IF;
END $$;

-- Allow inserting events when acting user is linked to task and sets actor_id = auth.uid()
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'delegation_task_events' AND polname = 'Users can insert task events'
  ) THEN
    CREATE POLICY "Users can insert task events"
    ON public.delegation_task_events
    FOR INSERT
    WITH CHECK (
      actor_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM public.delegation_tasks t
        WHERE t.id = delegation_task_id 
          AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
      )
    );
  END IF;
END $$;

-- No UPDATE/DELETE by users for now

-- 4) Triggers: log creation and status changes on delegation_tasks
CREATE OR REPLACE FUNCTION public.trg_log_delegation_task_insert()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.delegation_task_events (delegation_task_id, event_type, actor_id, new_status, metadata)
  VALUES (NEW.id, 'created', NEW.delegator_id, NEW.status, jsonb_build_object('title', NEW.title, 'method', NEW.method));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

CREATE OR REPLACE FUNCTION public.trg_log_delegation_task_update()
RETURNS trigger AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.delegation_task_events (delegation_task_id, event_type, actor_id, old_status, new_status)
    VALUES (NEW.id, 'status_changed', auth.uid(), OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO public;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'after_insert_delegation_tasks_log'
  ) THEN
    CREATE TRIGGER after_insert_delegation_tasks_log
    AFTER INSERT ON public.delegation_tasks
    FOR EACH ROW EXECUTE FUNCTION public.trg_log_delegation_task_insert();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'after_update_delegation_tasks_log'
  ) THEN
    CREATE TRIGGER after_update_delegation_tasks_log
    AFTER UPDATE ON public.delegation_tasks
    FOR EACH ROW EXECUTE FUNCTION public.trg_log_delegation_task_update();
  END IF;
END $$;

-- 5) RPC: send reminder (only delegator can call)
CREATE OR REPLACE FUNCTION public.send_delegation_reminder(task_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_task RECORD;
  v_recipient text;
BEGIN
  SELECT * INTO v_task FROM public.delegation_tasks WHERE id = task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;
  IF v_task.delegator_id <> auth.uid() THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;

  -- Mark reminder flag
  UPDATE public.delegation_tasks
  SET reminder_sent = true, updated_at = now()
  WHERE id = task_id;

  -- Compute recipient
  v_recipient := COALESCE(v_task.delegatee_email, v_task.delegatee_phone, 'secretary');

  -- Create notification record
  INSERT INTO public.delegation_notifications (
    delegation_task_id, recipient, method, message, delivered
  ) VALUES (
    task_id, v_recipient, v_task.method, 'Reminder: ' || v_task.title, false
  );

  -- Log event
  INSERT INTO public.delegation_task_events (delegation_task_id, event_type, actor_id, metadata)
  VALUES (task_id, 'reminder_sent', auth.uid(), jsonb_build_object('recipient', v_recipient));
END;
$$;