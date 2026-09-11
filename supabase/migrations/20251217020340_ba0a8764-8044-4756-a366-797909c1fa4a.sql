-- Enable RLS on plaud_sync_logs table
ALTER TABLE public.plaud_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plaud_sync_logs
CREATE POLICY "Users can view their own sync logs"
ON public.plaud_sync_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
ON public.plaud_sync_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync logs"
ON public.plaud_sync_logs
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync logs"
ON public.plaud_sync_logs
FOR DELETE
USING (auth.uid() = user_id);