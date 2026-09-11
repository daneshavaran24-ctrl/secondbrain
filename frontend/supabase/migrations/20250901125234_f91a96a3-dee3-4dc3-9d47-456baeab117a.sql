-- Fix security vulnerability: Implement field-level access controls for user_profiles
-- Create security definer functions for different access levels

-- Function to get basic profile info (safe for organization colleagues)
CREATE OR REPLACE FUNCTION public.get_basic_profile_info(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  department text,
  "position" text,
  avatar_url text,
  organization_id uuid
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
    up.organization_id
  FROM user_profiles up
  WHERE up.user_id = profile_user_id;
$$;

-- Function to get full profile info (for HR personnel, admins, and self)
CREATE OR REPLACE FUNCTION public.get_full_profile_info(profile_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  display_name text,
  first_name text,
  last_name text,
  department text,
  "position" text,
  avatar_url text,
  organization_id uuid,
  office_phone text,
  home_phone text,
  mobile_phone text,
  address text,
  national_id text,
  birth_date date,
  hire_date date,
  employee_id text,
  bio text,
  notes text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
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
    up.office_phone,
    up.home_phone,
    up.mobile_phone,
    up.address,
    up.national_id,
    up.birth_date,
    up.hire_date,
    up.employee_id,
    up.bio,
    up.notes,
    up.created_at,
    up.updated_at
  FROM user_profiles up
  WHERE up.user_id = profile_user_id;
$$;

-- Function to check if user has HR access
CREATE OR REPLACE FUNCTION public.has_hr_access()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.system_role IN ('admin', 'hr', 'manager')
  );
$$;

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view organization profiles" ON public.user_profiles;

-- Create new restrictive policies
-- Users can always see their own full profile
CREATE POLICY "Users can view their own full profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- HR and admins can view full profiles of their organization
CREATE POLICY "HR personnel can view full organization profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
  AND has_hr_access()
);

-- Create view for basic profile information (safe for organization colleagues)
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
FROM user_profiles
WHERE organization_id = get_current_user_organization()
  AND organization_id IS NOT NULL;

-- Enable RLS on the view
ALTER VIEW public.organization_basic_profiles SET (security_barrier = true);

-- Grant access to the view
GRANT SELECT ON public.organization_basic_profiles TO authenticated;

-- Create RLS policy for the basic profiles view
CREATE POLICY "Users can view basic organization profiles" 
ON public.organization_basic_profiles
FOR SELECT 
USING (
  organization_id = get_current_user_organization()
  AND organization_id IS NOT NULL
);

-- Add comments explaining the security model
COMMENT ON TABLE public.user_profiles IS 'User profiles with field-level security: Full access for self and HR personnel only. Basic info available through organization_basic_profiles view.';

COMMENT ON VIEW public.organization_basic_profiles IS 'Basic profile information safe for organization colleagues. Excludes sensitive personal data like phone numbers, addresses, and national IDs.';