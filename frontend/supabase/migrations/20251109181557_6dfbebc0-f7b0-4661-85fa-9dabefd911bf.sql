-- حذف جداول قدیمی اگر وجود داشته باشند
DROP TABLE IF EXISTS organization_succession_successors CASCADE;
DROP TABLE IF EXISTS organization_succession_plans CASCADE;

-- جداول جانشین‌پروری
CREATE TABLE organization_succession_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  department TEXT,
  current_holder TEXT,
  current_holder_id TEXT,
  criticality TEXT CHECK (criticality IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  vacancy_risk INTEGER CHECK (vacancy_risk >= 0 AND vacancy_risk <= 100) DEFAULT 50,
  status TEXT CHECK (status IN ('active', 'filled', 'vacant')) DEFAULT 'active',
  required_skills TEXT[],
  required_qualifications TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE organization_succession_successors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES organization_succession_plans(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_id TEXT,
  current_position TEXT,
  readiness TEXT CHECK (readiness IN ('ready_now', 'ready_1_year', 'ready_2_years', 'not_ready')) DEFAULT 'not_ready',
  readiness_score INTEGER CHECK (readiness_score >= 0 AND readiness_score <= 100),
  performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 9),
  potential_rating INTEGER CHECK (potential_rating >= 1 AND potential_rating <= 9),
  strengths TEXT[],
  development_gaps TEXT[],
  development_plan JSONB,
  career_aspirations TEXT,
  rank INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE organization_succession_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_succession_successors ENABLE ROW LEVEL SECURITY;

-- RLS Policies using organization ownership
CREATE POLICY "Users can view their org succession plans"
  ON organization_succession_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_succession_plans.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their org succession plans"
  ON organization_succession_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_succession_plans.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their org succession plans"
  ON organization_succession_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_succession_plans.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their org succession plans"
  ON organization_succession_plans FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organizations 
      WHERE organizations.id = organization_succession_plans.organization_id 
      AND organizations.user_id = auth.uid()
    )
  );

-- RLS Policies for successors via plan
CREATE POLICY "Users can view successors through org"
  ON organization_succession_successors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_succession_plans sp
      JOIN organizations o ON o.id = sp.organization_id
      WHERE sp.id = organization_succession_successors.plan_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create successors through org"
  ON organization_succession_successors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_succession_plans sp
      JOIN organizations o ON o.id = sp.organization_id
      WHERE sp.id = organization_succession_successors.plan_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update successors through org"
  ON organization_succession_successors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_succession_plans sp
      JOIN organizations o ON o.id = sp.organization_id
      WHERE sp.id = organization_succession_successors.plan_id 
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete successors through org"
  ON organization_succession_successors FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_succession_plans sp
      JOIN organizations o ON o.id = sp.organization_id
      WHERE sp.id = organization_succession_successors.plan_id 
      AND o.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_succession_plans_org ON organization_succession_plans(organization_id);
CREATE INDEX idx_succession_successors_plan ON organization_succession_successors(plan_id);

-- Auto-update timestamps trigger (reuse existing function)
CREATE TRIGGER update_succession_plans_updated_at
  BEFORE UPDATE ON organization_succession_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_succession_successors_updated_at
  BEFORE UPDATE ON organization_succession_successors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();