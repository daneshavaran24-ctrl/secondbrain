-- مستقیماً کاربر admin رو در auth.users ایجاد می‌کنم
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    email_confirmed_at,
    encrypted_password,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    auth_method,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    confirmed_at,
    confirmation_sent_at,
    recovery_sent_at,
    email_change_sent_at,
    email_change_token_current_segment,
    email_change_token_new_segment,
    is_super_admin,
    created_at,
    updated_at,
    phone_change_token_status,
    email_change_token_status,
    raw_app_meta_data,
    raw_user_meta_data,
    is_sso_user,
    deleted_at,
    is_anonymous
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@brainforge.com',
    now(),
    crypt('Admin123456!', gen_salt('bf')),
    '',
    '',
    '',
    '',
    '',
    0,
    null,
    'email',
    null,
    null,
    '',
    '',
    null,
    now(),
    now(),
    null,
    null,
    '',
    '',
    false,
    now(),
    now(),
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"مدیر سیستم","first_name":"مدیر","last_name":"سیستم"}',
    false,
    null,
    false
) ON CONFLICT (id) DO UPDATE SET
    email_confirmed_at = now(),
    confirmed_at = now();

-- حالا پروفایل و نقش رو ایجاد می‌کنم
INSERT INTO public.user_profiles (
    user_id,
    email,
    display_name,
    first_name,
    last_name
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin@brainforge.com',
    'مدیر سیستم',
    'مدیر',
    'سیستم'
) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = EXCLUDED.display_name;

-- نقش admin رو اختصاص می‌دهم
INSERT INTO public.user_roles (
    user_id,
    system_role
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'admin'
) ON CONFLICT (user_id) DO UPDATE SET
    system_role = EXCLUDED.system_role;