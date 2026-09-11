-- Organization Management System Tables (Fixed)

-- 1. Policy and Mission Management
CREATE TABLE public.organization_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL DEFAULT 'strategic', -- strategic, operational, annual, quarterly
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, active, archived
  priority priority DEFAULT 'medium',
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  effective_date DATE,
  review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. KPIs and Targets
CREATE TABLE public.organization_kpis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  policy_id UUID REFERENCES organization_policies(id),
  name TEXT NOT NULL,
  description TEXT,
  target_value NUMERIC,
  current_value NUMERIC DEFAULT 0,
  unit TEXT,
  measurement_period TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly, yearly
  status TEXT DEFAULT 'active', -- active, paused, completed
  responsible_person TEXT,
  deadline DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Succession Planning
CREATE TABLE public.succession_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  position_title TEXT NOT NULL,
  department TEXT,
  is_critical BOOLEAN DEFAULT false,
  current_holder TEXT,
  required_skills TEXT[],
  responsibilities TEXT,
  succession_urgency TEXT DEFAULT 'normal', -- low, normal, high, critical
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.succession_candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id UUID NOT NULL REFERENCES succession_positions(id),
  candidate_name TEXT NOT NULL,
  role_title TEXT,
  readiness_level INTEGER DEFAULT 1, -- 1-5 scale
  development_needs TEXT[],
  training_completed TEXT[],
  mentoring_status TEXT DEFAULT 'not_started', -- not_started, in_progress, completed
  assessment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Claims Tracking
CREATE TABLE public.organization_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  claim_type TEXT NOT NULL, -- financial, legal, service, technical, hr
  source TEXT DEFAULT 'internal', -- internal, external, public
  claimant_name TEXT,
  claimant_contact TEXT,
  status TEXT DEFAULT 'registered', -- registered, investigating, responded, closed
  priority priority DEFAULT 'medium',
  assigned_to TEXT,
  response_deadline DATE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Meeting Minutes and Resolutions
CREATE TABLE public.organization_meeting_minutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  meeting_title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  attendees TEXT[],
  agenda TEXT,
  minutes_content TEXT,
  attachments TEXT[],
  meeting_type TEXT DEFAULT 'regular', -- regular, emergency, board, strategic
  status TEXT DEFAULT 'draft', -- draft, approved, archived
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.meeting_resolutions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES organization_meeting_minutes(id),
  resolution_text TEXT NOT NULL,
  responsible_person TEXT,
  deadline DATE,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, overdue
  implementation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Risk Assessment
CREATE TABLE public.organization_risks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  risk_title TEXT NOT NULL,
  description TEXT,
  risk_category TEXT NOT NULL, -- internal, environmental, technology, financial, operational, strategic
  probability INTEGER DEFAULT 1 CHECK (probability >= 1 AND probability <= 5), -- 1-5 scale
  impact INTEGER DEFAULT 1 CHECK (impact >= 1 AND impact <= 5), -- 1-5 scale
  risk_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN (probability * impact) <= 6 THEN 'low'
      WHEN (probability * impact) <= 12 THEN 'medium'
      WHEN (probability * impact) <= 20 THEN 'high'
      ELSE 'critical'
    END
  ) STORED,
  mitigation_strategy TEXT,
  contingency_plan TEXT,
  responsible_person TEXT,
  status TEXT DEFAULT 'active', -- active, mitigated, accepted, transferred
  last_review_date DATE,
  next_review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_risks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage organization policies" ON public.organization_policies
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage organization KPIs" ON public.organization_kpis
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage succession positions" ON public.succession_positions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage succession candidates" ON public.succession_candidates
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage organization claims" ON public.organization_claims
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage meeting minutes" ON public.organization_meeting_minutes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage meeting resolutions" ON public.meeting_resolutions
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage organization risks" ON public.organization_risks
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Create triggers for updated_at
CREATE TRIGGER update_organization_policies_updated_at
  BEFORE UPDATE ON public.organization_policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_kpis_updated_at
  BEFORE UPDATE ON public.organization_kpis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_positions_updated_at
  BEFORE UPDATE ON public.succession_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_candidates_updated_at
  BEFORE UPDATE ON public.succession_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_claims_updated_at
  BEFORE UPDATE ON public.organization_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_meeting_minutes_updated_at
  BEFORE UPDATE ON public.organization_meeting_minutes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_resolutions_updated_at
  BEFORE UPDATE ON public.meeting_resolutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_risks_updated_at
  BEFORE UPDATE ON public.organization_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();