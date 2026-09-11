-- Create table for Revenue Opportunities
CREATE TABLE IF NOT EXISTS idea_revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  revenue_model TEXT NOT NULL,
  market_size TEXT,
  pricing_strategy TEXT,
  target_segment TEXT,
  revenue_estimate TEXT,
  timeline TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for Suggested Actions
CREATE TABLE IF NOT EXISTS idea_suggested_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  timeline TEXT,
  estimated_effort TEXT,
  dependencies TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create table for Business Model Canvas
CREATE TABLE IF NOT EXISTS idea_business_model_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE UNIQUE,
  customer_segments JSONB,
  value_propositions JSONB,
  channels JSONB,
  customer_relationships JSONB,
  revenue_streams JSONB,
  key_resources JSONB,
  key_activities JSONB,
  key_partnerships JSONB,
  cost_structure JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE idea_revenue_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_suggested_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_business_model_canvas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for idea_revenue_opportunities
CREATE POLICY "Users can view their own idea revenue opportunities"
  ON idea_revenue_opportunities FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can insert their own idea revenue opportunities"
  ON idea_revenue_opportunities FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can update their own idea revenue opportunities"
  ON idea_revenue_opportunities FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can delete their own idea revenue opportunities"
  ON idea_revenue_opportunities FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

-- RLS Policies for idea_suggested_actions
CREATE POLICY "Users can view their own idea suggested actions"
  ON idea_suggested_actions FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can insert their own idea suggested actions"
  ON idea_suggested_actions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can update their own idea suggested actions"
  ON idea_suggested_actions FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can delete their own idea suggested actions"
  ON idea_suggested_actions FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

-- RLS Policies for idea_business_model_canvas
CREATE POLICY "Users can view their own idea business model canvas"
  ON idea_business_model_canvas FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can insert their own idea business model canvas"
  ON idea_business_model_canvas FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can update their own idea business model canvas"
  ON idea_business_model_canvas FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));

CREATE POLICY "Users can delete their own idea business model canvas"
  ON idea_business_model_canvas FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM ideas WHERE id = idea_id));