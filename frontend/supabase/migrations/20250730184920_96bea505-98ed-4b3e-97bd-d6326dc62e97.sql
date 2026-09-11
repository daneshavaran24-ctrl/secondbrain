-- Add domain and organization_id fields to delegation_tasks table
ALTER TABLE public.delegation_tasks 
ADD COLUMN domain text DEFAULT 'personal' CHECK (domain IN ('personal', 'professional', 'organizational')),
ADD COLUMN organization_id uuid REFERENCES public.organizations(id);

-- Create index for better performance
CREATE INDEX idx_delegation_tasks_domain ON public.delegation_tasks(domain);
CREATE INDEX idx_delegation_tasks_organization ON public.delegation_tasks(organization_id);

-- Update existing records to have personal domain
UPDATE public.delegation_tasks SET domain = 'personal' WHERE domain IS NULL;