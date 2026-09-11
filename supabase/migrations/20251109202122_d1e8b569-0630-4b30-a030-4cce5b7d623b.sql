-- اضافه کردن فیلدهای جدید به جدول organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT;

-- ایجاد storage bucket برای لوگوهای سازمان‌ها
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-logos',
  'organization-logos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies برای storage bucket
CREATE POLICY "Users can view organization logos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'organization-logos');

CREATE POLICY "Users can upload logos for their organizations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos' 
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update logos for their organizations"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete logos for their organizations"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.organizations WHERE user_id = auth.uid()
  )
);

-- بررسی وجود policy برای update organizations (اگر نباشد اضافه می‌کنیم)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'organizations' 
    AND policyname = 'Users can update their own organizations'
  ) THEN
    CREATE POLICY "Users can update their own organizations"
    ON public.organizations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;