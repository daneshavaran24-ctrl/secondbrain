-- اضافه کردن ستون is_active به جدول organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL;

-- اضافه کردن index برای بهبود performance
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);