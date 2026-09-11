-- Fix critical security issue: Business data exposed without access controls
-- Add comprehensive RLS policies for meeting_minutes and projects tables

-- Enable RLS on both tables (ensuring they're protected)
ALTER TABLE public.meeting_minutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- MEETING_MINUTES TABLE POLICIES
-- Users can view meeting minutes from their organization
CREATE POLICY "Users can view organization meeting minutes"
ON public.meeting_minutes
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Users can create meeting minutes for their organization
CREATE POLICY "Users can create organization meeting minutes"
ON public.meeting_minutes
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Users can update meeting minutes from their organization
CREATE POLICY "Users can update organization meeting minutes"
ON public.meeting_minutes
FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
)
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Users can delete meeting minutes from their organization (organizers or admins)
CREATE POLICY "Organizers can delete their meeting minutes"
ON public.meeting_minutes
FOR DELETE
TO authenticated
USING (
  (organization_id IS NOT NULL 
   AND organization_id = public.get_current_user_organization()
   AND organizer_id = auth.uid())
  OR public.is_user_admin()
);

-- System admins can manage all meeting minutes
CREATE POLICY "System admins can manage all meeting minutes"
ON public.meeting_minutes
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

-- PROJECTS TABLE POLICIES
-- Users can view projects from their organization
CREATE POLICY "Users can view organization projects"
ON public.projects
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Users can create projects for their organization
CREATE POLICY "Users can create organization projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id = public.get_current_user_organization()
);

-- Project managers and admins can update projects
CREATE POLICY "Project managers can update their projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (
  (organization_id IS NOT NULL 
   AND organization_id = public.get_current_user_organization()
   AND manager_id = auth.uid())
  OR public.is_user_admin()
)
WITH CHECK (
  (organization_id IS NOT NULL 
   AND organization_id = public.get_current_user_organization()
   AND manager_id = auth.uid())
  OR public.is_user_admin()
);

-- Project managers and admins can delete projects
CREATE POLICY "Project managers can delete their projects"
ON public.projects
FOR DELETE
TO authenticated
USING (
  (organization_id IS NOT NULL 
   AND organization_id = public.get_current_user_organization()
   AND manager_id = auth.uid())
  OR public.is_user_admin()
);

-- System admins can manage all projects
CREATE POLICY "System admins can manage all projects"
ON public.projects
FOR ALL
TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());