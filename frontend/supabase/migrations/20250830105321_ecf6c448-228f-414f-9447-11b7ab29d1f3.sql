-- Add missing columns to organization_claims table
ALTER TABLE public.organization_claims 
ADD COLUMN IF NOT EXISTS claim_type text DEFAULT 'financial',
ADD COLUMN IF NOT EXISTS source text DEFAULT 'internal',
ADD COLUMN IF NOT EXISTS response_deadline date,
ADD COLUMN IF NOT EXISTS deadline_days integer DEFAULT 30;

-- Add indices for better performance
CREATE INDEX IF NOT EXISTS idx_organization_claims_type ON public.organization_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_organization_claims_source ON public.organization_claims(source);
CREATE INDEX IF NOT EXISTS idx_organization_claims_status ON public.organization_claims(status);
CREATE INDEX IF NOT EXISTS idx_organization_claims_deadline ON public.organization_claims(response_deadline);
CREATE INDEX IF NOT EXISTS idx_organization_claims_assigned ON public.organization_claims(assigned_to);

-- Create claim events table for tracking history
CREATE TABLE IF NOT EXISTS public.organization_claim_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  claim_id uuid NOT NULL REFERENCES public.organization_claims(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_description text NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on claim events
ALTER TABLE public.organization_claim_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for claim events
CREATE POLICY "Users can view claim events of their organization"
ON public.organization_claim_events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.organization_claims oc
    JOIN public.user_profiles up ON up.organization_id = oc.organization_id
    WHERE oc.id = organization_claim_events.claim_id
    AND up.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create claim events for their organization"
ON public.organization_claim_events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.organization_claims oc
    JOIN public.user_profiles up ON up.organization_id = oc.organization_id
    WHERE oc.id = organization_claim_events.claim_id
    AND up.user_id = auth.uid()
  )
);

-- Add trigger to update response_deadline based on deadline_days
CREATE OR REPLACE FUNCTION public.calculate_response_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.deadline_days IS NOT NULL AND NEW.date_received IS NOT NULL THEN
    NEW.response_deadline = NEW.date_received + INTERVAL '1 day' * NEW.deadline_days;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_response_deadline
  BEFORE INSERT OR UPDATE ON public.organization_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_response_deadline();