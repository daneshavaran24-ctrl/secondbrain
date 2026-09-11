-- فاز 3: Populate کردن user_organizations برای سازمان‌های موجود
-- اضافه کردن owners به user_organizations
INSERT INTO public.user_organizations (user_id, organization_id, role, position_title)
SELECT 
  o.user_id,
  o.id,
  'owner',
  'مالک'
FROM public.organizations o
WHERE o.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_organizations uo
    WHERE uo.user_id = o.user_id AND uo.organization_id = o.id
  );