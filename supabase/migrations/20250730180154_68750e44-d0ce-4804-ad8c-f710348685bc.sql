-- Ensure delegation_tasks table has all necessary fields
ALTER TABLE public.delegation_tasks 
ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS delegatee_name text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_delegator_id ON public.delegation_tasks(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_delegatee_id ON public.delegation_tasks(delegatee_id);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_status ON public.delegation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_due_date ON public.delegation_tasks(due_date);

-- Create index for delegation_notifications
CREATE INDEX IF NOT EXISTS idx_delegation_notifications_task_id ON public.delegation_notifications(delegation_task_id);
CREATE INDEX IF NOT EXISTS idx_delegation_notifications_delivered ON public.delegation_notifications(delivered);

-- Create task_delegations table for tracking delegation history
CREATE TABLE IF NOT EXISTS public.task_delegations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  delegation_task_id uuid REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  delegated_by uuid NOT NULL,
  delegated_to_email text,
  delegated_to_phone text,
  delegation_method delegation_method NOT NULL,
  message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(task_id, delegation_task_id)
);

-- Enable RLS on task_delegations
ALTER TABLE public.task_delegations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for task_delegations
CREATE POLICY "Users can create task delegations" 
ON public.task_delegations 
FOR INSERT 
WITH CHECK (auth.uid() = delegated_by);

CREATE POLICY "Users can view their task delegations" 
ON public.task_delegations 
FOR SELECT 
USING (auth.uid() = delegated_by OR 
       EXISTS (
         SELECT 1 FROM public.project_tasks pt 
         JOIN public.projects p ON pt.project_id = p.id 
         WHERE pt.id = task_delegations.task_id 
         AND (p.user_id = auth.uid() OR pt.assignee_id = auth.uid())
       ));

-- Create function to auto-create delegation notifications
CREATE OR REPLACE FUNCTION public.create_delegation_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification record
  INSERT INTO public.delegation_notifications (
    delegation_task_id,
    recipient,
    method,
    message,
    delivered
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.delegatee_email, NEW.delegatee_phone, 'secretary'),
    NEW.method,
    'Task delegation: ' || NEW.title,
    false
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-creating notifications
DROP TRIGGER IF EXISTS trigger_create_delegation_notification ON public.delegation_tasks;
CREATE TRIGGER trigger_create_delegation_notification
  AFTER INSERT ON public.delegation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.create_delegation_notification();

-- Create function to update delegation status
CREATE OR REPLACE FUNCTION public.update_delegation_status(
  p_task_id uuid,
  p_new_status delegation_status
)
RETURNS void AS $$
BEGIN
  UPDATE public.delegation_tasks 
  SET 
    status = p_new_status,
    updated_at = now()
  WHERE id = p_task_id;
  
  -- Update notification if status changes to completed
  IF p_new_status = 'completed' THEN
    UPDATE public.delegation_notifications 
    SET delivered = true 
    WHERE delegation_task_id = p_task_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create view for delegation dashboard
CREATE OR REPLACE VIEW public.delegation_dashboard AS
SELECT 
  dt.id,
  dt.title,
  dt.description,
  dt.status,
  dt.priority,
  dt.method,
  dt.delegatee_email,
  dt.delegatee_phone,
  dt.delegatee_name,
  dt.due_date,
  dt.created_at,
  dt.updated_at,
  dt.delegator_id,
  dt.delegatee_id,
  COUNT(dn.id) as notification_count,
  COUNT(CASE WHEN dn.delivered = true THEN 1 END) as delivered_count
FROM public.delegation_tasks dt
LEFT JOIN public.delegation_notifications dn ON dt.id = dn.delegation_task_id
GROUP BY dt.id, dt.title, dt.description, dt.status, dt.priority, dt.method, 
         dt.delegatee_email, dt.delegatee_phone, dt.delegatee_name, dt.due_date, 
         dt.created_at, dt.updated_at, dt.delegator_id, dt.delegatee_id;

-- Grant necessary permissions
GRANT SELECT ON public.delegation_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_delegation_status TO authenticated;