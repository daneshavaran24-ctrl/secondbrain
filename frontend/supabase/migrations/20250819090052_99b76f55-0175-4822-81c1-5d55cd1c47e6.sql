-- Create missing tables for AI chat and delegation functionality

-- AI Chat Messages table
CREATE TABLE public.ai_chat_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    session_type TEXT NOT NULL CHECK (session_type IN ('mentor', 'coach', 'decision-maker')),
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI Chat Sessions table  
CREATE TABLE public.ai_chat_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_type TEXT NOT NULL CHECK (session_type IN ('mentor', 'coach', 'decision-maker')),
    title TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delegation Tasks table
CREATE TABLE public.delegation_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    delegator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    delegatee_email TEXT,
    delegatee_phone TEXT,
    delegatee_name TEXT,
    method TEXT NOT NULL CHECK (method IN ('email', 'sms', 'secretary')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMP WITH TIME ZONE,
    tags TEXT[],
    cc_emails TEXT[],
    requires_confirmation BOOLEAN DEFAULT false,
    project_id UUID,
    domain TEXT,
    organization_id UUID REFERENCES public.organizations(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delegation Subtasks table
CREATE TABLE public.delegation_subtasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delegation Attachments table
CREATE TABLE public.delegation_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delegation Task Events table (for activity tracking)
CREATE TABLE public.delegation_task_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'updated', 'status_changed', 'reminder_sent', 'comment_added')),
    description TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Delegation Notifications table
CREATE TABLE public.delegation_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'reminder')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    recipient TEXT NOT NULL,
    message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for AI Chat Messages
CREATE POLICY "Users can view their own AI chat messages" 
    ON public.ai_chat_messages FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own AI chat messages" 
    ON public.ai_chat_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for AI Chat Sessions
CREATE POLICY "Users can view their own AI chat sessions" 
    ON public.ai_chat_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own AI chat sessions" 
    ON public.ai_chat_sessions FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Delegation Tasks
CREATE POLICY "Users can view their own delegation tasks" 
    ON public.delegation_tasks FOR SELECT 
    USING (auth.uid() = delegator_id);

CREATE POLICY "Users can manage their own delegation tasks" 
    ON public.delegation_tasks FOR ALL 
    USING (auth.uid() = delegator_id)
    WITH CHECK (auth.uid() = delegator_id);

-- RLS Policies for Delegation Subtasks (inherit from parent task)
CREATE POLICY "Users can view subtasks of their delegation tasks" 
    ON public.delegation_subtasks FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.task_id 
        AND delegator_id = auth.uid()
    ));

CREATE POLICY "Users can manage subtasks of their delegation tasks" 
    ON public.delegation_subtasks FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.task_id 
        AND delegator_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_subtasks.task_id 
        AND delegator_id = auth.uid()
    ));

-- RLS Policies for Delegation Attachments (inherit from parent task)
CREATE POLICY "Users can view attachments of their delegation tasks" 
    ON public.delegation_attachments FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_attachments.task_id 
        AND delegator_id = auth.uid()
    ));

CREATE POLICY "Users can manage attachments of their delegation tasks" 
    ON public.delegation_attachments FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_attachments.task_id 
        AND delegator_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_attachments.task_id 
        AND delegator_id = auth.uid()
    ));

-- RLS Policies for Delegation Task Events (inherit from parent task)
CREATE POLICY "Users can view events of their delegation tasks" 
    ON public.delegation_task_events FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_task_events.task_id 
        AND delegator_id = auth.uid()
    ));

CREATE POLICY "Users can create events for their delegation tasks" 
    ON public.delegation_task_events FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_task_events.task_id 
        AND delegator_id = auth.uid()
    ));

-- RLS Policies for Delegation Notifications (inherit from parent task)
CREATE POLICY "Users can view notifications of their delegation tasks" 
    ON public.delegation_notifications FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_notifications.task_id 
        AND delegator_id = auth.uid()
    ));

CREATE POLICY "Users can manage notifications of their delegation tasks" 
    ON public.delegation_notifications FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_notifications.task_id 
        AND delegator_id = auth.uid()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.delegation_tasks 
        WHERE id = delegation_notifications.task_id 
        AND delegator_id = auth.uid()
    ));

-- Add updated_at triggers
CREATE TRIGGER update_ai_chat_messages_updated_at
    BEFORE UPDATE ON public.ai_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_chat_sessions_updated_at
    BEFORE UPDATE ON public.ai_chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegation_tasks_updated_at
    BEFORE UPDATE ON public.delegation_tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delegation_subtasks_updated_at
    BEFORE UPDATE ON public.delegation_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_user_id ON public.ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_delegation_tasks_delegator_id ON public.delegation_tasks(delegator_id);
CREATE INDEX idx_delegation_tasks_status ON public.delegation_tasks(status);
CREATE INDEX idx_delegation_tasks_due_date ON public.delegation_tasks(due_date);
CREATE INDEX idx_delegation_subtasks_task_id ON public.delegation_subtasks(task_id);
CREATE INDEX idx_delegation_attachments_task_id ON public.delegation_attachments(task_id);
CREATE INDEX idx_delegation_task_events_task_id ON public.delegation_task_events(task_id);
CREATE INDEX idx_delegation_notifications_task_id ON public.delegation_notifications(task_id);