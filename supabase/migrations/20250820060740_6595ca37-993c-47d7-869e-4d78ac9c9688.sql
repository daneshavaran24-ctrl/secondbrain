-- Just set up the role system without creating admin user yet
-- The roles have been updated, now let's create the admin management functions

-- Function to create admin user (will be called from Edge Function)
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_user_id uuid := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
    result jsonb;
BEGIN
    -- Insert or update admin user profile
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
    ) ON CONFLICT (user_id) DO UPDATE SET
        email = EXCLUDED.email,
        display_name = EXCLUDED.display_name,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name;
    
    -- Assign admin role
    INSERT INTO public.user_roles (
        user_id,
        role
    ) VALUES (
        admin_user_id,
        'admin'
    ) ON CONFLICT (user_id) DO UPDATE SET
        role = EXCLUDED.role;
    
    result := jsonb_build_object(
        'success', true,
        'user_id', admin_user_id,
        'message', 'Admin user profile and role created successfully'
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END $$;

-- Function to reset admin password (helper for CLI)
CREATE OR REPLACE FUNCTION public.get_admin_info()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN jsonb_build_object(
        'admin_user_id', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'admin_email', 'admin@brainforge.com',
        'default_password', 'Admin123456!',
        'message', 'Use these credentials for admin access'
    );
END $$;