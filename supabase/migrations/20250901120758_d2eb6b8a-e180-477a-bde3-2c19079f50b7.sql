-- Fix security vulnerability: Restrict access to organizational data based on organization membership

-- Drop the overly permissive policies that allow viewing all data
DROP POLICY IF EXISTS "Users can view all policies" ON public.organizational_policies;
DROP POLICY IF EXISTS "Users can view all KPIs" ON public.organizational_kpis;
DROP POLICY IF EXISTS "Users can view all workflows" ON public.approval_workflows;

-- Create secure RLS policies for organizational_policies
CREATE POLICY "Users can view policies of their organization"
ON public.organizational_policies
FOR SELECT 
USING (
  (organization_id IS NOT NULL AND organization_id = get_current_user_organization()) 
  OR 
  (user_id = auth.uid())
);

-- Create secure RLS policies for organizational_kpis  
CREATE POLICY "Users can view KPIs of their organization"
ON public.organizational_kpis
FOR SELECT 
USING (
  (organization_id IS NOT NULL AND organization_id = get_current_user_organization()) 
  OR 
  (user_id = auth.uid())
);

-- Create secure RLS policies for approval_workflows
CREATE POLICY "Users can view workflows of their organization" 
ON public.approval_workflows
FOR SELECT 
USING (
  (organization_id IS NOT NULL AND organization_id = get_current_user_organization()) 
  OR 
  (user_id = auth.uid())
);