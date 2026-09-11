-- Add unique constraint for upsert to work correctly on gratitude_entries
ALTER TABLE public.gratitude_entries 
ADD CONSTRAINT gratitude_entries_user_date_unique 
UNIQUE (user_id, date);