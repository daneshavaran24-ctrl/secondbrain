-- Create CSR Projects table
CREATE TABLE IF NOT EXISTS public.csr_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('charity', 'environment', 'education', 'other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  start_date DATE,
  end_date DATE,
  budget NUMERIC,
  currency TEXT DEFAULT 'IRR',
  impact_metrics JSONB,
  beneficiaries TEXT[],
  partners TEXT[],
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.csr_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own CSR projects"
  ON public.csr_projects
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create CSR projects"
  ON public.csr_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CSR projects"
  ON public.csr_projects
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CSR projects"
  ON public.csr_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_csr_projects_updated_at
  BEFORE UPDATE ON public.csr_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();