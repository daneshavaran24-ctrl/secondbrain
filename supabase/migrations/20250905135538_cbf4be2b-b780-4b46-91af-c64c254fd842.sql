-- Simple fix for SECURITY DEFINER view issue
-- Just remove the security_barrier setting that was causing the issue

-- Remove the security barrier setting from the existing view
ALTER VIEW public.organization_basic_profiles SET (security_barrier = off);

-- Update comment to clarify this is a non-sensitive view
COMMENT ON VIEW public.organization_basic_profiles IS 'View of user profiles containing only non-sensitive organizational data (excludes national_id, birth_date, home_phone, address)';