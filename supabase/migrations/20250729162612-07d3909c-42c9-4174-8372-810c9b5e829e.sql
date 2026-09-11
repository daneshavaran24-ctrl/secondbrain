-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'secretary', 'user');
CREATE TYPE public.organization_type AS ENUM ('vardaha', 'farangaran', 'association', 'chamber');
CREATE TYPE public.knowledge_type AS ENUM ('document', 'link', 'image', 'note', 'video', 'audio');
CREATE TYPE public.knowledge_category AS ENUM ('projects', 'areas', 'resources', 'archive');
CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.delegation_method AS ENUM ('sms', 'email', 'secretary', 'app');
CREATE TYPE public.delegation_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'declined');
CREATE TYPE public.idea_stage AS ENUM ('concept', 'research', 'development', 'testing', 'implementation', 'launched');
CREATE TYPE public.notification_type AS ENUM ('task', 'meeting', 'deadline', 'mention', 'system');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. User Management Tables
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    phone TEXT,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role, organization_id)
);

CREATE TABLE public.organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Knowledge Management System
CREATE TABLE public.knowledge_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    content TEXT,
    type knowledge_type NOT NULL,
    category knowledge_category NOT NULL,
    url TEXT,
    file_path TEXT,
    metadata JSONB DEFAULT '{}',
    is_favorite BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.knowledge_item_tags (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    knowledge_item_id UUID NOT NULL REFERENCES public.knowledge_items(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES public.knowledge_tags(id) ON DELETE CASCADE,
    UNIQUE(knowledge_item_id, tag_id)
);

-- 3. Project Management
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority priority DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    budget DECIMAL(12,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.project_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    skills TEXT[],
    availability INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(project_id, user_id)
);

CREATE TABLE public.project_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_hours INTEGER,
    actual_hours INTEGER,
    tags TEXT[],
    dependencies UUID[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.task_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.task_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES public.project_tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Meeting Management
CREATE TABLE public.meetings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    description TEXT,
    status meeting_status DEFAULT 'scheduled',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    location TEXT,
    meeting_url TEXT,
    recording_url TEXT,
    transcript TEXT,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.meeting_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    email TEXT,
    name TEXT,
    role TEXT DEFAULT 'participant',
    speaking_time INTEGER DEFAULT 0,
    attention_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(meeting_id, user_id),
    UNIQUE(meeting_id, email)
);

CREATE TABLE public.action_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    status task_status DEFAULT 'todo',
    priority priority DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Task Delegation System
CREATE TABLE public.delegation_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delegatee_id UUID REFERENCES auth.users(id),
    delegatee_email TEXT,
    delegatee_phone TEXT,
    title TEXT NOT NULL,
    description TEXT,
    status delegation_status DEFAULT 'pending',
    priority priority DEFAULT 'medium',
    method delegation_method NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.delegation_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    delegation_task_id UUID NOT NULL REFERENCES public.delegation_tasks(id) ON DELETE CASCADE,
    method delegation_method NOT NULL,
    recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    delivered BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE
);

-- 6. Innovation & Idea Management
CREATE TABLE public.ideas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    description TEXT,
    stage idea_stage DEFAULT 'concept',
    priority priority DEFAULT 'medium',
    potential_impact INTEGER DEFAULT 0,
    feasibility_score INTEGER DEFAULT 0,
    estimated_budget DECIMAL(12,2),
    target_market TEXT,
    expected_roi DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.idea_inspirations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.idea_risks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    risk_type TEXT NOT NULL,
    description TEXT NOT NULL,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    impact INTEGER DEFAULT 0 CHECK (impact >= 0 AND impact <= 100),
    mitigation_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.idea_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES public.ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. Secretary Management
