-- Create user_organizations table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  position_title text,
  is_active boolean DEFAULT true,
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their own organizations"
ON public.user_organizations
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organizations"
ON public.user_organizations
FOR INSERT
WITH CHECK (auth.uid() = user_id AND (
  SELECT COUNT(*) FROM public.user_organizations WHERE user_id = auth.uid()
) < 8);

CREATE POLICY "Users can update their own organizations"
ON public.user_organizations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own organizations"
ON public.user_organizations
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all user organizations
CREATE POLICY "Admins can manage all user organizations"
ON public.user_organizations
FOR ALL
USING (is_user_admin())
WITH CHECK (is_user_admin());

-- Create updated_at trigger
CREATE TRIGGER set_updated_at_user_organizations
BEFORE UPDATE ON public.user_organizations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(target_user_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  organization_id uuid,
  organization_name text,
  position_title text,
  is_active boolean,
  joined_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    uo.id,
    uo.organization_id,
    o.name as organization_name,
    uo.position_title,
    uo.is_active,
    uo.joined_date
  FROM user_organizations uo
  JOIN organizations o ON o.id = uo.organization_id
  WHERE uo.user_id = COALESCE(target_user_id, auth.uid())
    AND uo.is_active = true
  ORDER BY uo.joined_date DESC;
$$;