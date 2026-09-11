-- ارتقاء سیستم مدیریت کاربران با نقش‌های جدید و کنترل دسترسی
-- این migration سیستم کامل مدیریت کاربران را ایجاد می‌کند

-- بروزرسانی enum نقش‌ها برای اضافه کردن نقش‌های جدید
ALTER TYPE public.app_role DROP CONSTRAINT IF EXISTS app_role_check;
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM (
  'admin',           -- کاربر ادمین - تمام دسترسی‌ها
  'general_manager', -- مدیر کل - سطح اول
  'department_manager', -- مدیر بخش - سطح دوم
  'user',           -- کاربر عادی - سطح سوم
  'secretary'       -- منشی - نقش خاص
);

-- جدول اطلاعات کامل کاربران
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- اطلاعات شناسایی
  email text NOT NULL UNIQUE,
  mobile_phone text NOT NULL UNIQUE, -- شماره تلفن همراه (کلید منحصر به فرد)
  
  -- اطلاعات شخصی
  first_name text,
  last_name text,
  display_name text,
  national_id text,
  
  -- اطلاعات تماس
  office_phone text,
  home_phone text,
  address text,
  
  -- اطلاعات اداری
  employee_id text,
  department text,
  position text,
  organization_id uuid,
  
  -- وضعیت کاربر
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  mobile_verified boolean DEFAULT false,
  
  -- تاریخ‌ها
  hire_date date,
  birth_date date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- اطلاعات اضافی
  avatar_url text,
  bio text,
  notes text
);

-- ایندکس‌ها برای جدول user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_mobile_phone ON public.user_profiles(mobile_phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON public.user_profiles(organization_id);

-- جدول مجوزات سیستم
CREATE TABLE IF NOT EXISTS public.system_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_key text NOT NULL UNIQUE, -- کلید منحصر به فرد مجوز
  permission_name text NOT NULL,        -- نام نمایشی مجوز
  description text,                     -- توضیحات مجوز
  category text NOT NULL,               -- دسته‌بندی مجوز
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- جدول نقش‌های کاربر
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  system_role public.app_role NOT NULL DEFAULT 'user',
  role_name text,                       -- نام سفارشی نقش
  description text,                     -- توضیحات نقش
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  
  UNIQUE(user_id, system_role)
);

-- ایندکس‌ها برای جدول user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_system_role ON public.user_roles(system_role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);

-- جدول مجوزات نقش‌ها
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  role public.app_role NOT NULL,
  permission_id uuid REFERENCES public.system_permissions(id) ON DELETE CASCADE NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  
  UNIQUE(role, permission_id)
);

-- ایندکس‌ها برای جدول role_permissions
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions(permission_id);

-- جدول مجوزات اختصاصی کاربران
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES public.system_permissions(id) ON DELETE CASCADE NOT NULL,
  permission_type text NOT NULL CHECK (permission_type IN ('grant', 'revoke')), -- اعطا یا سلب مجوز
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  notes text,
  
  UNIQUE(user_id, permission_id)
);

-- ایندکس‌ها برای جدول user_permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON public.user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON public.user_permissions(is_active);

-- جدول گزارش فعالیت کاربران
CREATE TABLE IF NOT EXISTS public.user_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- ایندکس‌ها برای جدول user_audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.user_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user_id ON public.user_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.user_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.user_audit_log(created_at);

-- اضافه کردن مجوزات اصلی سیستم
INSERT INTO public.system_permissions (permission_key, permission_name, description, category) VALUES
-- مدیریت کاربران
('users.create', 'ایجاد کاربر', 'مجوز ایجاد کاربران جدید', 'user_management'),
('users.read', 'مشاهده کاربران', 'مجوز مشاهده اطلاعات کاربران', 'user_management'),
('users.update', 'ویرایش کاربران', 'مجوز ویرایش اطلاعات کاربران', 'user_management'),
('users.delete', 'حذف کاربران', 'مجوز حذف کاربران', 'user_management'),
('users.manage_roles', 'مدیریت نقش‌ها', 'مجوز تغییر نقش کاربران', 'user_management'),
('users.manage_permissions', 'مدیریت مجوزات', 'مجوز تغییر مجوزات کاربران', 'user_management'),

-- مدیریت سیستم
('system.admin', 'مدیریت سیستم', 'دسترسی کامل به تنظیمات سیستم', 'system'),
('system.backup', 'پشتیبان‌گیری', 'مجوز ایجاد و بازیابی پشتیبان', 'system'),
('system.logs', 'مشاهده گزارش‌ها', 'مجوز مشاهده گزارش‌های سیستم', 'system'),

-- مدیریت پروژه‌ها
('projects.create', 'ایجاد پروژه', 'مجوز ایجاد پروژه‌های جدید', 'project_management'),
('projects.read', 'مشاهده پروژه‌ها', 'مجوز مشاهده پروژه‌ها', 'project_management'),
('projects.update', 'ویرایش پروژه‌ها', 'مجوز ویرایش پروژه‌ها', 'project_management'),
('projects.delete', 'حذف پروژه‌ها', 'مجوز حذف پروژه‌ها', 'project_management'),

-- مدیریت تقویم و جلسات
('calendar.create', 'ایجاد رویداد', 'مجوز ایجاد رویدادهای تقویم', 'calendar'),
('calendar.read', 'مشاهده تقویم', 'مجوز مشاهده تقویم', 'calendar'),
('calendar.update', 'ویرایش رویدادها', 'مجوز ویرایش رویدادهای تقویم', 'calendar'),
('calendar.delete', 'حذف رویدادها', 'مجوز حذف رویدادهای تقویم', 'calendar'),

