-- Fix function search path only
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