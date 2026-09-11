-- Create organization_strategies table for OKRs, Roadmap, Decision Log
CREATE TABLE IF NOT EXISTS public.organization_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('okr', 'roadmap', 'decision_log')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_operations table for SOPs, Checklists, Forms
CREATE TABLE IF NOT EXISTS public.organization_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sop', 'checklist', 'form', 'review_calendar')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  version TEXT DEFAULT '1.0',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_sales table for ICP/Persona, Sales Funnel, Campaigns
CREATE TABLE IF NOT EXISTS public.organization_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  sales_type TEXT NOT NULL CHECK (sales_type IN ('icp', 'persona', 'funnel', 'campaign', 'material')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_hr table for Org Chart, Succession, Competencies
CREATE TABLE IF NOT EXISTS public.organization_hr (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hr_type TEXT NOT NULL CHECK (hr_type IN ('org_chart', 'succession', 'competency', 'onboarding', 'offboarding')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_finance table for Budget, Reports, Policies
CREATE TABLE IF NOT EXISTS public.organization_finance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  finance_type TEXT NOT NULL CHECK (finance_type IN ('budget', 'report', 'policy', 'expense')),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'IRR',
  content JSONB DEFAULT '{}'::jsonb,
  fiscal_year INTEGER,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_tech table for Architecture, APIs, Security
CREATE TABLE IF NOT EXISTS public.organization_tech (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  tech_type TEXT NOT NULL CHECK (tech_type IN ('architecture', 'api_doc', 'security', 'backup_dr')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  version TEXT,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_legal table for Contracts, Policies, Licenses
CREATE TABLE IF NOT EXISTS public.organization_legal (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  legal_type TEXT NOT NULL CHECK (legal_type IN ('contract', 'policy', 'license', 'document_retention')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  contract_party TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_procurement table for Vendor DB, Performance, SLA
CREATE TABLE IF NOT EXISTS public.organization_procurement (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  procurement_type TEXT NOT NULL CHECK (procurement_type IN ('vendor', 'performance', 'sla')),
  vendor_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create organization_support table for Knowledge Base, FAQ, Runbooks
CREATE TABLE IF NOT EXISTS public.organization_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  support_type TEXT NOT NULL CHECK (support_type IN ('knowledge_base', 'faq', 'runbook')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  category TEXT,
  status TEXT DEFAULT 'published',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organization_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_hr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_tech ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_legal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_procurement ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_support ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_strategies
CREATE POLICY "Users can view their organization strategies"
  ON public.organization_strategies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_strategies.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization strategies"
  ON public.organization_strategies FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_operations
CREATE POLICY "Users can view their organization operations"
  ON public.organization_operations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_operations.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization operations"
  ON public.organization_operations FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_sales
CREATE POLICY "Users can view their organization sales"
  ON public.organization_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_sales.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization sales"
  ON public.organization_sales FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_hr
CREATE POLICY "Users can view their organization HR"
  ON public.organization_hr FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_hr.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization HR"
  ON public.organization_hr FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_finance
CREATE POLICY "Users can view their organization finance"
  ON public.organization_finance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_finance.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization finance"
  ON public.organization_finance FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_tech
CREATE POLICY "Users can view their organization tech"
  ON public.organization_tech FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_tech.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization tech"
  ON public.organization_tech FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_legal
CREATE POLICY "Users can view their organization legal"
  ON public.organization_legal FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_legal.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization legal"
  ON public.organization_legal FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_procurement
CREATE POLICY "Users can view their organization procurement"
  ON public.organization_procurement FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_procurement.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization procurement"
  ON public.organization_procurement FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for organization_support
CREATE POLICY "Users can view their organization support"
  ON public.organization_support FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations uo
      WHERE uo.organization_id = organization_support.organization_id
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their organization support"
  ON public.organization_support FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_org_strategies_org_id ON public.organization_strategies(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_operations_org_id ON public.organization_operations(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_sales_org_id ON public.organization_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_hr_org_id ON public.organization_hr(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_finance_org_id ON public.organization_finance(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_tech_org_id ON public.organization_tech(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_legal_org_id ON public.organization_legal(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_procurement_org_id ON public.organization_procurement(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_support_org_id ON public.organization_support(organization_id);