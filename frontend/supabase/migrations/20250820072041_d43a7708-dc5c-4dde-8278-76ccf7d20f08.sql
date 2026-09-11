-- Fix critical security issue: Employee Personal Information Exposed to All Users
-- Replace overly permissive RLS policy with secure, organization-based access controls

-- Drop the existing overly permissive policy that allows all users to view all profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.user_profiles;

-- Create secure RLS policies for user_profiles table
-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.user_profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Users can view profiles within their organization (if they belong to the same organization)
CREATE POLICY "Users can view profiles in their organization" 
ON public.user_profiles 
FOR SELECT 
USING (
    organization_id IS NOT NULL 
    AND organization_id IN (
        SELECT up.organization_id 
        FROM user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.organization_id IS NOT NULL
    )
);

-- Policy 3: Admin users can view all profiles (for user management purposes)
CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.system_role = 'admin'
    )
);

-- Keep the existing policy for users to manage their own profile (this is already secure)
-- "Users can manage their own profile" policy is already correct and secure

-- Add audit logging for profile access (optional but recommended for compliance)
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log when someone accesses a profile that's not their own
    IF auth.uid() != NEW.user_id THEN
        INSERT INTO user_audit_log (
            user_id,
            action,
            details
        ) VALUES (
            auth.uid(),
            'profile_view',
            jsonb_build_object(
                'viewed_profile_id', NEW.user_id,
                'timestamp', now()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Note: We're not adding the trigger for now as it might affect performance
-- Users can enable it later if they need detailed audit logging