-- Fix additional security issues found by linter

-- Add RLS policies for project_tasks table (currently has RLS enabled but no policies)
CREATE POLICY "Users can manage project tasks of their organization"
ON public.project_tasks
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_tasks.project_id 
    AND p.organization_id = get_current_user_organization()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects p 
    WHERE p.id = project_tasks.project_id 
    AND p.organization_id = get_current_user_organization()
  )
);

-- Fix search_path for existing functions that might be missing it
CREATE OR REPLACE FUNCTION public.send_delegation_reminder(task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user has access to this task
    IF NOT EXISTS (
        SELECT 1 FROM delegation_tasks 
        WHERE id = task_id AND delegator_id = auth.uid()
    ) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Task not found or access denied'
        );
    END IF;
    
    -- Placeholder function - actual implementation should be in Edge Functions
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Reminder functionality not implemented'
    );
END;
$$;