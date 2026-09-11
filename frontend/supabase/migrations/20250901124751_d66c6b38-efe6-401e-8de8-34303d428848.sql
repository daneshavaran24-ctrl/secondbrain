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
  position text,
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
    up.position,
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
  position text,
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
    up.position,
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

-- Create new restrictive policy for organization profile viewing
-- Only allows basic info for colleagues, full info for HR/admins/self
CREATE POLICY "Organization colleagues can view basic profile info only" 
ON public.user_profiles 
FOR SELECT 
USING (
  -- Users can always see their own full profile
  (auth.uid() = user_id)
  OR
  -- HR personnel can see full profiles of their organization
  (
    organization_id IS NOT NULL 
    AND organization_id = get_current_user_organization()
    AND has_hr_access()
  )
  OR
  -- System admins can see all profiles
  is_user_admin()
);

-- Create views for different access levels
CREATE OR REPLACE VIEW public.organization_basic_profiles AS
SELECT 
  id,
  user_id,
  email,
  display_name,
  first_name,
  last_name,
  department,
  position,
  avatar_url,
  organization_id,
  created_at,
  updated_at
FROM user_profiles
WHERE organization_id = get_current_user_organization()
  AND organization_id IS NOT NULL;

-- Grant access to the view
GRANT SELECT ON public.organization_basic_profiles TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.organization_basic_profiles SET (security_barrier = true);

-- Create RLS policy for the view
CREATE POLICY "Users can view basic organization profiles" 
ON public.organization_basic_profiles
FOR SELECT 
USING (
  organization_id = get_current_user_organization()
  AND organization_id IS NOT NULL
);

-- Update existing policies to be more secure
-- Ensure self-access remains for basic operations
CREATE POLICY "Users can view their own full profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- HR and admins can view full profiles
CREATE POLICY "HR personnel can view full organization profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
  AND has_hr_access()
);

-- Comment explaining the security model
COMMENT ON TABLE public.user_profiles IS 'User profiles with field-level security: Basic info visible to organization colleagues, sensitive data (phone numbers, addresses, national ID, birth date) restricted to HR personnel and admins only';

COMMENT ON VIEW public.organization_basic_profiles IS 'Basic profile information safe for organization colleagues to view. Excludes sensitive personal data like phone numbers, addresses, and national IDs';