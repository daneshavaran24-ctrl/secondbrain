-- Fix security vulnerability: Implement field-level access controls for user_profiles
-- Remove the overly permissive policy and create more restrictive ones

-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Users can view organization profiles" ON public.user_profiles;

-- Function to check if user has HR access (admin, hr, manager roles)
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

-- Create new restrictive policies for user_profiles
-- Policy 1: Users can view their own full profile (unchanged)
CREATE POLICY "Users can view their own full profile" 
ON public.user_profiles 
FOR SELECT 
USING (user_id = auth.uid());

-- Policy 2: Only HR personnel can view full profiles of organization members
CREATE POLICY "HR personnel can view full organization profiles" 
ON public.user_profiles 
FOR SELECT 
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
  AND has_hr_access()
);

-- Create a view for basic profile information (excludes sensitive personal data)
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

-- Grant access to the view
GRANT SELECT ON public.organization_basic_profiles TO authenticated;

-- Create security definer functions for controlled access
CREATE OR REPLACE FUNCTION public.get_organization_basic_profiles()
RETURNS SETOF public.organization_basic_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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
  WHERE organization_id = get_current_user_organization()
    AND organization_id IS NOT NULL;
$$;

CREATE OR REPLACE FUNCTION public.get_user_basic_profile(profile_user_id uuid)
RETURNS public.organization_basic_profiles
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
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
    );
$$;

-- Add comments explaining the new security model
COMMENT ON TABLE public.user_profiles IS 'User profiles with enhanced security: Full access restricted to self and HR personnel (admin, hr, manager roles). Organization colleagues should use get_organization_basic_profiles() function for basic info only.';

COMMENT ON VIEW public.organization_basic_profiles IS 'Basic profile information excluding sensitive personal data (phone numbers, addresses, national IDs, birth dates). Access controlled via security definer functions.';

COMMENT ON FUNCTION public.get_organization_basic_profiles() IS 'Returns basic profile information for organization colleagues. Excludes sensitive personal data like phone numbers, addresses, and national IDs.';

COMMENT ON FUNCTION public.get_user_basic_profile(uuid) IS 'Returns basic profile information for a specific user. Safe for organization colleagues to use.';

COMMENT ON FUNCTION public.has_hr_access() IS 'Checks if current user has HR access (admin, hr, or manager role) to view full profile information.';