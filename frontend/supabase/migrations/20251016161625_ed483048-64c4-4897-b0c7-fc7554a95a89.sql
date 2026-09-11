-- Create enum for analysis queue status
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');

-- Create idea_analysis_queue table
CREATE TABLE public.idea_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status analysis_status NOT NULL DEFAULT 'pending',
  analysis_result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.idea_analysis_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own analysis queue"
  ON public.idea_analysis_queue
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis queue"
  ON public.idea_analysis_queue
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update analysis queue"
  ON public.idea_analysis_queue
  FOR UPDATE
  USING (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.idea_analysis_queue;

-- Create index for performance
CREATE INDEX idx_analysis_queue_user_status ON public.idea_analysis_queue(user_id, status);
CREATE INDEX idx_analysis_queue_idea ON public.idea_analysis_queue(idea_id);

-- Trigger for updated_at
CREATE TRIGGER update_idea_analysis_queue_updated_at
  BEFORE UPDATE ON public.idea_analysis_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();