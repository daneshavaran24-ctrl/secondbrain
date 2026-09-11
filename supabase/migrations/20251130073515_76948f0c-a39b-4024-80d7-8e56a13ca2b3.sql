-- Create company_calls table for tracking business calls
CREATE TABLE IF NOT EXISTS public.company_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.business_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Call information
  title TEXT NOT NULL,
  call_type TEXT DEFAULT 'phone' CHECK (call_type IN ('phone', 'video', 'online_meeting')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  
  -- Contact information
  contact_id UUID REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_organization TEXT,
  
  -- Time and duration
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  scheduled_date TIMESTAMPTZ,
  
  -- Status and outcome
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
  outcome TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Notes and follow-up
  notes TEXT,
  summary TEXT,
  follow_up_actions JSONB DEFAULT '[]'::jsonb,
  follow_up_date TIMESTAMPTZ,
  
  -- Categories and tags
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Recording
  has_recording BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  transcript TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.company_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company calls"
  ON public.company_calls
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.business_companies WHERE id = company_calls.company_id
    )
  );

CREATE POLICY "Users can create calls for their companies"
  ON public.company_calls
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM public.business_companies WHERE id = company_calls.company_id
    )
  );

CREATE POLICY "Users can update their company calls"
  ON public.company_calls
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.business_companies WHERE id = company_calls.company_id
    )
  );

CREATE POLICY "Users can delete their company calls"
  ON public.company_calls
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.business_companies WHERE id = company_calls.company_id
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_company_calls_company_id ON public.company_calls(company_id);
CREATE INDEX idx_company_calls_contact_id ON public.company_calls(contact_id);
CREATE INDEX idx_company_calls_call_date ON public.company_calls(call_date);
CREATE INDEX idx_company_calls_status ON public.company_calls(status);

-- Trigger for updated_at
CREATE TRIGGER update_company_calls_updated_at
  BEFORE UPDATE ON public.company_calls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_company_updated_at();