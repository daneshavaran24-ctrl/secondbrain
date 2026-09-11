-- Fix database schema mismatches and add missing tables/columns

-- Fix delegation_tasks status enum to include missing values
ALTER TABLE public.delegation_tasks DROP CONSTRAINT delegation_tasks_status_check;
ALTER TABLE public.delegation_tasks ADD CONSTRAINT delegation_tasks_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'accepted', 'declined'));

-- Add missing columns to ideas table
ALTER TABLE public.ideas ADD COLUMN stage TEXT DEFAULT 'concept' CHECK (stage IN ('concept', 'research', 'development', 'testing', 'implementation', 'completed'));
ALTER TABLE public.ideas ADD COLUMN priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- Create missing tables for ideas functionality

-- Create idea_inspirations table
CREATE TABLE public.idea_inspirations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('article', 'video', 'book', 'podcast', 'conversation', 'experience', 'other')),
    description TEXT NOT NULL,
    source_url TEXT,
    source_title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create idea_swot_analysis table
CREATE TABLE public.idea_swot_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    strengths JSONB DEFAULT '[]'::jsonb,
    weaknesses JSONB DEFAULT '[]'::jsonb,
    opportunities JSONB DEFAULT '[]'::jsonb,
    threats JSONB DEFAULT '[]'::jsonb,
    so_strategies JSONB DEFAULT '[]'::jsonb,
    st_strategies JSONB DEFAULT '[]'::jsonb,
    wo_strategies JSONB DEFAULT '[]'::jsonb,
    wt_strategies JSONB DEFAULT '[]'::jsonb,
    overall_assessment TEXT,
    priority_actions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.idea_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_swot_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for idea_inspirations (inherit from parent idea)
CREATE POLICY "Users can view inspirations of accessible ideas" 
    ON public.idea_inspirations FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_inspirations.idea_id 
        AND (user_id = auth.uid() OR organization_id IS NOT NULL)
    ));

CREATE POLICY "Users can manage inspirations of their ideas" 
    ON public.idea_inspirations FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_inspirations.idea_id 
        AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_inspirations.idea_id 
        AND user_id = auth.uid()
    ));

-- RLS Policies for idea_swot_analysis (inherit from parent idea)
CREATE POLICY "Users can view SWOT analysis of accessible ideas" 
    ON public.idea_swot_analysis FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_swot_analysis.idea_id 
        AND (user_id = auth.uid() OR organization_id IS NOT NULL)
    ));

CREATE POLICY "Users can manage SWOT analysis of their ideas" 
    ON public.idea_swot_analysis FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_swot_analysis.idea_id 
        AND user_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.ideas 
        WHERE id = idea_swot_analysis.idea_id 
        AND user_id = auth.uid()
    ));

-- Add updated_at trigger for idea_swot_analysis
CREATE TRIGGER update_idea_swot_analysis_updated_at
    BEFORE UPDATE ON public.idea_swot_analysis
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_idea_inspirations_idea_id ON public.idea_inspirations(idea_id);
CREATE INDEX idx_idea_swot_analysis_idea_id ON public.idea_swot_analysis(idea_id);

-- Create the send_delegation_reminder edge function placeholder
-- Note: The actual function will need to be implemented separately
CREATE OR REPLACE FUNCTION public.send_delegation_reminder(task_id UUID)
RETURNS JSONB AS $$
BEGIN
    -- Placeholder function - actual implementation should be in Edge Functions
    RETURN jsonb_build_object('success', true, 'message', 'Reminder functionality not implemented');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;