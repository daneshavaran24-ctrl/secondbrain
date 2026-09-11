-- Fix security vulnerability: Restrict organization_claims access to authorized personnel only
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can manage claims of their organization" ON public.organization_claims;
DROP POLICY IF EXISTS "Users can view claims of their organization" ON public.organization_claims;

-- Create more restrictive policies for claims access
-- Only system admins and organization leadership can view claims
CREATE POLICY "Authorized personnel can view organization claims" 
ON public.organization_claims 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND up.organization_id = organization_claims.organization_id
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
);

-- Only system admins and authorized managers can create claims
CREATE POLICY "Authorized personnel can create organization claims" 
ON public.organization_claims 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND up.organization_id = organization_claims.organization_id
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
);

-- Only system admins and authorized managers can update claims
CREATE POLICY "Authorized personnel can update organization claims" 
ON public.organization_claims 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND up.organization_id = organization_claims.organization_id
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND up.organization_id = organization_claims.organization_id
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
);

-- Only system admins can delete claims
CREATE POLICY "Only admins can delete organization claims" 
ON public.organization_claims 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.system_role = 'admin'
  )
);

-- Apply same restrictions to organization_claim_events
DROP POLICY IF EXISTS "Users can create claim events for their organization" ON public.organization_claim_events;
DROP POLICY IF EXISTS "Users can view claim events of their organization" ON public.organization_claim_events;

-- Only authorized personnel can view claim events
CREATE POLICY "Authorized personnel can view claim events" 
ON public.organization_claim_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM organization_claims oc
    JOIN user_profiles up ON up.organization_id = oc.organization_id
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE oc.id = organization_claim_events.claim_id 
      AND up.user_id = auth.uid()
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
);

-- Only authorized personnel can create claim events
CREATE POLICY "Authorized personnel can create claim events" 
ON public.organization_claim_events 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_claims oc
    JOIN user_profiles up ON up.organization_id = oc.organization_id
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE oc.id = organization_claim_events.claim_id 
      AND up.user_id = auth.uid()
      AND ur.system_role IN ('admin', 'manager', 'secretary')
  )
);