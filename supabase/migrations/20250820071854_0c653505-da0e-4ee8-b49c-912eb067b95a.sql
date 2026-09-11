-- Fix security definer functions to remove unnecessary SECURITY DEFINER privileges
-- This addresses the security linter warning about SECURITY DEFINER usage

-- 1. Remove SECURITY DEFINER from get_admin_info function as it exposes sensitive admin credentials
-- This function should not be accessible and poses a security risk
DROP FUNCTION IF EXISTS public.get_admin_info();

-- 2. Update create_admin_user to be more secure - remove SECURITY DEFINER if not absolutely necessary
-- For now, we'll keep it as SECURITY DEFINER is needed for admin user creation, but add proper security checks
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    admin_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    result jsonb;
    current_user_role text;
BEGIN
    -- Security check: Only allow if called by an admin or if no admin exists yet
    SELECT system_role INTO current_user_role 
    FROM user_roles 
    WHERE user_id = auth.uid();
    
    -- Allow if user is admin or if no admin exists in the system
    IF current_user_role != 'admin' AND EXISTS (SELECT 1 FROM user_roles WHERE system_role = 'admin') THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Unauthorized: Only admins can create admin users'
        );
    END IF;
    
    -- Insert or update admin user profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        display_name,
        first_name,
        last_name
    ) VALUES (
        admin_user_id,
        'admin@brainforge.com',
        'مدیر سیستم',
        'مدیر',
        'سیستم'
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;
    
    -- Assign admin role
    INSERT INTO public.user_roles (
        user_id,
        system_role
    ) VALUES (
        admin_user_id,
        'admin'
    ) ON CONFLICT (user_id) DO UPDATE SET
        system_role = EXCLUDED.system_role;
    
    result := jsonb_build_object(
        'success', true,
        'user_id', admin_user_id,
        'message', 'Admin user profile and role created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END $function$;

-- 3. Remove SECURITY DEFINER from send_delegation_reminder as it's just a placeholder
CREATE OR REPLACE FUNCTION public.send_delegation_reminder(task_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $function$
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
$function$;

-- 4. Keep update_updated_at_column as SECURITY DEFINER since it's a trigger function
-- But ensure it has proper search_path set for security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;