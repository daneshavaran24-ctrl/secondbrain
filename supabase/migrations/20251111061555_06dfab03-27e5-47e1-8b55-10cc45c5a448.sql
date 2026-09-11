-- Create sales_icp_profiles table
CREATE TABLE sales_icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  annual_revenue_range TEXT,
  decision_makers JSONB DEFAULT '[]'::jsonb,
  pain_points JSONB DEFAULT '[]'::jsonb,
  buying_triggers JSONB DEFAULT '[]'::jsonb,
  preferred_channels JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_funnel_stages table
CREATE TABLE sales_funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sales_leads table
CREATE TABLE sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  stage_id UUID REFERENCES sales_funnel_stages(id),
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create marketing_campaigns table
CREATE TABLE marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  target_audience JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sales_icp_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales_icp_profiles
CREATE POLICY "Organization members can view ICP profiles"
ON sales_icp_profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_icp_profiles.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can create ICP profiles"
ON sales_icp_profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_icp_profiles.organization_id
    AND user_organizations.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Organization members can update ICP profiles"
ON sales_icp_profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_icp_profiles.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can delete ICP profiles"
ON sales_icp_profiles FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_icp_profiles.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- RLS Policies for sales_funnel_stages
CREATE POLICY "Organization members can view funnel stages"
ON sales_funnel_stages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_funnel_stages.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can manage funnel stages"
ON sales_funnel_stages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_funnel_stages.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- RLS Policies for sales_leads
CREATE POLICY "Organization members can view leads"
ON sales_leads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_leads.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can create leads"
ON sales_leads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_leads.organization_id
    AND user_organizations.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Organization members can update leads"
ON sales_leads FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_leads.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can delete leads"
ON sales_leads FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = sales_leads.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- RLS Policies for marketing_campaigns
CREATE POLICY "Organization members can view campaigns"
ON marketing_campaigns FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = marketing_campaigns.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can create campaigns"
ON marketing_campaigns FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = marketing_campaigns.organization_id
    AND user_organizations.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Organization members can update campaigns"
ON marketing_campaigns FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = marketing_campaigns.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

CREATE POLICY "Organization members can delete campaigns"
ON marketing_campaigns FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_organizations.organization_id = marketing_campaigns.organization_id
    AND user_organizations.user_id = auth.uid()
  )
);

-- Create indexes
CREATE INDEX idx_sales_icp_org ON sales_icp_profiles(organization_id);
CREATE INDEX idx_sales_funnel_org ON sales_funnel_stages(organization_id);
CREATE INDEX idx_sales_leads_org ON sales_leads(organization_id);
CREATE INDEX idx_sales_leads_stage ON sales_leads(stage_id);
CREATE INDEX idx_marketing_campaigns_org ON marketing_campaigns(organization_id);

-- Create triggers for updated_at
CREATE TRIGGER update_sales_icp_profiles_updated_at
  BEFORE UPDATE ON sales_icp_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_leads_updated_at
  BEFORE UPDATE ON sales_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();