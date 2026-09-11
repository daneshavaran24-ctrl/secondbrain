-- Fix critical security issue: Knowledge Base table has no RLS policies
-- Add comprehensive access controls to protect sensitive knowledge articles

-- Enable RLS on knowledge_base table (should already be enabled but ensuring it)
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own articles
CREATE POLICY "Users can view their own knowledge articles"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- Policy 2: Users can view public articles
CREATE POLICY "Users can view public knowledge articles"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (is_public = true AND status = 'published');

-- Policy 3: Users can view articles from their organization (non-public articles within same org)
CREATE POLICY "Users can view organization knowledge articles"
ON public.knowledge_base
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
      AND organization_id IS NOT NULL
  )
);

-- Policy 4: Users can create their own knowledge articles
CREATE POLICY "Users can create their own knowledge articles"
ON public.knowledge_base
FOR INSERT
TO authenticated
WITH CHECK (author_id = auth.uid());

-- Policy 5: Users can update their own articles
CREATE POLICY "Users can update their own knowledge articles"
ON public.knowledge_base
FOR UPDATE
TO authenticated
USING (author_id = auth.uid())
WITH CHECK (author_id = auth.uid());

-- Policy 6: Users can delete their own articles
CREATE POLICY "Users can delete their own knowledge articles"
ON public.knowledge_base
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Policy 7: Organization admins can manage articles within their organization
CREATE POLICY "Organization admins can manage knowledge articles"
ON public.knowledge_base
FOR ALL
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND organization_id IN (
    SELECT up.organization_id 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND ur.system_role = 'admin'
      AND up.organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IS NOT NULL 
  AND organization_id IN (
    SELECT up.organization_id 
    FROM user_profiles up
    JOIN user_roles ur ON ur.user_id = up.user_id
    WHERE up.user_id = auth.uid() 
      AND ur.system_role = 'admin'
      AND up.organization_id IS NOT NULL
  )
);