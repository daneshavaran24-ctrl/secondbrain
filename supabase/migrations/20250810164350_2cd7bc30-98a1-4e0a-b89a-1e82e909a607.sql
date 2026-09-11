-- Advanced delegation features migration (fix policies)
-- 1) Extend delegation_tasks with advanced fields
ALTER TABLE public.delegation_tasks
  ADD COLUMN IF NOT EXISTS requires_confirmation boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cc_recipients text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];

-- Helpful index for tags filtering
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_tags ON public.delegation_tasks USING GIN (tags);

-- 2) Subtasks table
CREATE TABLE IF NOT EXISTS public.delegation_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_task_id uuid NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  due_date timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delegation_subtasks ENABLE ROW LEVEL SECURITY;

-- Policies: delegator or delegatee of parent task can manage/select
CREATE POLICY "Users can insert delegation subtasks"
ON public.delegation_subtasks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

CREATE POLICY "Users can view delegation subtasks"
ON public.delegation_subtasks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

CREATE POLICY "Users can update delegation subtasks"
ON public.delegation_subtasks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

CREATE POLICY "Users can delete delegation subtasks"
ON public.delegation_subtasks
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION public.trg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS update_delegation_subtasks_updated_at ON public.delegation_subtasks;
CREATE TRIGGER update_delegation_subtasks_updated_at
BEFORE UPDATE ON public.delegation_subtasks
FOR EACH ROW EXECUTE FUNCTION public.trg_update_timestamp();

-- 3) Attachments table for delegation tasks
CREATE TABLE IF NOT EXISTS public.delegation_task_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_task_id uuid NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  filename text,
  file_type text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delegation_task_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert delegation attachments"
ON public.delegation_task_attachments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

CREATE POLICY "Users can view delegation attachments"
ON public.delegation_task_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

CREATE POLICY "Users can delete delegation attachments"
ON public.delegation_task_attachments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks t
    WHERE t.id = delegation_task_id
      AND (t.delegator_id = auth.uid() OR t.delegatee_id = auth.uid())
  )
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_delegation_subtasks_task ON public.delegation_subtasks (delegation_task_id);
CREATE INDEX IF NOT EXISTS idx_delegation_attachments_task ON public.delegation_task_attachments (delegation_task_id);
