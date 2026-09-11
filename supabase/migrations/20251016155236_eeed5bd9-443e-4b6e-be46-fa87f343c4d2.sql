-- افزودن فیلدهای جدید به جدول MeetingResolution
-- نکته: چون از localStorage استفاده می‌شود، این migration فقط برای مستندسازی است

-- افزودن فیلدهای مورد نیاز برای سیستم پیگیری مصوبات پیشرفته
-- این تغییرات در سرویس professionalMeetingService.ts پیاده‌سازی می‌شوند

-- افزودن فیلدهای زیر به interface MeetingResolution:
-- responsible_parties: { user_id: string; user_name: string; role: 'primary' | 'secondary' | 'reviewer'; assigned_at: string }[]
-- activity_log: { id: string; user_id: string; user_name: string; action: string; details: any; timestamp: string }[]
-- comments: { id: string; user_id: string; user_name: string; comment: string; created_at: string }[]
-- reminders: { id: string; reminder_type: string; days_before?: number; is_sent: boolean; scheduled_at: string }[]
-- linked_task_id: string
-- auto_create_task: boolean

-- این تغییرات در types/index.ts و professionalMeetingService.ts اعمال خواهند شد