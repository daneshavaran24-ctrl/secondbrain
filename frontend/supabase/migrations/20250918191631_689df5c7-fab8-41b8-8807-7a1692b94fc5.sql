-- پاکسازی کامل داده‌های تستی با حفظ ترتیب foreign key
-- حذف پیام‌های چت هوش مصنوعی
DELETE FROM ai_chat_messages;

-- حذف جلسات چت هوش مصنوعی
DELETE FROM ai_chat_sessions WHERE user_id IS NOT NULL;

-- حذف رویدادهای تقویم
DELETE FROM calendar_events;

-- حذف مطالب دانش
DELETE FROM knowledge_base;

-- حذف ورودی‌های سپاسگزاری
DELETE FROM gratitude_entries;

-- حذف ایده‌ها
DELETE FROM ideas;

-- حذف لاگ‌های پیشرفت ماموریت
DELETE FROM mission_progress_logs;

-- حذف ماموریت‌های سازمانی
DELETE FROM organizational_missions;

-- حذف خواسته‌های سازمانی
DELETE FROM organization_claims;

-- حذف سازمان‌های تستی (حفظ سازمان پیش‌فرض)
DELETE FROM organizations WHERE name != 'سازمان پیش‌فرض' AND name != 'Default Organization';

-- حذف پروفایل‌های کاربری تستی (حفظ ادمین)
DELETE FROM user_profiles WHERE email != 'admin@brainforge.com' AND user_id != (
  SELECT user_id FROM user_roles WHERE system_role = 'admin' LIMIT 1
);

-- بازنشانی شمارنده‌های خودکار sequences (اختیاری)
-- این کار برای تمیز نگه داشتن ID ها مفید است
SELECT setval(pg_get_serial_sequence('ideas', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('calendar_events', 'id'), 1, false);