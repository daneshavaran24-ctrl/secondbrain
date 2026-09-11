-- Drop existing policies if they exist
DO $$ 
BEGIN
  -- Drop user_organizations policies
  DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.user_organizations;
  DROP POLICY IF EXISTS "Users can create organization memberships" ON public.user_organizations;
  DROP POLICY IF EXISTS "Users can update their organization memberships" ON public.user_organizations;
  DROP POLICY IF EXISTS "Users can delete their organization memberships" ON public.user_organizations;
  
  -- Drop ai_chat_messages policies
  DROP POLICY IF EXISTS "Users can view their own messages" ON public.ai_chat_messages;
  DROP POLICY IF EXISTS "Users can create messages" ON public.ai_chat_messages;
  DROP POLICY IF EXISTS "Users can delete their messages" ON public.ai_chat_messages;
  
  -- Drop delegation_tasks policies
  DROP POLICY IF EXISTS "Users can view tasks they delegated or were delegated to" ON public.delegation_tasks;
  DROP POLICY IF EXISTS "Users can create delegation tasks" ON public.delegation_tasks;
  DROP POLICY IF EXISTS "Users can update their delegation tasks" ON public.delegation_tasks;
  DROP POLICY IF EXISTS "Users can delete their delegation tasks" ON public.delegation_tasks;
  
  -- Drop delegation_task_events policies
  DROP POLICY IF EXISTS "Users can view events for their tasks" ON public.delegation_task_events;
  DROP POLICY IF EXISTS "Users can create events for their tasks" ON public.delegation_task_events;
  
  -- Drop delegation_attachments policies
  DROP POLICY IF EXISTS "Users can view attachments for their tasks" ON public.delegation_attachments;
  DROP POLICY IF EXISTS "Users can create attachments for their tasks" ON public.delegation_attachments;
  DROP POLICY IF EXISTS "Users can delete attachments for their tasks" ON public.delegation_attachments;
  
  -- Drop delegation_subtasks policies
  DROP POLICY IF EXISTS "Users can view subtasks for their tasks" ON public.delegation_subtasks;
  DROP POLICY IF EXISTS "Users can manage subtasks for their tasks" ON public.delegation_subtasks;
  
  -- Drop delegation_notifications policies
  DROP POLICY IF EXISTS "Users can view their own notifications" ON public.delegation_notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON public.delegation_notifications;
  DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.delegation_notifications;
END $$;

-- Now recreate all policies
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

CREATE POLICY "Users can view their own messages"
  ON public.ai_chat_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages"
  ON public.ai_chat_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their messages"
  ON public.ai_chat_messages FOR DELETE
  USING (auth.uid() = user_id);

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

CREATE POLICY "Users can view their own notifications"
  ON public.delegation_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.delegation_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.delegation_notifications FOR DELETE
  USING (auth.uid() = user_id);