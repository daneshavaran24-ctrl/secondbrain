-- Fix critical security vulnerabilities in user profiles and roles
-- Address infinite recursion errors and overly permissive policies

-- First, create security definer functions to prevent recursive policy issues
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT system_role 
  FROM user_roles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_current_user_organization()
RETURNS UUID AS $$
  SELECT organization_id 
  FROM user_profiles 
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create secure policies for user_roles table
-- Users can only view their own role
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Only system admins can manage roles (insert, update, delete)
CREATE POLICY "System admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- Create secure policies for user_profiles table
-- Keep existing user's own profile policy
-- Users can view their own profile (already exists, but recreating for clarity)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
CREATE POLICY "Users can view their own profile"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- System admins can view all profiles (using security definer function)
CREATE POLICY "System admins can view all profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.is_user_admin());

-- Users can view profiles in their organization (using security definer function)
CREATE POLICY "Users can view organization profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Keep existing management policy for own profile
-- Users can manage their own profile (already exists)

-- System admins can manage all profiles
CREATE POLICY "System admins can manage all profiles"
ON public.user_profiles
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());