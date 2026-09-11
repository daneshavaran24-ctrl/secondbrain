-- Add new columns to calendar_events table for enhanced event planning
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IRR',
ADD COLUMN IF NOT EXISTS attendance_type TEXT DEFAULT 'in_person',
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS registration_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preparation_checklist JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_event_type ON calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_tags ON calendar_events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON calendar_events(start_time);