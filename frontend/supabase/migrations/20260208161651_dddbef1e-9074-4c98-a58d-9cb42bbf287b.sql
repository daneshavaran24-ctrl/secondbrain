-- اضافه کردن جداول مهم به Supabase Realtime Publication
-- این باعث می‌شود که تغییرات دیتابیس به کلاینت ارسال شود

ALTER PUBLICATION supabase_realtime ADD TABLE gratitude_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE health_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE knowledge_base;
ALTER PUBLICATION supabase_realtime ADD TABLE ideas;
ALTER PUBLICATION supabase_realtime ADD TABLE habits;
ALTER PUBLICATION supabase_realtime ADD TABLE habit_completions;
ALTER PUBLICATION supabase_realtime ADD TABLE csr_projects;
ALTER PUBLICATION supabase_realtime ADD TABLE delegation_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;