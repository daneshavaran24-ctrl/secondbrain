-- =====================================================
-- فاز 1: ایجاد جداول و ساختار داده برای سیستم Sub-Users
-- =====================================================

-- جدول کاربران فرعی (Sub-Users)
CREATE TABLE IF NOT EXISTS public.sub_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  is_active boolean DEFAULT true,
  expires_at timestamptz NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- اضافه کردن foreign key اگر وجود ندارد
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sub_users_owner_id_fkey' 
    AND table_name = 'sub_users'
  ) THEN
    ALTER TABLE public.sub_users 
    ADD CONSTRAINT sub_users_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- جدول دسترسی‌های حوزه‌ای (Domain-Scoped Permissions)
CREATE TABLE IF NOT EXISTS public.sub_user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_user_id uuid NOT NULL,
  domain text NOT NULL,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(sub_user_id, domain)
);

-- اضافه کردن foreign key برای sub_user_permissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sub_user_permissions_sub_user_id_fkey' 
    AND table_name = 'sub_user_permissions'
  ) THEN
    ALTER TABLE public.sub_user_permissions 
    ADD CONSTRAINT sub_user_permissions_sub_user_id_fkey 
    FOREIGN KEY (sub_user_id) REFERENCES public.sub_users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- جدول لاگ احراز هویت و دسترسی (Audit Log)
CREATE TABLE IF NOT EXISTS public.auth_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('owner', 'sub_user', 'admin')),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ایجاد ایندکس‌ها برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_sub_users_owner_id ON public.sub_users(owner_id);
CREATE INDEX IF NOT EXISTS idx_sub_users_email ON public.sub_users(email);
CREATE INDEX IF NOT EXISTS idx_sub_user_permissions_sub_user_id ON public.sub_user_permissions(sub_user_id);
CREATE INDEX IF NOT EXISTS idx_sub_user_permissions_domain ON public.sub_user_permissions(domain);
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor_id ON public.auth_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit(created_at DESC);

-- =====================================================
-- فاز 2: تابع محدودیت 3 کاربر فرعی
-- =====================================================

-- تابع بررسی تعداد کاربران فرعی
CREATE OR REPLACE FUNCTION public.check_sub_user_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_user_count integer;
BEGIN
  -- شمارش تعداد کاربران فرعی فعال برای این owner
  SELECT COUNT(*) INTO sub_user_count
  FROM public.sub_users
  WHERE owner_id = NEW.owner_id AND is_active = true;
  
  -- اگر تعداد از 3 بیشتر شد، خطا بده
  IF sub_user_count >= 3 THEN
    RAISE EXCEPTION 'هر مالک فقط می‌تواند حداکثر 3 کاربر فرعی فعال داشته باشد'
      USING ERRCODE = 'check_violation',
            HINT = 'برای افزودن کاربر جدید، ابتدا یکی از کاربران فعلی را غیرفعال کنید';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger برای اعمال محدودیت 3 کاربر
DROP TRIGGER IF EXISTS enforce_sub_user_limit ON public.sub_users;
CREATE TRIGGER enforce_sub_user_limit
  BEFORE INSERT OR UPDATE OF is_active ON public.sub_users
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION public.check_sub_user_limit();

-- =====================================================
-- تابع‌های کمکی برای بروزرسانی updated_at
-- =====================================================

-- Trigger برای sub_users
DROP TRIGGER IF EXISTS update_sub_users_updated_at ON public.sub_users;
CREATE TRIGGER update_sub_users_updated_at
  BEFORE UPDATE ON public.sub_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger برای sub_user_permissions
DROP TRIGGER IF EXISTS update_sub_user_permissions_updated_at ON public.sub_user_permissions;
CREATE TRIGGER update_sub_user_permissions_updated_at
  BEFORE UPDATE ON public.sub_user_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- تابع security definer برای بررسی نوع کاربر
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_type(user_id_param uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN EXISTS (SELECT 1 FROM public.sub_users WHERE id = user_id_param) THEN 'sub_user'
    WHEN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id_param) THEN 'owner'
    ELSE 'unknown'
  END;
$$;

-- تابع برای دریافت owner_id یک sub_user
CREATE OR REPLACE FUNCTION public.get_owner_id(user_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.sub_users WHERE id = user_id_param;
$$;

-- تابع برای بررسی دسترسی حوزه‌ای
CREATE OR REPLACE FUNCTION public.has_domain_access(
  user_id_param uuid,
  domain_param text,
  permission_param text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_type text;
  has_access boolean;
BEGIN
  user_type := public.get_user_type(user_id_param);
  
  IF user_type = 'owner' THEN
    RETURN true;
  END IF;
  
  IF user_type = 'sub_user' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.sub_user_permissions
      WHERE sub_user_id = user_id_param
        AND domain = domain_param
        AND permission_param = ANY(permissions)
    ) INTO has_access;
    
    RETURN has_access;
  END IF;
  
  RETURN false;
END;
$$;

-- =====================================================
-- RLS Policies
-- =====================================================

ALTER TABLE public.sub_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their sub users" ON public.sub_users;
CREATE POLICY "Owners can view their sub users"
  ON public.sub_users FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can create sub users" ON public.sub_users;
CREATE POLICY "Owners can create sub users"
  ON public.sub_users FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can update their sub users" ON public.sub_users;
CREATE POLICY "Owners can update their sub users"
  ON public.sub_users FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their sub users" ON public.sub_users;
CREATE POLICY "Owners can delete their sub users"
  ON public.sub_users FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage sub user permissions" ON public.sub_user_permissions;
CREATE POLICY "Owners can manage sub user permissions"
  ON public.sub_user_permissions FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.sub_users
      WHERE sub_users.id = sub_user_permissions.sub_user_id
        AND sub_users.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Sub users can view their own permissions" ON public.sub_user_permissions;
CREATE POLICY "Sub users can view their own permissions"
  ON public.sub_user_permissions FOR SELECT TO authenticated
  USING (sub_user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can view audit logs" ON public.auth_audit;
CREATE POLICY "Owners can view audit logs"
  ON public.auth_audit FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid())
    AND (
      actor_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.sub_users
        WHERE sub_users.id = auth_audit.actor_id
          AND sub_users.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "System can create audit logs" ON public.auth_audit;
CREATE POLICY "System can create audit logs"
  ON public.auth_audit FOR INSERT TO authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.sub_users IS 'کاربران فرعی که توسط owners ایجاد می‌شوند (حداکثر 3 کاربر فعال به ازای هر owner)';
COMMENT ON TABLE public.sub_user_permissions IS 'دسترسی‌های حوزه‌ای (domain-scoped) برای هر کاربر فرعی';
COMMENT ON TABLE public.auth_audit IS 'لاگ‌های احراز هویت و عملیات کاربران برای امنیت و پیگیری';