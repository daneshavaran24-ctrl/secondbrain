-- Make idea_id nullable to allow analysis before idea creation
ALTER TABLE public.idea_analysis_queue 
  ALTER COLUMN idea_id DROP NOT NULL;