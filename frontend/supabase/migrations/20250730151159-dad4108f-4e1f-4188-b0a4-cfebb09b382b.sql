-- Create table for storing detailed SWOT analyses
CREATE TABLE public.idea_swot_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  opportunities TEXT[] NOT NULL DEFAULT '{}',
  threats TEXT[] NOT NULL DEFAULT '{}',
  so_strategies TEXT[] NOT NULL DEFAULT '{}', -- Strength-Opportunity strategies
  st_strategies TEXT[] NOT NULL DEFAULT '{}', -- Strength-Threat strategies
  wo_strategies TEXT[] NOT NULL DEFAULT '{}', -- Weakness-Opportunity strategies
  wt_strategies TEXT[] NOT NULL DEFAULT '{}', -- Weakness-Threat strategies
  overall_assessment TEXT,
  priority_actions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id)
);

-- Enable Row Level Security
ALTER TABLE public.idea_swot_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies for SWOT analysis access
CREATE POLICY "Users can view their SWOT analyses" 
ON public.idea_swot_analysis 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id = auth.uid()
));

CREATE POLICY "Users can create SWOT analyses for their ideas" 
ON public.idea_swot_analysis 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id = auth.uid()
));

CREATE POLICY "Users can update their SWOT analyses" 
ON public.idea_swot_analysis 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id = auth.uid()
));

CREATE POLICY "Users can delete their SWOT analyses" 
ON public.idea_swot_analysis 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_idea_swot_analysis_updated_at
BEFORE UPDATE ON public.idea_swot_analysis
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();