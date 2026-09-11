-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Update user_roles table to use the enum
ALTER TABLE public.user_roles 
DROP COLUMN IF EXISTS system_role,
ADD COLUMN role public.app_role NOT NULL DEFAULT 'user';

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update RLS policies for user_roles
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (true);

CREATE POLICY "Only admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create default admin user in auth.users (this requires admin privileges)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Insert admin user with a specific UUID
    admin_user_id := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    
    -- Insert admin user profile
    INSERT INTO public.user_profiles (
        user_id,
        email,
        display_name,
        first_name,
        last_name
    ) VALUES (
        admin_user_id,
        'admin@brainforge.com',
        'مدیر سیستم',
        'مدیر',
        'سیستم'
    ) ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign admin role
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        admin_user_id,
        'admin'
    ) ON CONFLICT (user_id, role) DO NOTHING;
    
END $$;