-- Add media support to gratitude entries
ALTER TABLE public.gratitude_entries 
ADD COLUMN IF NOT EXISTS media_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;

-- Add database migration to support idea inspirations table if not exists
CREATE TABLE IF NOT EXISTS public.idea_inspirations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'other',
  description text NOT NULL,
  source_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on idea_inspirations
ALTER TABLE public.idea_inspirations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for idea_inspirations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'idea_inspirations' 
    AND policyname = 'Users can manage inspirations of their ideas'
  ) THEN
    CREATE POLICY "Users can manage inspirations of their ideas" 
    ON public.idea_inspirations 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM ideas 
        WHERE ideas.id = idea_inspirations.idea_id 
        AND ideas.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM ideas 
        WHERE ideas.id = idea_inspirations.idea_id 
        AND ideas.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Add SWOT analysis table if not exists
CREATE TABLE IF NOT EXISTS public.idea_swot_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id uuid NOT NULL,
  strengths jsonb DEFAULT '[]'::jsonb,
  weaknesses jsonb DEFAULT '[]'::jsonb,
  opportunities jsonb DEFAULT '[]'::jsonb,
  threats jsonb DEFAULT '[]'::jsonb,
  so_strategies jsonb DEFAULT '[]'::jsonb,
  st_strategies jsonb DEFAULT '[]'::jsonb,
  wo_strategies jsonb DEFAULT '[]'::jsonb,
  wt_strategies jsonb DEFAULT '[]'::jsonb,
  overall_assessment text,
  priority_actions jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on idea_swot_analysis
ALTER TABLE public.idea_swot_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for idea_swot_analysis
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'idea_swot_analysis' 
    AND policyname = 'Users can manage SWOT analysis of their ideas'
  ) THEN
    CREATE POLICY "Users can manage SWOT analysis of their ideas" 
    ON public.idea_swot_analysis 
    FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM ideas 
        WHERE ideas.id = idea_swot_analysis.idea_id 
        AND ideas.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM ideas 
        WHERE ideas.id = idea_swot_analysis.idea_id 
        AND ideas.user_id = auth.uid()
      )
    );
  END IF;
END $$;