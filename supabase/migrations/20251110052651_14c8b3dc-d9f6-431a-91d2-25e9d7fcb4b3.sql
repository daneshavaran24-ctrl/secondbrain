-- حذف سازمان تست "سازمان شماره یک"
-- این سازمان داده‌های قدیمی است که باید پاکسازی شود

-- ابتدا رکوردهای user_organizations مرتبط را حذف کنیم
DELETE FROM user_organizations 
WHERE organization_id IN (
  SELECT id FROM organizations 
  WHERE name = 'سازمان شماره یک' 
  AND user_id = '305ff32a-4a43-49fb-9e76-777f7431ebe9'
);

-- سپس خود سازمان را حذف کنیم
DELETE FROM organizations 
WHERE name = 'سازمان شماره یک' 
AND user_id = '305ff32a-4a43-49fb-9e76-777f7431ebe9';