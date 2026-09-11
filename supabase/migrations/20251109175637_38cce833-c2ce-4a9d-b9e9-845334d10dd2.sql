-- Migration: Organization Management Complete System Tables

-- ============================================
-- STRATEGY SECTION TABLES
-- ============================================

-- OKR Key Results
CREATE TABLE IF NOT EXISTS organization_okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  weight INTEGER DEFAULT 25 CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Roadmap Milestones
CREATE TABLE IF NOT EXISTS organization_roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  owner TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Decision Options
CREATE TABLE IF NOT EXISTS organization_decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  cost TEXT,
  time_estimate TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- OPERATIONS SECTION TABLES
-- ============================================

-- SOP Steps
CREATE TABLE IF NOT EXISTS organization_sop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  step_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible TEXT,
  duration TEXT,
  warning TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  parent_step_id UUID REFERENCES organization_sop_steps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SOP Approvers
CREATE TABLE IF NOT EXISTS organization_sop_approvers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Checklist Items
CREATE TABLE IF NOT EXISTS organization_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  has_notes BOOLEAN DEFAULT false,
  has_attachment BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  parent_item_id UUID REFERENCES organization_checklist_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Custom Form Fields
CREATE TABLE IF NOT EXISTS organization_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'number', 'date', 'select', 'multiselect', 'radio', 'checkbox', 'file', 'signature')),
  label TEXT NOT NULL,
  placeholder TEXT,
  required BOOLEAN DEFAULT false,
  options JSONB,
  default_value TEXT,
  help_text TEXT,
  validation_rules JSONB,
  conditional_logic JSONB,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Form Submissions
CREATE TABLE IF NOT EXISTS organization_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  comments TEXT
);

-- Form Workflow Steps
CREATE TABLE IF NOT EXISTS organization_form_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  step_name TEXT NOT NULL,
  assignee TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('review', 'approve', 'complete')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- HR SECTION TABLES
-- ============================================

-- Organization Chart Nodes
CREATE TABLE IF NOT EXISTS organization_chart_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_id UUID NOT NULL REFERENCES organization_hr(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  level INTEGER NOT NULL,
  manager_id UUID REFERENCES organization_chart_nodes(id) ON DELETE SET NULL,
  avatar TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  employment_type TEXT DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
  start_date DATE NOT NULL,
  location TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Succession Plans
CREATE TABLE IF NOT EXISTS organization_succession_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_id UUID NOT NULL REFERENCES organization_hr(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  current_holder TEXT NOT NULL,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  vacancy_risk INTEGER DEFAULT 50 CHECK (vacancy_risk >= 0 AND vacancy_risk <= 100),
  timeline TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Succession Successors
CREATE TABLE IF NOT EXISTS organization_succession_successors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  succession_plan_id UUID NOT NULL REFERENCES organization_succession_plans(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  readiness TEXT DEFAULT '1-2-years' CHECK (readiness IN ('ready-now', '1-2-years', '3-5-years')),
  readiness_score INTEGER DEFAULT 50 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  development_actions JSONB DEFAULT '[]'::jsonb,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- FINANCE SECTION TABLES
-- ============================================

-- Organization Budgets
CREATE TABLE IF NOT EXISTS organization_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_id UUID NOT NULL REFERENCES organization_finance(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  category TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0,
  remaining_amount NUMERIC GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
  currency TEXT DEFAULT 'IRR',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial Transactions
CREATE TABLE IF NOT EXISTS organization_financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_id UUID NOT NULL REFERENCES organization_finance(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  invoice_number TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Financial Reports
CREATE TABLE IF NOT EXISTS organization_financial_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_id UUID NOT NULL REFERENCES organization_finance(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('income_statement', 'balance_sheet', 'cash_flow', 'budget_analysis')),
  period TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- RLS POLICIES
-- ============================================

-- OKR Key Results
ALTER TABLE organization_okr_key_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org OKR key results"
  ON organization_okr_key_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_okr_key_results.strategy_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org OKR key results"
  ON organization_okr_key_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_okr_key_results.strategy_id
      AND o.user_id = auth.uid()
    )
  );

-- Roadmap Milestones
ALTER TABLE organization_roadmap_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org roadmap milestones"
  ON organization_roadmap_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_roadmap_milestones.strategy_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org roadmap milestones"
  ON organization_roadmap_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_roadmap_milestones.strategy_id
      AND o.user_id = auth.uid()
    )
  );

-- Decision Options
ALTER TABLE organization_decision_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org decision options"
  ON organization_decision_options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_decision_options.strategy_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org decision options"
  ON organization_decision_options FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_strategies os
      JOIN organizations o ON os.organization_id = o.id
      WHERE os.id = organization_decision_options.strategy_id
      AND o.user_id = auth.uid()
    )
  );

-- SOP Steps
ALTER TABLE organization_sop_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org SOP steps"
  ON organization_sop_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_sop_steps.operations_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org SOP steps"
  ON organization_sop_steps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_sop_steps.operations_id
      AND o.user_id = auth.uid()
    )
  );

-- SOP Approvers
ALTER TABLE organization_sop_approvers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org SOP approvers"
  ON organization_sop_approvers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_sop_approvers.operations_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org SOP approvers"
  ON organization_sop_approvers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_sop_approvers.operations_id
      AND o.user_id = auth.uid()
    )
  );

