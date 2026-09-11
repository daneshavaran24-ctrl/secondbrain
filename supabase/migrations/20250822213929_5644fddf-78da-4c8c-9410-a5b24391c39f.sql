-- Fix critical security issue: Organizations table exposed to public
-- Replace overly permissive policies with secure access controls

-- Drop existing dangerous policies
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be managed by authenticated users" ON public.organizations;

-- Create secure policies for organizations table
-- Users can only view organizations they are members of
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
      AND organization_id IS NOT NULL
  )
);

-- Only admins can create new organizations
CREATE POLICY "Admins can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  )
);

-- Only admins can update organizations
CREATE POLICY "Admins can update organizations" 
ON public.organizations 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  )
);

-- Only admins can delete organizations
CREATE POLICY "Admins can delete organizations" 
ON public.organizations 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles 
    WHERE user_id = auth.uid() 
      AND system_role = 'admin'
  )
);