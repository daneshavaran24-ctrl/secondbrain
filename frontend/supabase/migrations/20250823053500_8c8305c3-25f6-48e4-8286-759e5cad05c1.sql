-- Fix security definer function search path warnings
-- Handle function dependencies properly

-- Drop policies that depend on the functions
DROP POLICY IF EXISTS "Users can view organization profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admins can manage all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "System admins can manage all roles" ON public.user_roles;

-- Drop and recreate functions with proper search_path
DROP FUNCTION IF EXISTS public.get_current_user_role();
DROP FUNCTION IF EXISTS public.get_current_user_organization();
DROP FUNCTION IF EXISTS public.is_user_admin();

-- Create secure functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT system_role 
  FROM user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_current_user_organization()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM user_profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Recreate the policies with the updated functions
-- System admins can view all profiles
CREATE POLICY "System admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_user_admin());

-- Users can view profiles in their organization
CREATE POLICY "Users can view organization profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- System admins can manage all profiles
CREATE POLICY "System admins can manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Only system admins can manage roles
CREATE POLICY "System admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());