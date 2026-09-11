-- Fix security issue: Change update_updated_at_column to SECURITY INVOKER
-- This function only updates timestamps and doesn't need elevated privileges

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER  -- Changed from SECURITY DEFINER to SECURITY INVOKER
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;