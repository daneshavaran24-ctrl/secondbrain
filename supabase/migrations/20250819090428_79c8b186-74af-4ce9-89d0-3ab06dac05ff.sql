-- Fix table and column name mismatches and add missing tables

-- Update delegation_tasks status enum to match the code expectations
ALTER TABLE public.delegation_tasks DROP CONSTRAINT delegation_tasks_status_check;
ALTER TABLE public.delegation_tasks ADD CONSTRAINT delegation_tasks_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'accepted', 'declined'));

-- Create alias table for delegation_task_attachments (expected by code)
CREATE VIEW public.delegation_task_attachments AS 
SELECT 
    id,
    task_id as delegation_task_id,
    file_name,
    file_url,
    file_size,
    mime_type,
    created_at
FROM public.delegation_attachments;

-- Instead of creating a view, let's rename the columns to match what the code expects
-- First, let's see what the code is actually trying to insert
-- Looking at TaskDelegationPanel.tsx, it's using delegation_task_id instead of task_id for subtasks

-- Update subtasks table to use the expected column name
ALTER TABLE public.delegation_subtasks RENAME COLUMN task_id TO delegation_task_id;

-- Update the foreign key constraint
ALTER TABLE public.delegation_subtasks DROP CONSTRAINT delegation_subtasks_task_id_fkey;
ALTER TABLE public.delegation_subtasks ADD CONSTRAINT delegation_subtasks_delegation_task_id_fkey 
    FOREIGN KEY (delegation_task_id) REFERENCES public.delegation_tasks(id) ON DELETE CASCADE;

-- Update RLS policies for delegation_subtasks to use the new column name
DROP POLICY "Users can view subtasks of their delegation tasks" ON public.delegation_subtasks;
DROP POLICY "Users can manage subtasks of their delegation tasks" ON public.delegation_subtasks;

CREATE POLICY "Users can view subtasks of their delegation tasks" 
    ON public.delegation_subtasks FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.delegation_task_id 
        AND delegator_id = auth.uid()
    ));

CREATE POLICY "Users can manage subtasks of their delegation tasks" 
    ON public.delegation_subtasks FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.delegation_task_id 
        AND delegator_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.delegation_task_id 
        AND delegator_id = auth.uid()
    ));

-- Update the index
DROP INDEX idx_delegation_subtasks_task_id;
CREATE INDEX idx_delegation_subtasks_delegation_task_id ON public.delegation_subtasks(delegation_task_id);

-- Create ideas table and related tables (missing from the schema)
CREATE TABLE public.ideas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'under_review', 'approved', 'rejected', 'implemented')),
    feasibility_score INTEGER CHECK (feasibility_score >= 0 AND feasibility_score <= 100),
    potential_impact INTEGER CHECK (potential_impact >= 0 AND potential_impact <= 100),
    estimated_cost NUMERIC,
    estimated_timeline TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create idea_risks table
CREATE TABLE public.idea_risks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    risk_description TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    mitigation_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create idea_milestones table
CREATE TABLE public.idea_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ideas tables
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ideas
CREATE POLICY "Users can view ideas based on organization" 
    ON public.ideas FOR SELECT 
    USING (
        user_id = auth.uid() OR 
        organization_id IN (
            SELECT o.id FROM public.organizations o 
            -- Add logic here if needed for organization access
        )
    );

CREATE POLICY "Users can manage their own ideas" 
    ON public.ideas FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for idea_risks (inherit from parent idea)
CREATE POLICY "Users can view risks of accessible ideas" 
    ON public.idea_risks FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_risks.idea_id 
        AND (user_id = auth.uid() OR organization_id IS NOT NULL)
    ));

CREATE POLICY "Users can manage risks of their ideas" 
    ON public.idea_risks FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_risks.idea_id 
        AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_risks.idea_id 
        AND user_id = auth.uid()
    ));

-- RLS Policies for idea_milestones (inherit from parent idea)
CREATE POLICY "Users can view milestones of accessible ideas" 
    ON public.idea_milestones FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_milestones.idea_id 
        AND (user_id = auth.uid() OR organization_id IS NOT NULL)
    ));

CREATE POLICY "Users can manage milestones of their ideas" 
    ON public.idea_milestones FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_milestones.idea_id 
        AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_milestones.idea_id 
        AND user_id = auth.uid()
    ));

-- Add updated_at triggers for ideas tables
CREATE TRIGGER update_ideas_updated_at
    BEFORE UPDATE ON public.ideas
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_milestones_updated_at
    BEFORE UPDATE ON public.idea_milestones
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX idx_ideas_organization_id ON public.ideas(organization_id);
CREATE INDEX idx_ideas_status ON public.ideas(status);
CREATE INDEX idx_idea_risks_idea_id ON public.idea_risks(idea_id);
CREATE INDEX idx_idea_milestones_idea_id ON public.idea_milestones(idea_id);