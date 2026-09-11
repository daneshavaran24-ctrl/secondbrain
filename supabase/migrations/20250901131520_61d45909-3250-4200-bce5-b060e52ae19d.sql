-- Create mission progress logs table for tracking history
CREATE TABLE public.mission_progress_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mission_id UUID NOT NULL,
  user_id UUID NOT NULL,
  organization_id UUID,
  old_progress INTEGER DEFAULT 0,
  new_progress INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mission_progress_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for mission progress logs
CREATE POLICY "Users can create progress logs for their organization missions"
ON public.mission_progress_logs
FOR INSERT
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
  AND user_id = auth.uid()
);

CREATE POLICY "Users can view progress logs of their organization missions"
ON public.mission_progress_logs
FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
);

-- Create function to automatically log mission progress changes
CREATE OR REPLACE FUNCTION public.log_mission_progress_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if progress or status actually changed
  IF (OLD.progress IS DISTINCT FROM NEW.progress) OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.mission_progress_logs (
      mission_id,
      user_id,
      organization_id,
      old_progress,
      new_progress,
      old_status,
      new_status
    ) VALUES (
      NEW.id,
      auth.uid(),
      NEW.organization_id,
      COALESCE(OLD.progress, 0),
      COALESCE(NEW.progress, 0),
      OLD.status,
      NEW.status
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic logging
CREATE TRIGGER mission_progress_change_trigger
  AFTER UPDATE ON public.organizational_missions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_mission_progress_change();

-- Create indexes for better performance
CREATE INDEX idx_mission_progress_logs_mission_id ON public.mission_progress_logs(mission_id);
CREATE INDEX idx_mission_progress_logs_organization_id ON public.mission_progress_logs(organization_id);
CREATE INDEX idx_mission_progress_logs_created_at ON public.mission_progress_logs(created_at);

-- Enable realtime for organizational_missions table
ALTER TABLE public.organizational_missions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizational_missions;

-- Enable realtime for mission_progress_logs table
ALTER TABLE public.mission_progress_logs REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mission_progress_logs;