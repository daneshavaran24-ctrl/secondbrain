-- کاربر admin رو بدون confirmed_at ایجاد می‌کنم
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at,
    is_sso_user,
    deleted_at,
    is_anonymous
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@brainforge.com',
    crypt('Admin123456!', gen_salt('bf')),
    now(),
    '',
    now(),
    '',
    null,
    '',
    '',
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"display_name":"مدیر سیستم","first_name":"مدیر","last_name":"سیستم"}',
    false,
    now(),
    now(),
    null,
    null,
    '',
    '',
    null,
    '',
    0,
    null,
    '',
    null,
    false,
    null,
    false
) ON CONFLICT (id) DO UPDATE SET
    email_confirmed_at = now(),
    encrypted_password = crypt('Admin123456!', gen_salt('bf'));

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