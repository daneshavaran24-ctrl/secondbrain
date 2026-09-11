-- First, let's check the current policies on the profiles table
-- This will show us what policies exist

-- Drop the overly permissive SELECT policy if it exists
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a secure SELECT policy that only allows users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Also ensure the table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Let's also check and secure the user_roles table
DROP POLICY IF EXISTS "Users can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public user roles are viewable by everyone" ON public.user_roles;

-- Create secure policy for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Ensure user_roles has RLS enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;