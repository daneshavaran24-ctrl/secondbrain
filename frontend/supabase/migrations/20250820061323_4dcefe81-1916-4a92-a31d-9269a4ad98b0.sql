-- Clean up existing admin user with wrong UUID to prevent conflicts
DELETE FROM auth.users WHERE email = 'admin@brainforge.com' AND id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Also clean up any associated profiles and roles
DELETE FROM public.user_profiles WHERE email = 'admin@brainforge.com' AND user_id != 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);