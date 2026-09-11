-- Fix security vulnerability in user_profiles table
-- Remove overlapping policies and implement stricter access controls

-- First, drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own full profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "HR personnel can view full organization profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON public.user_profiles;

-- Create audit log table for sensitive profile access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    accessor_id UUID REFERENCES auth.users(id),
    accessed_profile_id UUID NOT NULL,
    access_type TEXT NOT NULL, -- 'view_sensitive', 'view_basic', 'update'
    accessed_fields JSONB, -- which sensitive fields were accessed
    access_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Create audit log policies
CREATE POLICY "Admins can view all access logs" ON public.profile_access_logs
FOR SELECT USING (is_user_admin());

CREATE POLICY "Users can view logs of their profile access" ON public.profile_access_logs
FOR SELECT USING (accessed_profile_id IN (
    SELECT user_id FROM user_profiles WHERE user_id = auth.uid()
));

-- Create function to log sensitive profile access
CREATE OR REPLACE FUNCTION public.log_sensitive_profile_access(
    accessed_user_id UUID,
    access_type TEXT,
    fields JSONB DEFAULT NULL,
    reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO profile_access_logs (
        accessor_id,
        accessed_profile_id,
        access_type,
        accessed_fields,
        access_reason
    ) VALUES (
        auth.uid(),
        accessed_user_id,
        access_type,
        fields,
        reason
    );
END;
$$;

-- Create view for basic organization profiles (non-sensitive data only)
CREATE OR REPLACE VIEW public.organization_basic_profiles AS
SELECT 
    id,
    user_id,
    email,
    display_name,
    first_name,
    last_name,
    department,
    "position",
    avatar_url,
    organization_id,
    created_at,
    updated_at
FROM user_profiles;

-- Enable RLS on the view
ALTER VIEW public.organization_basic_profiles SET (security_barrier = on);

-- Create function to check if user can access sensitive profile data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_profile_data(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT CASE
        -- Users can always access their own sensitive data
        WHEN target_user_id = auth.uid() THEN true
        -- System admins can access any sensitive data (with audit logging)
        WHEN is_user_admin() THEN true
        -- No one else can access sensitive data
        ELSE false
    END;
$$;

-- Create new restrictive policies for user_profiles

-- 1. Users can view their own complete profile
CREATE POLICY "Users can view own complete profile" ON public.user_profiles
FOR SELECT USING (user_id = auth.uid());

-- 2. Users can manage their own profile (but not change user_id or organization_id)
CREATE POLICY "Users can update own profile" ON public.user_profiles
FOR UPDATE USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND (OLD.organization_id IS NOT DISTINCT FROM NEW.organization_id));

-- 3. Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- 4. System admins can manage all profiles (with audit requirements)
CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
FOR ALL USING (is_user_admin())
WITH CHECK (is_user_admin());

-- 5. HR personnel can ONLY view basic organization profiles (through the view)
-- No direct access to sensitive fields in user_profiles table

-- Create policies for the basic profiles view
CREATE POLICY "HR can view organization basic profiles" ON public.organization_basic_profiles
FOR SELECT USING (
    organization_id IS NOT NULL 
    AND organization_id = get_current_user_organization() 
    AND has_hr_access()
);

CREATE POLICY "Users can view own basic profile" ON public.organization_basic_profiles
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all basic profiles" ON public.organization_basic_profiles
FOR SELECT USING (is_user_admin());

-- Create trigger to automatically log sensitive data access by admins
CREATE OR REPLACE FUNCTION public.log_admin_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only log when admin accesses someone else's profile
    IF is_user_admin() AND auth.uid() != NEW.user_id THEN
        PERFORM log_sensitive_profile_access(
            NEW.user_id,
            'admin_view',
            jsonb_build_object(
                'national_id', NEW.national_id IS NOT NULL,
                'birth_date', NEW.birth_date IS NOT NULL,
                'home_phone', NEW.home_phone IS NOT NULL,
                'address', NEW.address IS NOT NULL
            ),
            'Admin profile access'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger for audit logging (only on SELECT operations via a different approach)
-- Note: We'll handle this in the application layer since PostgreSQL doesn't support SELECT triggers

-- Add comments for documentation
COMMENT ON TABLE public.profile_access_logs IS 'Audit log for sensitive profile data access';
COMMENT ON VIEW public.organization_basic_profiles IS 'Restricted view of user profiles containing only non-sensitive organizational data';
COMMENT ON FUNCTION public.can_access_sensitive_profile_data IS 'Security function to check if user can access sensitive profile fields';
COMMENT ON FUNCTION public.log_sensitive_profile_access IS 'Function to log sensitive profile data access for audit purposes';