-- Checklist Items
ALTER TABLE organization_checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org checklist items"
  ON organization_checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_checklist_items.operations_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org checklist items"
  ON organization_checklist_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_checklist_items.operations_id
      AND o.user_id = auth.uid()
    )
  );

-- Form Fields
ALTER TABLE organization_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org form fields"
  ON organization_form_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_form_fields.operations_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org form fields"
  ON organization_form_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_form_fields.operations_id
      AND o.user_id = auth.uid()
    )
  );

-- Form Submissions
ALTER TABLE organization_form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org form submissions"
  ON organization_form_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_form_submissions.operations_id
      AND o.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Users can create form submissions"
  ON organization_form_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own submissions"
  ON organization_form_submissions FOR UPDATE
  USING (user_id = auth.uid());

-- Form Workflow
ALTER TABLE organization_form_workflow ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org form workflow"
  ON organization_form_workflow FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_form_workflow.operations_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org form workflow"
  ON organization_form_workflow FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_operations oo
      JOIN organizations o ON oo.organization_id = o.id
      WHERE oo.id = organization_form_workflow.operations_id
      AND o.user_id = auth.uid()
    )
  );

-- Chart Nodes
ALTER TABLE organization_chart_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org chart nodes"
  ON organization_chart_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_hr oh
      JOIN organizations o ON oh.organization_id = o.id
      WHERE oh.id = organization_chart_nodes.hr_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org chart nodes"
  ON organization_chart_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_hr oh
      JOIN organizations o ON oh.organization_id = o.id
      WHERE oh.id = organization_chart_nodes.hr_id
      AND o.user_id = auth.uid()
    )
  );

-- Succession Plans
ALTER TABLE organization_succession_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org succession plans"
  ON organization_succession_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_hr oh
      JOIN organizations o ON oh.organization_id = o.id
      WHERE oh.id = organization_succession_plans.hr_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org succession plans"
  ON organization_succession_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_hr oh
      JOIN organizations o ON oh.organization_id = o.id
      WHERE oh.id = organization_succession_plans.hr_id
      AND o.user_id = auth.uid()
    )
  );

-- Succession Successors
ALTER TABLE organization_succession_successors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org succession successors"
  ON organization_succession_successors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_succession_plans osp
      JOIN organization_hr oh ON osp.hr_id = oh.id
      JOIN organizations o ON oh.organization_id = o.id
      WHERE osp.id = organization_succession_successors.succession_plan_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org succession successors"
  ON organization_succession_successors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_succession_plans osp
      JOIN organization_hr oh ON osp.hr_id = oh.id
      JOIN organizations o ON oh.organization_id = o.id
      WHERE osp.id = organization_succession_successors.succession_plan_id
      AND o.user_id = auth.uid()
    )
  );

-- Budgets
ALTER TABLE organization_budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org budgets"
  ON organization_budgets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_budgets.finance_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org budgets"
  ON organization_budgets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_budgets.finance_id
      AND o.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Financial Transactions
ALTER TABLE organization_financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org transactions"
  ON organization_financial_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_financial_transactions.finance_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org transactions"
  ON organization_financial_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_financial_transactions.finance_id
      AND o.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Financial Reports
ALTER TABLE organization_financial_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org reports"
  ON organization_financial_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_financial_reports.finance_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their org reports"
  ON organization_financial_reports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_finance of
      JOIN organizations o ON of.organization_id = o.id
      WHERE of.id = organization_financial_reports.finance_id
      AND o.user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_okr_key_results_strategy ON organization_okr_key_results(strategy_id);
CREATE INDEX idx_roadmap_milestones_strategy ON organization_roadmap_milestones(strategy_id);
CREATE INDEX idx_decision_options_strategy ON organization_decision_options(strategy_id);
CREATE INDEX idx_sop_steps_operations ON organization_sop_steps(operations_id);
CREATE INDEX idx_sop_approvers_operations ON organization_sop_approvers(operations_id);
CREATE INDEX idx_checklist_items_operations ON organization_checklist_items(operations_id);
CREATE INDEX idx_form_fields_operations ON organization_form_fields(operations_id);
CREATE INDEX idx_form_submissions_operations ON organization_form_submissions(operations_id);
CREATE INDEX idx_form_workflow_operations ON organization_form_workflow(operations_id);
CREATE INDEX idx_chart_nodes_hr ON organization_chart_nodes(hr_id);
CREATE INDEX idx_chart_nodes_manager ON organization_chart_nodes(manager_id);
CREATE INDEX idx_succession_plans_hr ON organization_succession_plans(hr_id);
CREATE INDEX idx_succession_successors_plan ON organization_succession_successors(succession_plan_id);
CREATE INDEX idx_budgets_finance ON organization_budgets(finance_id);
CREATE INDEX idx_budgets_year ON organization_budgets(year);
CREATE INDEX idx_transactions_finance ON organization_financial_transactions(finance_id);
CREATE INDEX idx_transactions_date ON organization_financial_transactions(date);
CREATE INDEX idx_reports_finance ON organization_financial_reports(finance_id);