-- Temporary fix to allow demo users to create ideas
-- Add a policy for demo users (users with demo-user- prefix)
-- Cast user_id to text for string operations

CREATE POLICY "Demo users can create ideas" 
ON public.ideas 
FOR INSERT 
WITH CHECK (user_id::text LIKE 'demo-user-%');

CREATE POLICY "Demo users can view their demo ideas" 
ON public.ideas 
FOR SELECT 
USING (user_id::text LIKE 'demo-user-%');

-- Allow demo users to create inspirations
CREATE POLICY "Demo users can create inspirations" 
ON public.idea_inspirations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_inspirations.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));

CREATE POLICY "Demo users can view their inspirations" 
ON public.idea_inspirations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_inspirations.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));

-- Allow demo users to create SWOT analysis
CREATE POLICY "Demo users can create SWOT analysis" 
ON public.idea_swot_analysis 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));

CREATE POLICY "Demo users can view their SWOT analysis" 
ON public.idea_swot_analysis 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_swot_analysis.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));

-- Allow demo users to create risk analysis
CREATE POLICY "Demo users can create risk analysis" 
ON public.idea_risks 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_risks.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));

CREATE POLICY "Demo users can view their risk analysis" 
ON public.idea_risks 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM ideas 
  WHERE ideas.id = idea_risks.idea_id 
  AND ideas.user_id::text LIKE 'demo-user-%'
));