-- مدیریت محتوا
('content.create', 'ایجاد محتوا', 'مجوز ایجاد محتوای جدید', 'content'),
('content.read', 'مشاهده محتوا', 'مجوز مشاهده محتوا', 'content'),
('content.update', 'ویرایش محتوا', 'مجوز ویرایش محتوا', 'content'),
('content.delete', 'حذف محتوا', 'مجوز حذف محتوا', 'content'),

-- گزارش‌گیری
('reports.view', 'مشاهده گزارش‌ها', 'مجوز مشاهده گزارش‌ها', 'reporting'),
('reports.export', 'خروجی گزارش‌ها', 'مجوز دریافت خروجی از گزارش‌ها', 'reporting');

-- اضافه کردن مجوزات پیش‌فرض برای هر نقش
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'admin', id FROM public.system_permissions; -- ادمین همه مجوزات را دارد

-- مدیر کل
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'general_manager', id FROM public.system_permissions 
WHERE permission_key NOT IN ('system.admin', 'users.delete', 'system.backup');

-- مدیر بخش
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'department_manager', id FROM public.system_permissions 
WHERE category IN ('project_management', 'calendar', 'content', 'reporting')
   OR permission_key IN ('users.read', 'users.update');

-- کاربر عادی
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'user', id FROM public.system_permissions 
WHERE permission_key IN ('calendar.read', 'content.read', 'reports.view');

-- منشی
INSERT INTO public.role_permissions (role, permission_id) 
SELECT 'secretary', id FROM public.system_permissions 
WHERE category IN ('calendar', 'content') 
   OR permission_key IN ('users.read', 'reports.view');

-- تریگر برای بروزرسانی updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON public.user_profiles 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- تابع برای بررسی مجوزات کاربر
CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_user_id uuid,
  p_permission_key text
) RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  WITH user_role AS (
    SELECT ur.system_role
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id 
      AND ur.is_active = true
    LIMIT 1
  ),
  role_permission AS (
    SELECT 1 as has_permission
    FROM public.role_permissions rp
    JOIN public.system_permissions sp ON rp.permission_id = sp.id
    JOIN user_role ur ON rp.role = ur.system_role
    WHERE sp.permission_key = p_permission_key 
      AND rp.is_active = true
      AND sp.is_active = true
  ),
  user_permission AS (
    SELECT 
      CASE 
        WHEN up.permission_type = 'grant' THEN 1
        WHEN up.permission_type = 'revoke' THEN -1
        ELSE 0
      END as permission_value
    FROM public.user_permissions up
    JOIN public.system_permissions sp ON up.permission_id = sp.id
    WHERE up.user_id = p_user_id 
      AND sp.permission_key = p_permission_key
      AND up.is_active = true
      AND sp.is_active = true
      AND (up.expires_at IS NULL OR up.expires_at > now())
    ORDER BY up.granted_at DESC
    LIMIT 1
  )
  SELECT COALESCE(
    (SELECT permission_value > 0 FROM user_permission),
    (SELECT has_permission = 1 FROM role_permission),
    false
  );
$$;

-- تابع برای دریافت نقش کاربر
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
RETURNS public.app_role
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT ur.system_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id 
    AND ur.is_active = true
  ORDER BY ur.assigned_at DESC
  LIMIT 1;
$$;

-- تابع برای ثبت فعالیت در audit log
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_action text,
  p_resource_type text DEFAULT NULL,
  p_resource_id uuid DEFAULT NULL,
  p_target_user_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_audit_log (
    user_id, 
    target_user_id, 
    action, 
    resource_type, 
    resource_id, 
    details
  ) VALUES (
    p_user_id, 
    p_target_user_id, 
    p_action, 
    p_resource_type, 
    p_resource_id, 
    p_details
  );
END;
$$;

-- Row Level Security (RLS) Policies

-- فعال کردن RLS برای جداول
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_audit_log ENABLE ROW LEVEL SECURITY;

-- سیاست‌های RLS برای user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'general_manager', 'department_manager')
  );

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all profiles" ON public.user_profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- سیاست‌های RLS برای user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins and managers can view all roles" ON public.user_roles
  FOR SELECT USING (
    public.get_user_role(auth.uid()) IN ('admin', 'general_manager')
  );

CREATE POLICY "Only admins can manage roles" ON public.user_roles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- سیاست‌های RLS برای user_permissions
CREATE POLICY "Users can view their own permissions" ON public.user_permissions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all permissions" ON public.user_permissions
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- سیاست‌های RLS برای user_audit_log
CREATE POLICY "Admins can view all audit logs" ON public.user_audit_log
  FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Users can view their own audit logs" ON public.user_audit_log
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = target_user_id);

-- تریگر برای ایجاد پروفایل کاربر پس از ثبت‌نام
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- ایجاد پروفایل پایه برای کاربر جدید
  INSERT INTO public.user_profiles (user_id, email, display_name)
  VALUES (
    NEW.id, 
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  
  -- اختصاص نقش پیش‌فرض
  INSERT INTO public.user_roles (user_id, system_role)
  VALUES (NEW.id, 'user');
  
  -- ثبت فعالیت
  PERFORM public.log_user_activity(
    NEW.id,
    'user_registered',
    'user_profiles',
    NEW.id,
    NULL,
    jsonb_build_object('email', NEW.email)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ایجاد تریگر برای کاربران جدید
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
