-- Fix calendar_events table - add missing columns
ALTER TABLE calendar_events 
ADD COLUMN IF NOT EXISTS attendance_type TEXT CHECK (attendance_type IN ('in_person', 'virtual', 'hybrid')),
ADD COLUMN IF NOT EXISTS organizer TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'IRR',
ADD COLUMN IF NOT EXISTS capacity INTEGER,
ADD COLUMN IF NOT EXISTS registration_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS reminders JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preparation_checklist JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];