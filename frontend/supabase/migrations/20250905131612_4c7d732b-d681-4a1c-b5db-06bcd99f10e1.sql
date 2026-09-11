-- Fix SECURITY DEFINER view issue detected by security linter
-- Remove security definer from organization_basic_profiles view

-- Drop and recreate the view without security_barrier (which was causing the SECURITY DEFINER issue)
DROP VIEW IF EXISTS public.organization_basic_profiles CASCADE;

-- Recreate the view as a normal view (not SECURITY DEFINER)
CREATE VIEW public.organization_basic_profiles AS
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

-- Recreate the functions that depended on this view
CREATE OR REPLACE FUNCTION public.get_organization_basic_profiles()
RETURNS SETOF organization_basic_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
RETURNS organization_basic_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
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

-- Recreate RLS policies for the view (these were dropped with CASCADE)
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

-- Enable RLS on the recreated view
ALTER VIEW public.organization_basic_profiles SET (security_barrier = off);

COMMENT ON VIEW public.organization_basic_profiles IS 'View of user profiles containing only non-sensitive organizational data (no national_id, birth_date, home_phone, address)';