-- حذف تمام policies موجود برای user_organizations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_organizations'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_organizations';
    END LOOP;
END $$;

-- حذف تمام policies موجود برای organization_invitations
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'organization_invitations'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.organization_invitations';
    END LOOP;
END $$;

-- ایجاد جدول کمکی برای ذخیره نقش‌های کاربران
CREATE TABLE IF NOT EXISTS public.user_organization_roles_cache (
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  role organization_role NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_organization_roles_cache ENABLE ROW LEVEL SECURITY;

-- Policy برای خواندن cache
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_organization_roles_cache'
    AND policyname = 'Users can view their own role cache'
  ) THEN
    CREATE POLICY "Users can view their own role cache"
    ON public.user_organization_roles_cache FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());
  END IF;
END $$;

-- Function برای به‌روزرسانی cache
CREATE OR REPLACE FUNCTION public.update_user_org_role_cache()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_organization_roles_cache (user_id, organization_id, role)
    VALUES (NEW.user_id, NEW.organization_id, NEW.role::organization_role)
    ON CONFLICT (user_id, organization_id) 
    DO UPDATE SET role = NEW.role::organization_role, updated_at = now();
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.user_organization_roles_cache
    WHERE user_id = OLD.user_id AND organization_id = OLD.organization_id;
    RETURN OLD;
  END IF;
END;
$$;

-- Trigger برای به‌روزرسانی خودکار cache
DROP TRIGGER IF EXISTS update_role_cache_trigger ON public.user_organizations;
CREATE TRIGGER update_role_cache_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.user_organizations
FOR EACH ROW EXECUTE FUNCTION public.update_user_org_role_cache();

-- RLS Policies جدید (بدون recursion)
CREATE POLICY "Users can view their memberships"
ON public.user_organizations FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all members"
ON public.user_organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = user_organizations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can add members"
ON public.user_organizations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = user_organizations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update members"
ON public.user_organizations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = user_organizations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can remove members"
ON public.user_organizations FOR DELETE
TO authenticated
USING (
  user_organizations.user_id != auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = user_organizations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

-- Policies برای organization_invitations
CREATE POLICY "Users can view invitations"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = organization_invitations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can create invitations"
ON public.organization_invitations FOR INSERT
TO authenticated
WITH CHECK (
  invited_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = organization_invitations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can update their invitations"
ON public.organization_invitations FOR UPDATE
TO authenticated
USING (
  invited_by = auth.uid() OR
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Admins can delete invitations"
ON public.organization_invitations FOR DELETE
TO authenticated
USING (
  invited_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_organization_roles_cache c
    WHERE c.user_id = auth.uid()
      AND c.organization_id = organization_invitations.organization_id
      AND c.role IN ('owner', 'admin')
  )
);

-- پر کردن cache با داده‌های موجود
INSERT INTO public.user_organization_roles_cache (user_id, organization_id, role)
SELECT user_id, organization_id, role::organization_role
FROM public.user_organizations
WHERE role IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ایجاد index برای بهبود performance
CREATE INDEX IF NOT EXISTS idx_user_org_roles_cache_user_id ON public.user_organization_roles_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_cache_org_id ON public.user_organization_roles_cache(organization_id);