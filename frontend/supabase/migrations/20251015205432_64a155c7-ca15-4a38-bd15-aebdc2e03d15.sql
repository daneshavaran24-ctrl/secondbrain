-- RLS Policies for Sub-User Domain Access

-- تابع کمکی برای بررسی دسترسی Sub-User به domain
CREATE OR REPLACE FUNCTION public.check_sub_user_domain_access(
  _user_id uuid,
  _domain text,
  _permission text DEFAULT 'read'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_type text;
  _has_access boolean;
BEGIN
  -- بررسی نوع کاربر
  _user_type := public.get_user_type(_user_id);
  
  -- اگر owner است، دسترسی کامل دارد
  IF _user_type = 'owner' THEN
    RETURN true;
  END IF;
  
  -- اگر sub_user است، بررسی دسترسی
  IF _user_type = 'sub_user' THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.sub_user_permissions
      WHERE sub_user_id = _user_id
        AND domain = _domain
        AND _permission = ANY(permissions)
    ) INTO _has_access;
    
    RETURN _has_access;
  END IF;
  
  -- به طور پیش‌فرض دسترسی ندارد
  RETURN false;
END;
$$;

-- Policy برای calendar_events
DROP POLICY IF EXISTS "Sub-users can view allowed domain events" ON calendar_events;
CREATE POLICY "Sub-users can view allowed calendar events"
ON calendar_events
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'calendar', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create calendar events" ON calendar_events;
CREATE POLICY "Sub-users can create calendar events"
ON calendar_events
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'calendar', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

DROP POLICY IF EXISTS "Sub-users can update calendar events" ON calendar_events;
CREATE POLICY "Sub-users can update calendar events"
ON calendar_events
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'calendar', 'write')
);

DROP POLICY IF EXISTS "Sub-users can delete calendar events" ON calendar_events;
CREATE POLICY "Sub-users can delete calendar events"
ON calendar_events
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'calendar', 'delete')
);

-- Policy برای meetings
DROP POLICY IF EXISTS "Sub-users can view meetings" ON meetings;
CREATE POLICY "Sub-users can view meetings"
ON meetings
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'meetings', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create meetings" ON meetings;
CREATE POLICY "Sub-users can create meetings"
ON meetings
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'meetings', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

DROP POLICY IF EXISTS "Sub-users can update meetings" ON meetings;
CREATE POLICY "Sub-users can update meetings"
ON meetings
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'meetings', 'write')
);

DROP POLICY IF EXISTS "Sub-users can delete meetings" ON meetings;
CREATE POLICY "Sub-users can delete meetings"
ON meetings
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'meetings', 'delete')
);

-- Policy برای ideas
DROP POLICY IF EXISTS "Sub-users can view ideas" ON ideas;
CREATE POLICY "Sub-users can view ideas"
ON ideas
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'ideas', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create ideas" ON ideas;
CREATE POLICY "Sub-users can create ideas"
ON ideas
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'ideas', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

DROP POLICY IF EXISTS "Sub-users can update ideas" ON ideas;
CREATE POLICY "Sub-users can update ideas"
ON ideas
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'ideas', 'write')
);

DROP POLICY IF EXISTS "Sub-users can delete ideas" ON ideas;
CREATE POLICY "Sub-users can delete ideas"
ON ideas
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'ideas', 'delete')
);

-- Policy برای knowledge_items
DROP POLICY IF EXISTS "Sub-users can view knowledge" ON knowledge_items;
CREATE POLICY "Sub-users can view knowledge"
ON knowledge_items
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'knowledge', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create knowledge" ON knowledge_items;
CREATE POLICY "Sub-users can create knowledge"
ON knowledge_items
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'knowledge', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

DROP POLICY IF EXISTS "Sub-users can update knowledge" ON knowledge_items;
CREATE POLICY "Sub-users can update knowledge"
ON knowledge_items
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'knowledge', 'write')
);

DROP POLICY IF EXISTS "Sub-users can delete knowledge" ON knowledge_items;
CREATE POLICY "Sub-users can delete knowledge"
ON knowledge_items
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'knowledge', 'delete')
);

-- Policy برای delegation_tasks
DROP POLICY IF EXISTS "Sub-users can view delegation tasks" ON delegation_tasks;
CREATE POLICY "Sub-users can view delegation tasks"
ON delegation_tasks
FOR SELECT
TO authenticated
USING (
  (auth.uid() = delegator_id OR auth.uid() = delegatee_id)
  OR public.check_sub_user_domain_access(auth.uid(), 'delegation', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create delegation tasks" ON delegation_tasks;
CREATE POLICY "Sub-users can create delegation tasks"
ON delegation_tasks
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = delegator_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'delegation', 'write') AND delegator_id = public.get_owner_id(auth.uid()))
);

-- Policy برای health_metrics
DROP POLICY IF EXISTS "Sub-users can view health data" ON health_metrics;
CREATE POLICY "Sub-users can view health data"
ON health_metrics
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'health', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create health data" ON health_metrics;
CREATE POLICY "Sub-users can create health data"
ON health_metrics
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'health', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

-- Policy برای gratitude_entries
DROP POLICY IF EXISTS "Sub-users can view gratitude" ON gratitude_entries;
CREATE POLICY "Sub-users can view gratitude"
ON gratitude_entries
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'gratitude', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create gratitude" ON gratitude_entries;
CREATE POLICY "Sub-users can create gratitude"
ON gratitude_entries
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'gratitude', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

-- Policy برای correspondence
DROP POLICY IF EXISTS "Sub-users can view correspondence" ON correspondence;
CREATE POLICY "Sub-users can view correspondence"
ON correspondence
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'correspondence', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create correspondence" ON correspondence;
CREATE POLICY "Sub-users can create correspondence"
ON correspondence
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'correspondence', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

-- Policy برای legal_cases
DROP POLICY IF EXISTS "Sub-users can view legal cases" ON legal_cases;
CREATE POLICY "Sub-users can view legal cases"
ON legal_cases
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'legal', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create legal cases" ON legal_cases;
CREATE POLICY "Sub-users can create legal cases"
ON legal_cases
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'legal', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

-- Policy برای business_companies
DROP POLICY IF EXISTS "Sub-users can view companies" ON business_companies;
CREATE POLICY "Sub-users can view companies"
ON business_companies
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'business', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create companies" ON business_companies;
CREATE POLICY "Sub-users can create companies"
ON business_companies
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'business', 'write') AND user_id = public.get_owner_id(auth.uid()))
);

-- Policy برای csr_projects
DROP POLICY IF EXISTS "Sub-users can view CSR projects" ON csr_projects;
CREATE POLICY "Sub-users can view CSR projects"
ON csr_projects
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR public.check_sub_user_domain_access(auth.uid(), 'csr', 'read')
);

DROP POLICY IF EXISTS "Sub-users can create CSR projects" ON csr_projects;
CREATE POLICY "Sub-users can create CSR projects"
ON csr_projects
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id)
  OR 
  (public.check_sub_user_domain_access(auth.uid(), 'csr', 'write') AND user_id = public.get_owner_id(auth.uid()))
);