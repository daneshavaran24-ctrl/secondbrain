-- Fix remaining functions that don't have search_path set

-- Update trigger_set_timestamp function
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update calculate_response_deadline function
CREATE OR REPLACE FUNCTION public.calculate_response_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline_days IS NOT NULL AND NEW.date_received IS NOT NULL THEN
    NEW.response_deadline = NEW.date_received + INTERVAL '1 day' * NEW.deadline_days;
  END IF;
  RETURN NEW;
END;
$$;

-- Update log_profile_access function
CREATE OR REPLACE FUNCTION public.log_profile_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log when someone accesses a profile that's not their own
    IF auth.uid() != NEW.user_id THEN
        INSERT INTO user_audit_log (
            user_id,
            action,
            details
        ) VALUES (
            auth.uid(),
            'profile_view',
            jsonb_build_object(
                'viewed_profile_id', NEW.user_id,
                'timestamp', now()
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;