-- Phase 1: سیستم اعلانات سازمانی

-- جدول اعلانات سازمانی
CREATE TABLE public.organization_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_notification_type CHECK (
    type IN ('member_joined', 'member_left', 'project_created', 'project_updated', 
             'task_assigned', 'task_completed', 'report_generated', 'settings_changed',
             'invitation_sent', 'invitation_accepted', 'role_changed')
  )
);

-- Indexes برای بهبود performance
CREATE INDEX idx_org_notifications_org_user ON public.organization_notifications(organization_id, user_id);
CREATE INDEX idx_org_notifications_unread ON public.organization_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_org_notifications_created ON public.organization_notifications(created_at DESC);

-- RLS Policies
ALTER TABLE public.organization_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization notifications"
ON public.organization_notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM public.user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "System can insert notifications"
ON public.organization_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their notifications"
ON public.organization_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their notifications"
ON public.organization_notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- فعال‌سازی Realtime
ALTER TABLE public.organization_notifications REPLICA IDENTITY FULL;

-- Phase 2: سیستم مدیریت اعضا و نقش‌ها

-- Enum برای نقش‌های سازمانی
CREATE TYPE public.organization_role AS ENUM ('owner', 'admin', 'manager', 'member', 'viewer');

-- به‌روزرسانی جدول user_organizations
ALTER TABLE public.user_organizations
ADD COLUMN IF NOT EXISTS role organization_role DEFAULT 'member',
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES auth.users(id);

-- جدول دعوتنامه‌ها
CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_pending_invitation UNIQUE(organization_id, email, status)
);

-- Indexes
CREATE INDEX idx_org_invitations_token ON public.organization_invitations(token) WHERE status = 'pending';
CREATE INDEX idx_org_invitations_org ON public.organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON public.organization_invitations(email);
CREATE INDEX idx_org_invitations_status ON public.organization_invitations(status) WHERE status = 'pending';

-- RLS Policies برای invitations
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization invitations"
ON public.organization_invitations FOR SELECT
TO authenticated
USING (
  invited_by = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) OR
  (email = auth.email() AND status = 'pending')
);

CREATE POLICY "Admins can create invitations"
ON public.organization_invitations FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can update invitations"
ON public.organization_invitations FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) OR
  (email = auth.email() AND status = 'pending')
);

CREATE POLICY "Admins can delete invitations"
ON public.organization_invitations FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Function برای بررسی انقضای دعوتنامه‌ها
CREATE OR REPLACE FUNCTION public.expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.organization_invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < now();
END;
$$;

-- Function برای بررسی نقش کاربر در سازمان
CREATE OR REPLACE FUNCTION public.has_organization_role(
  _user_id UUID,
  _organization_id UUID,
  _required_role organization_role
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_organizations
    WHERE user_id = _user_id
      AND organization_id = _organization_id
      AND role::text <= _required_role::text
  )
$$;

-- RLS Policy برای user_organizations با نقش‌ها
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can insert their own organizations" ON public.user_organizations;

CREATE POLICY "Users can view organizations they belong to"
ON public.user_organizations FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Users can join organizations via invitation"
ON public.user_organizations FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  (
    -- کاربر سازمان را ایجاد می‌کند (owner)
    organization_id IN (SELECT id FROM public.organizations WHERE user_id = auth.uid())
    OR
    -- یا دعوتنامه معتبر دارد
    EXISTS (
      SELECT 1 FROM public.organization_invitations
      WHERE organization_id = user_organizations.organization_id
        AND email = auth.email()
        AND status = 'pending'
        AND expires_at > now()
    )
  )
);

CREATE POLICY "Admins can update member roles"
ON public.user_organizations FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

CREATE POLICY "Admins can remove members"
ON public.user_organizations FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM public.user_organizations 
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ) AND user_id != auth.uid() -- نمی‌تواند خودش را حذف کند
);