-- Fix security issues identified by the linter

-- 1. Fix function search_path for delegation functions
CREATE OR REPLACE FUNCTION public.create_delegation_notification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 2. Fix function search_path for update delegation status
CREATE OR REPLACE FUNCTION public.update_delegation_status(
  p_task_id uuid,
  p_new_status delegation_status
)
RETURNS void 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- 3. Drop the view that was causing security issues and recreate as regular view
DROP VIEW IF EXISTS public.delegation_dashboard;

-- Create a simple function to get delegation stats instead
CREATE OR REPLACE FUNCTION public.get_delegation_stats(task_id uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT json_build_object(
    'notification_count', COUNT(dn.id),
    'delivered_count', COUNT(CASE WHEN dn.delivered = true THEN 1 END)
  )
  FROM public.delegation_notifications dn
  WHERE dn.delegation_task_id = task_id;
$$;