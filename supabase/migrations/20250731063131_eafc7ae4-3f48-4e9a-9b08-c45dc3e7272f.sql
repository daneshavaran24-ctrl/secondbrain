-- Add family_member field to calendar_events table
ALTER TABLE public.calendar_events 
ADD COLUMN family_member text;

-- Add comment to explain the new column
COMMENT ON COLUMN public.calendar_events.family_member IS 'Family member associated with the event (for personal domain events)';