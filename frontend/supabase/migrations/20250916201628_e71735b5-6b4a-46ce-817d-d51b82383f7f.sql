-- Fix critical security issues identified in security scan

-- 1. Create RLS policy for organization_basic_profiles view
-- Since organization_basic_profiles is a view, we need to ensure proper access control
-- The view should only return profiles from the user's organization

-- First, let's recreate the view with proper security
DROP VIEW IF EXISTS public.organization_basic_profiles;

CREATE VIEW public.organization_basic_profiles
WITH (security_barrier = true)
AS
SELECT 
  up.id,
  up.user_id,
  up.email,
  up.display_name,
  up.first_name,
  up.last_name,
  up.department,
  up."position",
  up.avatar_url,
  up.organization_id,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE up.organization_id = get_current_user_organization()
  AND up.organization_id IS NOT NULL
  AND auth.uid() IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON public.organization_basic_profiles TO authenticated;

-- 2. Fix the get_user_basic_profile function to be more secure
CREATE OR REPLACE FUNCTION public.get_user_basic_profile(profile_user_id uuid)
RETURNS SETOF organization_basic_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  FROM user_profiles
  WHERE user_id = profile_user_id
    AND (
      -- User can see their own profile
      user_id = auth.uid()
      OR
      -- Organization colleagues can see basic info
      (organization_id = get_current_user_organization() AND organization_id IS NOT NULL)
      OR
      -- Admins can see all profiles
      is_user_admin()
    );
$$;

-- 3. Improve RLS policies for sensitive data tables
-- Add more restrictive policies for user_profiles sensitive fields

-- Create a function to check if user can access sensitive profile data
CREATE OR REPLACE FUNCTION public.can_access_full_profile(target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT CASE
        -- Users can always access their own data
        WHEN target_user_id = auth.uid() THEN true
        -- HR and admin roles can access sensitive data (with audit logging)
        WHEN has_hr_access() OR is_user_admin() THEN true
        -- No one else can access sensitive data
        ELSE false
    END;
$$;

-- 4. Add audit logging trigger for sensitive profile access
CREATE OR REPLACE FUNCTION public.log_sensitive_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log access to sensitive fields when not accessing own profile
    IF auth.uid() != NEW.user_id AND auth.uid() IS NOT NULL THEN
        PERFORM log_sensitive_profile_access(
            NEW.user_id,
            'profile_access',
            jsonb_build_object(
                'accessed_at', now(),
                'accessed_fields', array['national_id', 'mobile_phone', 'home_phone', 'address', 'birth_date']
            ),
            'Administrative access to user profile'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Create trigger for audit logging (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'audit_sensitive_profile_access'
    ) THEN
        CREATE TRIGGER audit_sensitive_profile_access
            AFTER SELECT ON user_profiles
            FOR EACH ROW
            EXECUTE FUNCTION log_sensitive_access();
    END IF;
END $$;

-- 6. Add RLS policy for profile_access_logs to ensure proper access
DROP POLICY IF EXISTS "Only relevant users can insert access logs" ON profile_access_logs;
CREATE POLICY "Only relevant users can insert access logs"
ON profile_access_logs
FOR INSERT
WITH CHECK (
    accessor_id = auth.uid() 
    AND (has_hr_access() OR is_user_admin())
);

-- 7. Improve organization_claims security
-- Add policy to prevent unauthorized access to sensitive claim data
DROP POLICY IF EXISTS "Restrict sensitive claim data access" ON organization_claims;
CREATE POLICY "Restrict sensitive claim data access"
ON organization_claims
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM (user_profiles up JOIN user_roles ur ON (ur.user_id = up.user_id))
        WHERE up.user_id = auth.uid() 
          AND up.organization_id = organization_claims.organization_id
          AND ur.system_role IN ('admin', 'manager', 'secretary')
    )
    OR is_user_admin()
);

-- 8. Add function to validate user permissions before sensitive operations
CREATE OR REPLACE FUNCTION public.validate_user_permission(
    operation text,
    target_table text,
    target_organization_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_role text;
    user_org_id uuid;
BEGIN
    -- Get current user's role and organization
    SELECT ur.system_role, up.organization_id 
    INTO user_role, user_org_id
    FROM user_roles ur
    JOIN user_profiles up ON up.user_id = ur.user_id
    WHERE ur.user_id = auth.uid();
    
    -- Admin can do everything
    IF user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Organization-specific checks
    IF target_organization_id IS NOT NULL AND user_org_id != target_organization_id THEN
        RETURN false;
    END IF;
    
    -- Role-based permission checks
    CASE operation
        WHEN 'manage_claims' THEN
            RETURN user_role IN ('admin', 'manager', 'secretary');
        WHEN 'view_sensitive_profile' THEN
            RETURN user_role IN ('admin', 'hr', 'manager');
        WHEN 'manage_missions' THEN
            RETURN user_role IN ('admin', 'manager');
        ELSE
            RETURN false;
    END CASE;
END;
$$;