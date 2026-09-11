-- فاز 1: اصلاح RLS Policies برای user_organizations
-- اجازه به owner برای اضافه کردن خودش به سازمان

-- حذف policy قدیمی اگر وجود دارد
DROP POLICY IF EXISTS "Organization owners can add themselves" ON public.user_organizations;

-- اضافه کردن policy جدید برای owners
CREATE POLICY "Organization owners can add themselves"
ON public.user_organizations
FOR INSERT
TO authenticated
WITH CHECK (
  -- owner سازمان می‌تواند خودش را به عنوان عضو اضافه کند
  EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = user_organizations.organization_id
    AND o.user_id = auth.uid()
    AND user_organizations.user_id = auth.uid()
  )
);