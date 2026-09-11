-- Create user_organizations table for user-organization relationships
CREATE TABLE IF NOT EXISTS public.user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization memberships"
  ON public.user_organizations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create organization memberships"
  ON public.user_organizations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their organization memberships"
  ON public.user_organizations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their organization memberships"
  ON public.user_organizations FOR DELETE
  USING (auth.uid() = user_id);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages"
  ON public.ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their messages"
  ON public.ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

-- Create delegation_tasks table
CREATE TABLE IF NOT EXISTS public.delegation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id UUID NOT NULL,
  delegatee_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delegation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks they delegated or were delegated to"
  ON public.delegation_tasks FOR SELECT
  USING (auth.uid() = delegator_id OR auth.uid() = delegatee_id);

CREATE POLICY "Users can create delegation tasks"
  ON public.delegation_tasks FOR INSERT
  WITH CHECK (auth.uid() = delegator_id);

CREATE POLICY "Users can update their delegation tasks"
  ON public.delegation_tasks FOR UPDATE
  USING (auth.uid() = delegator_id OR auth.uid() = delegatee_id);

CREATE POLICY "Users can delete their delegation tasks"
  ON public.delegation_tasks FOR DELETE
  USING (auth.uid() = delegator_id);

-- Create delegation_task_events table
CREATE TABLE IF NOT EXISTS public.delegation_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delegation_task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view events for their tasks"
  ON public.delegation_task_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_task_events.task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

CREATE POLICY "Users can create events for their tasks"
  ON public.delegation_task_events FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_task_events.task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

-- Create delegation_attachments table
CREATE TABLE IF NOT EXISTS public.delegation_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delegation_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for their tasks"
  ON public.delegation_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_attachments.task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

CREATE POLICY "Users can create attachments for their tasks"
  ON public.delegation_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_attachments.task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

CREATE POLICY "Users can delete attachments for their tasks"
  ON public.delegation_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_attachments.task_id
    AND delegation_tasks.delegator_id = auth.uid()
  ));

-- Create delegation_subtasks table
CREATE TABLE IF NOT EXISTS public.delegation_subtasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delegation_subtasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view subtasks for their tasks"
  ON public.delegation_subtasks FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_subtasks.delegation_task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

CREATE POLICY "Users can manage subtasks for their tasks"
  ON public.delegation_subtasks FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.delegation_tasks
    WHERE delegation_tasks.id = delegation_subtasks.delegation_task_id
    AND (delegation_tasks.delegator_id = auth.uid() OR delegation_tasks.delegatee_id = auth.uid())
  ));

-- Create delegation_notifications table
CREATE TABLE IF NOT EXISTS public.delegation_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.delegation_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.delegation_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.delegation_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.delegation_notifications FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_user_organizations_updated_at
  BEFORE UPDATE ON public.user_organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegation_tasks_updated_at
  BEFORE UPDATE ON public.delegation_tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegation_subtasks_updated_at
  BEFORE UPDATE ON public.delegation_subtasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_organizations_user_id ON public.user_organizations(user_id);
CREATE INDEX idx_user_organizations_organization_id ON public.user_organizations(organization_id);
CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX idx_delegation_tasks_delegator_id ON public.delegation_tasks(delegator_id);
CREATE INDEX idx_delegation_tasks_delegatee_id ON public.delegation_tasks(delegatee_id);
CREATE INDEX idx_delegation_task_events_task_id ON public.delegation_task_events(task_id);
CREATE INDEX idx_delegation_attachments_task_id ON public.delegation_attachments(task_id);
CREATE INDEX idx_delegation_subtasks_task_id ON public.delegation_subtasks(delegation_task_id);
CREATE INDEX idx_delegation_notifications_user_id ON public.delegation_notifications(user_id);