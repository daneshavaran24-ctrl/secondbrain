-- Create missing tables for ideas feature
CREATE TABLE IF NOT EXISTS public.idea_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_date date,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  risk_type text,
  description text NOT NULL,
  severity text DEFAULT 'medium',
  mitigation_strategy text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  description text,
  source_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.idea_swot_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  strengths jsonb,
  weaknesses jsonb,
  opportunities jsonb,
  threats jsonb,
  so_strategies jsonb,
  st_strategies jsonb,
  wo_strategies jsonb,
  wt_strategies jsonb,
  overall_assessment text,
  priority_actions jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns to ideas table
ALTER TABLE public.ideas 
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS stage text DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS potential_impact text;

-- Create user profiles table for user management
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  phone text,
  position text,
  department text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create organizational policy attachments table
CREATE TABLE IF NOT EXISTS public.organizational_policy_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id uuid NOT NULL REFERENCES public.organization_policies(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  created_at timestamptz DEFAULT now()
);

-- Create organizational claims table
CREATE TABLE IF NOT EXISTS public.organizational_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id),
  claim_number text,
  title text NOT NULL,
  description text,
  claim_type text,
  status text DEFAULT 'open',
  amount numeric,
  currency text DEFAULT 'IRR',
  filed_date date,
  resolution_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing column to user_organizations
ALTER TABLE public.user_organizations
  ADD COLUMN IF NOT EXISTS position_title text;

-- Add missing column to delegation_task_events
ALTER TABLE public.delegation_task_events
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Add status column to organization_missions if missing
ALTER TABLE public.organization_missions
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Enable RLS on new tables
ALTER TABLE public.idea_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_swot_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_policy_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_claims ENABLE ROW LEVEL SECURITY;

-- RLS policies for idea_milestones
CREATE POLICY "Users can view milestones for their ideas"
  ON public.idea_milestones FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_milestones.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can create milestones for their ideas"
  ON public.idea_milestones FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_milestones.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can update milestones for their ideas"
  ON public.idea_milestones FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_milestones.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete milestones for their ideas"
  ON public.idea_milestones FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_milestones.idea_id 
    AND ideas.user_id = auth.uid()
  ));

-- RLS policies for idea_risks
CREATE POLICY "Users can view risks for their ideas"
  ON public.idea_risks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_risks.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can create risks for their ideas"
  ON public.idea_risks FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_risks.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can update risks for their ideas"
  ON public.idea_risks FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_risks.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete risks for their ideas"
  ON public.idea_risks FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_risks.idea_id 
    AND ideas.user_id = auth.uid()
  ));

-- RLS policies for idea_inspirations
CREATE POLICY "Users can view inspirations for their ideas"
  ON public.idea_inspirations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_inspirations.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can create inspirations for their ideas"
  ON public.idea_inspirations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_inspirations.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can update inspirations for their ideas"
  ON public.idea_inspirations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_inspirations.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete inspirations for their ideas"
  ON public.idea_inspirations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_inspirations.idea_id 
    AND ideas.user_id = auth.uid()
  ));

-- RLS policies for idea_swot_analysis
CREATE POLICY "Users can view SWOT for their ideas"
  ON public.idea_swot_analysis FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_swot_analysis.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can create SWOT for their ideas"
  ON public.idea_swot_analysis FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_swot_analysis.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can update SWOT for their ideas"
  ON public.idea_swot_analysis FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_swot_analysis.idea_id 
    AND ideas.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete SWOT for their ideas"
  ON public.idea_swot_analysis FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.ideas 
    WHERE ideas.id = idea_swot_analysis.idea_id 
    AND ideas.user_id = auth.uid()
  ));

-- RLS policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS policies for organizational_policy_attachments
CREATE POLICY "Users can view attachments for their policies"
  ON public.organizational_policy_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_policies 
    WHERE organization_policies.id = organizational_policy_attachments.policy_id 
    AND organization_policies.user_id = auth.uid()
  ));

CREATE POLICY "Users can create attachments for their policies"
  ON public.organizational_policy_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.organization_policies 
    WHERE organization_policies.id = organizational_policy_attachments.policy_id 
    AND organization_policies.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete attachments for their policies"
  ON public.organizational_policy_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.organization_policies 
    WHERE organization_policies.id = organizational_policy_attachments.policy_id 
    AND organization_policies.user_id = auth.uid()
  ));

-- RLS policies for organizational_claims
CREATE POLICY "Users can view their claims"
  ON public.organizational_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create claims"
  ON public.organizational_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their claims"
  ON public.organizational_claims FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their claims"
  ON public.organizational_claims FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_idea_milestones_updated_at
  BEFORE UPDATE ON public.idea_milestones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_risks_updated_at
  BEFORE UPDATE ON public.idea_risks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_swot_analysis_updated_at
  BEFORE UPDATE ON public.idea_swot_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organizational_claims_updated_at
  BEFORE UPDATE ON public.organizational_claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();