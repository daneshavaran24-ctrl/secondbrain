-- Fix profiles_table_rls: Restrict profile viewing to own profile or organization members
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile or org members" 
  ON public.profiles FOR SELECT 
  USING (
    auth.uid() = user_id OR
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM public.user_organizations uo1
      JOIN public.user_organizations uo2 ON uo1.organization_id = uo2.organization_id
      WHERE uo1.user_id = auth.uid() 
      AND (uo2.user_id = profiles.user_id OR uo2.user_id = profiles.id)
    )
  );

-- Fix employee_sensitive_data: Restrict salary/bank data to admin/owner roles only
DROP POLICY IF EXISTS "Users can view employees in their organizations" ON public.organization_employees;

-- Allow org members to view basic employee info (non-sensitive fields accessed via application layer)
CREATE POLICY "Org members can view employees" 
  ON public.organization_employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

-- Allow HR managers (admin/owner) to insert employees
DROP POLICY IF EXISTS "HR can insert employees" ON public.organization_employees;
CREATE POLICY "HR admins can insert employees"
  ON public.organization_employees FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

-- Allow HR managers (admin/owner) to update employees  
DROP POLICY IF EXISTS "HR can update employees" ON public.organization_employees;
CREATE POLICY "HR admins can update employees"
  ON public.organization_employees FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
    )
  );

-- Allow HR managers (admin/owner) to delete employees
DROP POLICY IF EXISTS "HR can delete employees" ON public.organization_employees;
CREATE POLICY "HR admins can delete employees"
  ON public.organization_employees FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations
      WHERE user_organizations.organization_id = organization_employees.organization_id
      AND user_organizations.user_id = auth.uid()
      AND user_organizations.role IN ('owner', 'admin')
    )
  );