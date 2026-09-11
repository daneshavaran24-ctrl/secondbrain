-- RLS Policies برای bucket documents

-- حذف پالیسی‌های قبلی اگر وجود دارد
DROP POLICY IF EXISTS "Users can upload own company files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own company files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own company files" ON storage.objects;

-- فقط کاربر می‌تواند فایل‌های خودش را آپلود کند
CREATE POLICY "Users can upload own company files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- فقط کاربر می‌تواند فایل‌های خودش را ببیند
CREATE POLICY "Users can view own company files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- فقط کاربر می‌تواند فایل‌های خودش را حذف کند
CREATE POLICY "Users can delete own company files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );