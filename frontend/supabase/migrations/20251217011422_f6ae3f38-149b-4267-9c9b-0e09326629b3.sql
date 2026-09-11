-- Create networking_contacts table
CREATE TABLE public.networking_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.business_companies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Contact info
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  organization_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  linkedin_url TEXT,
  photo_url TEXT,
  
  -- Networking info
  category VARCHAR(50) DEFAULT 'contact',
  relationship_strength INTEGER DEFAULT 3 CHECK (relationship_strength >= 1 AND relationship_strength <= 5),
  networking_goal TEXT,
  how_met TEXT,
  met_at_event VARCHAR(255),
  met_date DATE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'active',
  last_interaction_date TIMESTAMPTZ,
  next_followup_date TIMESTAMPTZ,
  
  -- Tags and notes
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create networking_interactions table
CREATE TABLE public.networking_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES public.networking_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  interaction_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  interaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER,
  
  outcome VARCHAR(100),
  follow_up_action TEXT,
  follow_up_date TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create networking_goals table
CREATE TABLE public.networking_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.business_companies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_count INTEGER DEFAULT 1,
  current_count INTEGER DEFAULT 0,
  category VARCHAR(50),
  deadline DATE,
  status VARCHAR(50) DEFAULT 'active',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create networking_events table
CREATE TABLE public.networking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.business_companies(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  event_type VARCHAR(50),
  location VARCHAR(255),
  event_date TIMESTAMPTZ,
  
  contacts_made INTEGER DEFAULT 0,
  follow_ups_scheduled INTEGER DEFAULT 0,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.networking_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.networking_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for networking_contacts
CREATE POLICY "Users can view their own networking contacts"
ON public.networking_contacts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own networking contacts"
ON public.networking_contacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking contacts"
ON public.networking_contacts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking contacts"
ON public.networking_contacts FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for networking_interactions
CREATE POLICY "Users can view their own networking interactions"
ON public.networking_interactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own networking interactions"
ON public.networking_interactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking interactions"
ON public.networking_interactions FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking interactions"
ON public.networking_interactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for networking_goals
CREATE POLICY "Users can view their own networking goals"
ON public.networking_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own networking goals"
ON public.networking_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking goals"
ON public.networking_goals FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking goals"
ON public.networking_goals FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for networking_events
CREATE POLICY "Users can view their own networking events"
ON public.networking_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own networking events"
ON public.networking_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own networking events"
ON public.networking_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own networking events"
ON public.networking_events FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_networking_contacts_updated_at
BEFORE UPDATE ON public.networking_contacts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_networking_goals_updated_at
BEFORE UPDATE ON public.networking_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_networking_contacts_user_id ON public.networking_contacts(user_id);
CREATE INDEX idx_networking_contacts_company_id ON public.networking_contacts(company_id);
CREATE INDEX idx_networking_contacts_organization_id ON public.networking_contacts(organization_id);
CREATE INDEX idx_networking_contacts_status ON public.networking_contacts(status);
CREATE INDEX idx_networking_interactions_contact_id ON public.networking_interactions(contact_id);
CREATE INDEX idx_networking_goals_user_id ON public.networking_goals(user_id);
CREATE INDEX idx_networking_events_user_id ON public.networking_events(user_id);