CREATE TABLE public.secretary_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    secretary_code TEXT UNIQUE NOT NULL,
    permissions TEXT[] DEFAULT '{}',
    hourly_request_limit INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.secretary_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    secretary_id UUID NOT NULL REFERENCES public.secretary_users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    type TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.secretary_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID NOT NULL DEFAULT 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    request_id UUID NOT NULL REFERENCES public.secretary_requests(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Personal Journal
CREATE TABLE public.journal_entries (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT NOT NULL,
    mood TEXT,
    tags TEXT[],
    is_private BOOLEAN DEFAULT true,
    weather TEXT,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.journal_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. Daily Content
CREATE TABLE public.quran_verses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    surah_number INTEGER NOT NULL,
    verse_number INTEGER NOT NULL,
    arabic_text TEXT NOT NULL,
    persian_translation TEXT NOT NULL,
    english_translation TEXT,
    theme TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(surah_number, verse_number)
);

CREATE TABLE public.motivational_quotes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    text TEXT NOT NULL,
    author TEXT,
    source TEXT,
    category TEXT,
    language TEXT DEFAULT 'persian',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.daily_content (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    verse_id UUID REFERENCES public.quran_verses(id),
    quote_id UUID REFERENCES public.motivational_quotes(id),
    personal_note TEXT,
    reflection TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, date)
);

-- 10. Health & Analytics
CREATE TABLE public.health_metrics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    unit TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    source TEXT DEFAULT 'manual',
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE public.trend_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    relevance_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_insights (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    data_sources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Dashboard & Settings
CREATE TABLE public.dashboards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_default BOOLEAN DEFAULT false,
    layout JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.dashboard_widgets (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    dashboard_id UUID NOT NULL REFERENCES public.dashboards(id) ON DELETE CASCADE,
    widget_type TEXT NOT NULL,
    title TEXT NOT NULL,
    configuration JSONB DEFAULT '{}',
    position JSONB DEFAULT '{}',
    size JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system',
    language TEXT DEFAULT 'persian',
    timezone TEXT DEFAULT 'Asia/Tehran',
    notification_preferences JSONB DEFAULT '{}',
    dashboard_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Notification System
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_knowledge_items_user_id ON public.knowledge_items(user_id);
CREATE INDEX idx_knowledge_items_category ON public.knowledge_items(category);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX idx_project_tasks_assignee_id ON public.project_tasks(assignee_id);
CREATE INDEX idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX idx_meetings_start_time ON public.meetings(start_time);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_daily_content_user_date ON public.daily_content(user_id, date);

-- Add foreign key for organization_id in profiles
ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_organization 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON public.knowledge_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON public.project_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON public.task_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_action_items_updated_at BEFORE UPDATE ON public.action_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_delegation_tasks_updated_at BEFORE UPDATE ON public.delegation_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON public.ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_idea_milestones_updated_at BEFORE UPDATE ON public.idea_milestones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_secretary_users_updated_at BEFORE UPDATE ON public.secretary_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON public.dashboards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON public.dashboard_widgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delegation_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idea_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.motivational_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trend_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create security definer function for checking user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create RLS policies
-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT USING (true);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Organizations policies
CREATE POLICY "Users can view all organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Admins can manage organizations" ON public.organizations FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Knowledge items policies
CREATE POLICY "Users can view their own knowledge items" ON public.knowledge_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own knowledge items" ON public.knowledge_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own knowledge items" ON public.knowledge_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own knowledge items" ON public.knowledge_items FOR DELETE USING (auth.uid() = user_id);

-- Knowledge tags policies
CREATE POLICY "Users can view all tags" ON public.knowledge_tags FOR SELECT USING (true);
CREATE POLICY "Users can create tags" ON public.knowledge_tags FOR INSERT USING (auth.uid() IS NOT NULL);

-- Knowledge item tags policies
CREATE POLICY "Users can view knowledge item tags" ON public.knowledge_item_tags FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their knowledge item tags" ON public.knowledge_item_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM public.knowledge_items WHERE id = knowledge_item_id AND user_id = auth.uid())
);

-- Projects policies
CREATE POLICY "Users can view their own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- Project members policies
CREATE POLICY "Users can view project members" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR
  user_id = auth.uid()
);
CREATE POLICY "Project owners can manage members" ON public.project_members FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- Project tasks policies
CREATE POLICY "Users can view project tasks" ON public.project_tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR
  assignee_id = auth.uid()
);
CREATE POLICY "Users can manage project tasks" ON public.project_tasks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid()) OR
  assignee_id = auth.uid()
);

-- Task comments policies
CREATE POLICY "Users can view task comments" ON public.task_comments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_tasks pt 
    JOIN public.projects p ON pt.project_id = p.id 
    WHERE pt.id = task_id AND (p.user_id = auth.uid() OR pt.assignee_id = auth.uid())
  )
);
CREATE POLICY "Users can create task comments" ON public.task_comments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.project_tasks pt 
    JOIN public.projects p ON pt.project_id = p.id 
    WHERE pt.id = task_id AND (p.user_id = auth.uid() OR pt.assignee_id = auth.uid())
  )
);

