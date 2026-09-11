-- Create succession planning tables

-- Critical positions table
CREATE TABLE public.succession_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  position_title TEXT NOT NULL,
  department TEXT,
  criticality TEXT NOT NULL DEFAULT 'high' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  current_holder_name TEXT,
  current_holder_id UUID,
  successor_count INTEGER DEFAULT 0,
  readiness_level TEXT DEFAULT 'not_ready' CHECK (readiness_level IN ('ready_now', 'ready_1_year', 'ready_2_years', 'not_ready')),
  skills_required JSONB DEFAULT '[]'::jsonb,
  qualifications_required TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Talent pool table
CREATE TABLE public.succession_talent_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_id TEXT,
  current_position TEXT,
  target_position_id UUID REFERENCES succession_positions(id) ON DELETE SET NULL,
  readiness_level TEXT DEFAULT 'not_ready' CHECK (readiness_level IN ('ready_now', 'ready_1_year', 'ready_2_years', 'not_ready')),
  skills JSONB DEFAULT '[]'::jsonb,
  performance_rating INTEGER DEFAULT 3 CHECK (performance_rating BETWEEN 1 AND 5),
  potential_rating INTEGER DEFAULT 3 CHECK (potential_rating BETWEEN 1 AND 5),
  development_needs TEXT,
  career_aspirations TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Development programs table
CREATE TABLE public.succession_development_programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL,
  program_name TEXT NOT NULL,
  description TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  duration_months INTEGER,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'suspended')),
  completion_rate INTEGER DEFAULT 0 CHECK (completion_rate BETWEEN 0 AND 100),
  budget NUMERIC,
  currency TEXT DEFAULT 'IRR',
  facilitator TEXT,
  learning_objectives JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.succession_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_talent_pool ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.succession_development_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for succession_positions
CREATE POLICY "Users can view positions of their organization" 
ON public.succession_positions 
FOR SELECT 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can manage positions of their organization" 
ON public.succession_positions 
FOR ALL 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

-- RLS Policies for succession_talent_pool
CREATE POLICY "Users can view talent pool of their organization" 
ON public.succession_talent_pool 
FOR SELECT 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can manage talent pool of their organization" 
ON public.succession_talent_pool 
FOR ALL 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

-- RLS Policies for succession_development_programs
CREATE POLICY "Users can view development programs of their organization" 
ON public.succession_development_programs 
FOR SELECT 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can manage development programs of their organization" 
ON public.succession_development_programs 
FOR ALL 
USING (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT user_profiles.organization_id 
    FROM user_profiles 
    WHERE user_profiles.user_id = auth.uid() 
    AND user_profiles.organization_id IS NOT NULL
  )
);

-- Add update triggers
CREATE TRIGGER update_succession_positions_updated_at
BEFORE UPDATE ON public.succession_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_talent_pool_updated_at
BEFORE UPDATE ON public.succession_talent_pool
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_succession_development_programs_updated_at
BEFORE UPDATE ON public.succession_development_programs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_succession_positions_organization_id ON public.succession_positions(organization_id);
CREATE INDEX idx_succession_talent_pool_organization_id ON public.succession_talent_pool(organization_id);
CREATE INDEX idx_succession_talent_pool_target_position ON public.succession_talent_pool(target_position_id);
CREATE INDEX idx_succession_development_programs_organization_id ON public.succession_development_programs(organization_id);