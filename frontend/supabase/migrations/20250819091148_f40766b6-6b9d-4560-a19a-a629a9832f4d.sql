-- Add all remaining missing tables that the codebase expects

-- User profiles table (for user management)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    email TEXT UNIQUE,
    mobile_phone TEXT,
    first_name TEXT,
    last_name TEXT,
    display_name TEXT,
    national_id TEXT,
    office_phone TEXT,
    home_phone TEXT,
    address TEXT,
    employee_id TEXT,
    department TEXT,
    position TEXT,
    hire_date DATE,
    birth_date DATE,
    bio TEXT,
    notes TEXT,
    avatar_url TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table (for user management system roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    system_role TEXT NOT NULL DEFAULT 'user' CHECK (system_role IN ('admin', 'general_manager', 'department_manager', 'user', 'secretary')),
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization claims table (for claims tracking)
CREATE TABLE IF NOT EXISTS public.organization_claims (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    claim_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    claimant_name TEXT,
    claimant_contact TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'approved', 'rejected', 'settled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    amount NUMERIC,
    currency TEXT DEFAULT 'IRR',
    date_received DATE,
    date_resolved DATE,
    assigned_to UUID REFERENCES auth.users(id),
    notes TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create missing tables for comprehensive ideas management
CREATE TABLE IF NOT EXISTS public.idea_categories (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    color TEXT,
    icon TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting-related tables
CREATE TABLE IF NOT EXISTS public.meeting_minutes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_title TEXT NOT NULL,
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    organizer_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    attendees JSONB DEFAULT '[]'::jsonb,
    agenda JSONB DEFAULT '[]'::jsonb,
    minutes_text TEXT,
    action_items JSONB DEFAULT '[]'::jsonb,
    decisions JSONB DEFAULT '[]'::jsonb,
    next_meeting_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Knowledge base tables  
CREATE TABLE IF NOT EXISTS public.knowledge_base (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    category TEXT,
    tags TEXT[],
    author_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    is_public BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Project management tables
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE,
    end_date DATE,
    budget NUMERIC,
    currency TEXT DEFAULT 'IRR',
    manager_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    assigned_to UUID REFERENCES auth.users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours NUMERIC,
    actual_hours NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view all profiles" 
    ON public.user_profiles FOR SELECT 
    USING (true);

CREATE POLICY "Users can manage their own profile" 
    ON public.user_profiles FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_roles  
CREATE POLICY "Users can view all roles" 
    ON public.user_roles FOR SELECT 
    USING (true);

CREATE POLICY "Only admins can manage roles" 
    ON public.user_roles FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.system_role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = auth.uid() 
        AND ur.system_role = 'admin'
    ));

-- RLS Policies for organization_claims
CREATE POLICY "Users can view claims of their organization" 
    ON public.organization_claims FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.organization_id = organization_claims.organization_id
    ));

CREATE POLICY "Users can manage claims of their organization" 
    ON public.organization_claims FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.organization_id = organization_claims.organization_id
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.organization_id = organization_claims.organization_id
    ));

-- Similar policies for other tables...
CREATE POLICY "Users can view categories of their organization" 
    ON public.idea_categories FOR SELECT 
    USING (organization_id IS NULL OR EXISTS (
        SELECT 1 FROM public.user_profiles up 
        WHERE up.user_id = auth.uid() 
        AND up.organization_id = idea_categories.organization_id
    ));

CREATE POLICY "Users can manage categories" 
    ON public.idea_categories FOR ALL 
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_claims_updated_at
    BEFORE UPDATE ON public.organization_claims
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meeting_minutes_updated_at
    BEFORE UPDATE ON public.meeting_minutes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_knowledge_base_updated_at
    BEFORE UPDATE ON public.knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
    BEFORE UPDATE ON public.project_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX idx_user_profiles_organization_id ON public.user_profiles(organization_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_organization_claims_organization_id ON public.organization_claims(organization_id);
CREATE INDEX idx_organization_claims_status ON public.organization_claims(status);
CREATE INDEX idx_projects_organization_id ON public.projects(organization_id);
CREATE INDEX idx_projects_manager_id ON public.projects(manager_id);
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assigned_to ON public.project_tasks(assigned_to);

-- Fix search_path issue for the reminder function
DROP FUNCTION IF EXISTS public.send_delegation_reminder(UUID);
CREATE OR REPLACE FUNCTION public.send_delegation_reminder(task_id UUID)
RETURNS JSONB 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
    -- Placeholder function - actual implementation should be in Edge Functions
    RETURN jsonb_build_object('success', true, 'message', 'Reminder functionality not implemented');
END;
$$;