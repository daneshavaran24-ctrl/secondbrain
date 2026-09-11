-- Fix security issues from the migration

-- Fix function search path for calculate_response_deadline function
CREATE OR REPLACE FUNCTION public.calculate_response_deadline()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.deadline_days IS NOT NULL AND NEW.date_received IS NOT NULL THEN
    NEW.response_deadline = NEW.date_received + INTERVAL '1 day' * NEW.deadline_days;
  END IF;
  RETURN NEW;
END;
$$;

-- Add missing RLS policy for project_tasks table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'project_tasks' AND table_schema = 'public') THEN
        -- Add RLS policies for project_tasks if they don't exist
        CREATE POLICY IF NOT EXISTS "Users can view organization project tasks"
        ON public.project_tasks
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.user_profiles up ON up.organization_id = p.organization_id
            WHERE p.id = project_tasks.project_id
            AND up.user_id = auth.uid()
          )
        );

        CREATE POLICY IF NOT EXISTS "Users can manage organization project tasks"
        ON public.project_tasks
        FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.user_profiles up ON up.organization_id = p.organization_id
            WHERE p.id = project_tasks.project_id
            AND up.user_id = auth.uid()
          )
        )
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.projects p
            JOIN public.user_profiles up ON up.organization_id = p.organization_id
            WHERE p.id = project_tasks.project_id
            AND up.user_id = auth.uid()
          )
        );
    END IF;
END $$;