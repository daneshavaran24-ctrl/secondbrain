-- Create organization_departments table
CREATE TABLE IF NOT EXISTS public.organization_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  head_id UUID,
  budget NUMERIC,
  parent_department_id UUID REFERENCES public.organization_departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_employees table
CREATE TABLE IF NOT EXISTS public.organization_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_code TEXT,
  full_name TEXT NOT NULL,
  position TEXT,
  department_id UUID REFERENCES public.organization_departments(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  employment_type TEXT DEFAULT 'full-time',
  hire_date DATE,
  base_salary NUMERIC,
  allowances NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  bank_account TEXT,
  status TEXT DEFAULT 'active',
  manager_id UUID REFERENCES public.organization_employees(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_performance_evaluations table
CREATE TABLE IF NOT EXISTS public.organization_performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.organization_employees(id) ON DELETE CASCADE,
  evaluator_id UUID,
  evaluator_name TEXT NOT NULL,
  evaluation_period TEXT NOT NULL,
  evaluation_date DATE NOT NULL,
  performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 5),
  goals_achieved INTEGER CHECK (goals_achieved >= 0 AND goals_achieved <= 100),
  strengths TEXT[],
  areas_for_improvement TEXT[],
  goals_for_next_period TEXT[],
  feedback TEXT,
  employee_comments TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key for department head after employees table exists
ALTER TABLE public.organization_departments 
ADD CONSTRAINT fk_department_head 
FOREIGN KEY (head_id) REFERENCES public.organization_employees(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_org_departments_org_id ON public.organization_departments(organization_id);
CREATE INDEX idx_org_employees_org_id ON public.organization_employees(organization_id);
CREATE INDEX idx_org_employees_dept_id ON public.organization_employees(department_id);
CREATE INDEX idx_org_performance_org_id ON public.organization_performance_evaluations(organization_id);
CREATE INDEX idx_org_performance_employee_id ON public.organization_performance_evaluations(employee_id);

-- Enable RLS
ALTER TABLE public.organization_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_performance_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_departments
CREATE POLICY "Users can view departments in their organizations"
  ON public.organization_departments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_departments.organization_id
      AND user_organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage departments in their organizations"
  ON public.organization_departments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_departments.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for organization_employees
CREATE POLICY "Users can view employees in their organizations"
  ON public.organization_employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage employees in their organizations"
  ON public.organization_employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin', 'manager')
    )
  );

-- RLS Policies for organization_performance_evaluations
CREATE POLICY "Users can view evaluations in their organizations"
  ON public.organization_performance_evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_performance_evaluations.organization_id
      AND user_organizations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage evaluations in their organizations"
  ON public.organization_performance_evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_performance_evaluations.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin', 'manager')
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_organization_departments_updated_at
  BEFORE UPDATE ON public.organization_departments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_employees_updated_at
  BEFORE UPDATE ON public.organization_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_performance_evaluations_updated_at
  BEFORE UPDATE ON public.organization_performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();