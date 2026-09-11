-- Create CSR Projects table for Social Responsibility tracking
CREATE TABLE IF NOT EXISTS public.csr_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  description TEXT,
  
  type TEXT NOT NULL CHECK (type IN ('charity', 'environment', 'education', 'other')),
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'on_hold')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  
  start_date DATE,
  end_date DATE,
  
  budget NUMERIC(15, 2),
  currency TEXT DEFAULT 'IRR',
  
  impact_metrics JSONB DEFAULT '{}',
  beneficiaries TEXT[],
  partners TEXT[],
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.csr_projects ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_csr_projects_user_id ON public.csr_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_csr_projects_organization_id ON public.csr_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_csr_projects_type ON public.csr_projects(type);
CREATE INDEX IF NOT EXISTS idx_csr_projects_status ON public.csr_projects(status);

-- RLS Policies

-- Users can view their own CSR projects
CREATE POLICY "Users can view their own CSR projects"
ON public.csr_projects
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view CSR projects of their organization
CREATE POLICY "Users can view organization CSR projects"
ON public.csr_projects
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
);

-- Users can create their own CSR projects
CREATE POLICY "Users can create their own CSR projects"
ON public.csr_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own CSR projects
CREATE POLICY "Users can update their own CSR projects"
ON public.csr_projects
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own CSR projects
CREATE POLICY "Users can delete their own CSR projects"
ON public.csr_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all CSR projects
CREATE POLICY "Admins can manage all CSR projects"
ON public.csr_projects
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- Create trigger for automatic updated_at timestamp
CREATE TRIGGER update_csr_projects_updated_at
BEFORE UPDATE ON public.csr_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.csr_projects IS 'Tracks Corporate Social Responsibility (CSR) projects and social impact initiatives';