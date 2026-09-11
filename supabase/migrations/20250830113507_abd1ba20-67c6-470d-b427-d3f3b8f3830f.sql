
-- 1) حذف سیاست SELECT بسیار باز موجود (اگر وجود داشته باشد)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'organizational_missions' 
      AND policyname = 'Users can view all missions'
  ) THEN
    DROP POLICY "Users can view all missions" ON public.organizational_missions;
  END IF;
END $$;

-- 2) ایجاد سیاست‌های SELECT ایمن‌تر
-- مشاهده مأموریت‌های سازمان خود کاربر
CREATE POLICY "Users can view missions of their organization"
  ON public.organizational_missions
  FOR SELECT
  USING (
    organization_id IS NOT NULL 
    AND organization_id = get_current_user_organization()
  );

-- مشاهده مأموریت‌های متعلق به خود کاربر (اگر org ست نشده یا شخصی باشد)
CREATE POLICY "Users can view their own missions"
  ON public.organizational_missions
  FOR SELECT
  USING (user_id = auth.uid());

-- 3) تریگر به‌روزرسانی خودکار updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'set_timestamp_organizational_missions'
  ) THEN
    CREATE TRIGGER set_timestamp_organizational_missions
    BEFORE UPDATE ON public.organizational_missions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) ایندکس‌ها برای بهبود کارایی کوئری‌ها
CREATE INDEX IF NOT EXISTS idx_org_missions_org_status 
  ON public.organizational_missions (organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_missions_user 
  ON public.organizational_missions (user_id);

CREATE INDEX IF NOT EXISTS idx_org_missions_deadline 
  ON public.organizational_missions (deadline);