-- Task attachments policies
CREATE POLICY "Users can view task attachments" ON public.task_attachments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.project_tasks pt 
    JOIN public.projects p ON pt.project_id = p.id 
    WHERE pt.id = task_id AND (p.user_id = auth.uid() OR pt.assignee_id = auth.uid())
  )
);
CREATE POLICY "Users can create task attachments" ON public.task_attachments FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.project_tasks pt 
    JOIN public.projects p ON pt.project_id = p.id 
    WHERE pt.id = task_id AND (p.user_id = auth.uid() OR pt.assignee_id = auth.uid())
  )
);

-- Meetings policies
CREATE POLICY "Users can view their own meetings" ON public.meetings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own meetings" ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meetings" ON public.meetings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (auth.uid() = user_id);

-- Meeting participants policies
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid()) OR
  user_id = auth.uid()
);
CREATE POLICY "Meeting owners can manage participants" ON public.meeting_participants FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid())
);

-- Action items policies
CREATE POLICY "Users can view action items" ON public.action_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid()) OR
  assignee_id = auth.uid()
);
CREATE POLICY "Users can manage action items" ON public.action_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.meetings WHERE id = meeting_id AND user_id = auth.uid()) OR
  assignee_id = auth.uid()
);

-- Delegation tasks policies
CREATE POLICY "Users can view their delegation tasks" ON public.delegation_tasks FOR SELECT USING (
  auth.uid() = delegator_id OR auth.uid() = delegatee_id
);
CREATE POLICY "Users can create delegation tasks" ON public.delegation_tasks FOR INSERT WITH CHECK (auth.uid() = delegator_id);
CREATE POLICY "Users can update their delegation tasks" ON public.delegation_tasks FOR UPDATE USING (
  auth.uid() = delegator_id OR auth.uid() = delegatee_id
);

-- Delegation notifications policies
CREATE POLICY "Users can view delegation notifications" ON public.delegation_notifications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.delegation_tasks 
    WHERE id = delegation_task_id AND (delegator_id = auth.uid() OR delegatee_id = auth.uid())
  )
);

-- Ideas policies
CREATE POLICY "Users can view their own ideas" ON public.ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own ideas" ON public.ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own ideas" ON public.ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own ideas" ON public.ideas FOR DELETE USING (auth.uid() = user_id);

-- Idea inspirations policies
CREATE POLICY "Users can view idea inspirations" ON public.idea_inspirations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage idea inspirations" ON public.idea_inspirations FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);

-- Idea risks policies
CREATE POLICY "Users can view idea risks" ON public.idea_risks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage idea risks" ON public.idea_risks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);

-- Idea milestones policies
CREATE POLICY "Users can view idea milestones" ON public.idea_milestones FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage idea milestones" ON public.idea_milestones FOR ALL USING (
  EXISTS (SELECT 1 FROM public.ideas WHERE id = idea_id AND user_id = auth.uid())
);

-- Secretary users policies
CREATE POLICY "Admins can view secretary users" ON public.secretary_users FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage secretary users" ON public.secretary_users FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Secretaries can view their own data" ON public.secretary_users FOR SELECT USING (auth.uid() = user_id);

-- Secretary requests policies
CREATE POLICY "Secretaries can view their requests" ON public.secretary_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.secretary_users WHERE id = secretary_id AND user_id = auth.uid())
);
CREATE POLICY "Secretaries can create requests" ON public.secretary_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.secretary_users WHERE id = secretary_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can view all secretary requests" ON public.secretary_requests FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Secretary notifications policies
CREATE POLICY "Admins can view secretary notifications" ON public.secretary_notifications FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage secretary notifications" ON public.secretary_notifications FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Journal entries policies
CREATE POLICY "Users can view their own journal entries" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own journal entries" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own journal entries" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own journal entries" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

-- Journal attachments policies
CREATE POLICY "Users can view their journal attachments" ON public.journal_attachments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.journal_entries WHERE id = journal_entry_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their journal attachments" ON public.journal_attachments FOR ALL USING (
  EXISTS (SELECT 1 FROM public.journal_entries WHERE id = journal_entry_id AND user_id = auth.uid())
);

