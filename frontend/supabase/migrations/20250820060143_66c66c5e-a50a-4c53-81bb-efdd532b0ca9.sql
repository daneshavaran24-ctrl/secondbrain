-- Fix missing tables and add required tables for calendar and gratitude functionality

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    domain TEXT NOT NULL DEFAULT 'personal' CHECK (domain IN ('personal', 'professional', 'organizational')),
    event_type TEXT DEFAULT 'event',
    location TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    color TEXT DEFAULT '#3B82F6',
    all_day BOOLEAN DEFAULT false,
    family_member TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gratitude_entries table
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    date DATE NOT NULL,
    gratitude_item_1 TEXT NOT NULL,
    gratitude_item_2 TEXT,
    gratitude_item_3 TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for calendar_events
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own calendar events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own calendar events" 
ON public.calendar_events 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own calendar events" 
ON public.calendar_events 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create RLS policies for gratitude_entries
CREATE POLICY "Users can view their own gratitude entries" 
ON public.gratitude_entries 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create their own gratitude entries" 
ON public.gratitude_entries 
FOR INSERT 
WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own gratitude entries" 
ON public.gratitude_entries 
FOR UPDATE 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can delete their own gratitude entries" 
ON public.gratitude_entries 
FOR DELETE 
USING (auth.uid()::text = user_id::text);

-- Create triggers for updated_at
CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gratitude_entries_updated_at
    BEFORE UPDATE ON public.gratitude_entries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_domain ON public.calendar_events(domain);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON public.gratitude_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_date ON public.gratitude_entries(date);