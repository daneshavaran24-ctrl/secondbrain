-- Fix critical security issues - handle dependencies properly

-- 1. First drop dependent functions
DROP FUNCTION IF EXISTS public.get_organization_basic_profiles() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_basic_profile(uuid) CASCADE;

-- 2. Drop the view
DROP VIEW IF EXISTS public.organization_basic_profiles CASCADE;

-- 3. Recreate the view with proper security
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

-- 4. Grant appropriate permissions
GRANT SELECT ON public.organization_basic_profiles TO authenticated;

-- 5. Recreate the get_organization_basic_profiles function
CREATE OR REPLACE FUNCTION public.get_organization_basic_profiles()
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
  WHERE organization_id = get_current_user_organization()
    AND organization_id IS NOT NULL;
$$;

-- 6. Recreate the get_user_basic_profile function with better security
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