-- Quran verses policies (public read-only)
CREATE POLICY "Everyone can view Quran verses" ON public.quran_verses FOR SELECT USING (true);
CREATE POLICY "Admins can manage Quran verses" ON public.quran_verses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Motivational quotes policies (public read-only)
CREATE POLICY "Everyone can view motivational quotes" ON public.motivational_quotes FOR SELECT USING (true);
CREATE POLICY "Admins can manage motivational quotes" ON public.motivational_quotes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Daily content policies
CREATE POLICY "Users can view their own daily content" ON public.daily_content FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create their own daily content" ON public.daily_content FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own daily content" ON public.daily_content FOR UPDATE USING (auth.uid() = user_id);

-- Health metrics policies
CREATE POLICY "Users can view their own health metrics" ON public.health_metrics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own health metrics" ON public.health_metrics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own health metrics" ON public.health_metrics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own health metrics" ON public.health_metrics FOR DELETE USING (auth.uid() = user_id);

-- Trend items policies
CREATE POLICY "Users can view trend items" ON public.trend_items FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can create trend items" ON public.trend_items FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- AI insights policies
CREATE POLICY "Users can view their own AI insights" ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own AI insights" ON public.ai_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Dashboards policies
CREATE POLICY "Users can view their own dashboards" ON public.dashboards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own dashboards" ON public.dashboards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dashboards" ON public.dashboards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dashboards" ON public.dashboards FOR DELETE USING (auth.uid() = user_id);

-- Dashboard widgets policies
CREATE POLICY "Users can view their dashboard widgets" ON public.dashboard_widgets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.dashboards WHERE id = dashboard_id AND user_id = auth.uid())
);
CREATE POLICY "Users can manage their dashboard widgets" ON public.dashboard_widgets FOR ALL USING (
  EXISTS (SELECT 1 FROM public.dashboards WHERE id = dashboard_id AND user_id = auth.uid())
);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System can create notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Storage policies
CREATE POLICY "Users can view their own documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Media files are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Users can upload media files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own recordings" ON storage.objects FOR SELECT USING (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own recordings" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own attachments" ON storage.objects FOR SELECT USING (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload their own attachments" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, display_name, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name'
  );
  
  -- Insert default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Insert default user settings
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  -- Create default dashboard
  INSERT INTO public.dashboards (user_id, name, is_default)
  VALUES (NEW.id, 'پیش‌فرض', true);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert some default organizations
INSERT INTO public.organizations (name, type, description) VALUES
('واریدا', 'vardaha', 'سازمان واریدا'),
('فرنگاران', 'farangaran', 'سازمان فرنگاران'),
('انجمن', 'association', 'انجمن‌های مختلف'),
('اتاق', 'chamber', 'اتاق بازرگانی');

-- Insert some sample Quran verses
INSERT INTO public.quran_verses (surah_number, verse_number, arabic_text, persian_translation, theme) VALUES
(2, 255, 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ', 'خداوند است که معبودی جز او نیست، زنده و پاینده است، نه چرت و نه خواب او را فرا می‌گیرد', 'توحید'),
(3, 159, 'فَبِمَا رَحْمَةٍ مِّنَ اللَّهِ لِنتَ لَهُمْ', 'پس به رحمت خدا نرم و مهربان بودی با آنان', 'اخلاق'),
(13, 28, 'أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ', 'آگاه باشید که دل‌ها با یاد خدا آرام می‌گیرد', 'آرامش');

-- Insert some motivational quotes
INSERT INTO public.motivational_quotes (text, author, category, language) VALUES
('موفقیت حاصل تلاش مداوم و پشتکار است.', 'ناشناس', 'انگیزشی', 'persian'),
('هر روز فرصتی نو برای شروع دوباره است.', 'ناشناس', 'امید', 'persian'),
('علم طلب کردن بر هر مسلمان فریضه است.', 'حضرت محمد (ص)', 'تعلیم', 'persian');

-- Insert some knowledge tags
INSERT INTO public.knowledge_tags (name, color) VALUES
('مهم', '#EF4444'),
('کار', '#3B82F6'),
('شخصی', '#10B981'),
('یادگیری', '#F59E0B'),
('پروژه', '#8B5CF6'),
('ایده', '#EC4899');