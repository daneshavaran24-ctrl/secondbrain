-- Create enum for goal types
CREATE TYPE goal_type AS ENUM ('short_term', 'long_term', 'strategic');

-- Create enum for goal status
CREATE TYPE goal_status AS ENUM ('planning', 'in_progress', 'completed', 'cancelled');

-- Create succession_position_goals table
CREATE TABLE public.succession_position_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES public.succession_positions(id) ON DELETE CASCADE,
  goal_type goal_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status goal_status NOT NULL DEFAULT 'planning',
  priority TEXT NOT NULL DEFAULT 'medium',
  success_metrics JSONB DEFAULT '[]'::jsonb,
  responsible_person TEXT,
  budget NUMERIC,
  currency TEXT DEFAULT 'IRR',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  milestones JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  organization_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.succession_position_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view goals of their organization"
ON public.succession_position_goals
FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can manage goals of their organization"
ON public.succession_position_goals
FOR ALL
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() AND organization_id IS NOT NULL
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_succession_position_goals_updated_at
BEFORE UPDATE ON public.succession_position_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_succession_position_goals_position_id ON public.succession_position_goals(position_id);
CREATE INDEX idx_succession_position_goals_organization_id ON public.succession_position_goals(organization_id);
CREATE INDEX idx_succession_position_goals_goal_type ON public.succession_position_goals(goal_type);
CREATE INDEX idx_succession_position_goals_status ON public.succession_position_goals(status);