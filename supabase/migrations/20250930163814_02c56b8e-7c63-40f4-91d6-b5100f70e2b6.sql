-- Create enum types for professional company goals
CREATE TYPE professional_goal_type AS ENUM ('short_term', 'long_term', 'strategic');
CREATE TYPE professional_goal_status AS ENUM ('planning', 'in_progress', 'completed', 'cancelled', 'on_hold');
CREATE TYPE professional_goal_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Create professional_company_goals table
CREATE TABLE public.professional_company_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.business_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  goal_type professional_goal_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status professional_goal_status NOT NULL DEFAULT 'planning',
  priority professional_goal_priority NOT NULL DEFAULT 'medium',
  success_metrics JSONB DEFAULT '[]'::jsonb,
  responsible_person TEXT,
  budget NUMERIC,
  currency TEXT DEFAULT 'IRR',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  roi_target NUMERIC,
  actual_roi NUMERIC,
  market_strategy TEXT,
  competitive_advantage TEXT,
  risk_assessment JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.professional_company_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company goals"
  ON public.professional_company_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their company goals"
  ON public.professional_company_goals
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
      SELECT 1 FROM public.business_companies 
      WHERE id = company_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their company goals"
  ON public.professional_company_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their company goals"
  ON public.professional_company_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.professional_company_goals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_professional_company_goals_company_id ON public.professional_company_goals(company_id);
CREATE INDEX idx_professional_company_goals_user_id ON public.professional_company_goals(user_id);
CREATE INDEX idx_professional_company_goals_goal_type ON public.professional_company_goals(goal_type);
CREATE INDEX idx_professional_company_goals_status ON public.professional_company_goals(status);
CREATE INDEX idx_professional_company_goals_target_date ON public.professional_company_goals(target_date);