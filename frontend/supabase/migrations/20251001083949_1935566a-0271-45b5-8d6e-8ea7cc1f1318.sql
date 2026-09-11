-- ==========================================
-- بازسازی کامل دیتابیس مورا
-- ==========================================

-- 1. ایجاد enum ها با بررسی وجود
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'done', 'archived');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_status') THEN
    CREATE TYPE public.project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
    CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    CREATE TYPE public.organization_type AS ENUM ('varid', 'farangaran', 'khadim_e_khalgh', 'chamber_commerce', 'association', 'other');
  END IF;
END $$;

-- 2. ایجاد جدول پروفایل کاربران
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. ایجاد جدول نقش‌های کاربران
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  system_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- 4. ایجاد جدول سازمان‌ها
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type organization_type DEFAULT 'other',
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations" ON public.organizations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
CREATE POLICY "Users can create organizations" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own organizations" ON public.organizations;
CREATE POLICY "Users can update their own organizations" ON public.organizations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own organizations" ON public.organizations;
CREATE POLICY "Users can delete their own organizations" ON public.organizations
  FOR DELETE USING (auth.uid() = user_id);

-- 5. ایجاد جدول شرکت‌ها
CREATE TABLE IF NOT EXISTS public.business_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.business_companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own companies" ON public.business_companies;
CREATE POLICY "Users can view their own companies" ON public.business_companies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create companies" ON public.business_companies;
CREATE POLICY "Users can create companies" ON public.business_companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own companies" ON public.business_companies;
CREATE POLICY "Users can update their own companies" ON public.business_companies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own companies" ON public.business_companies;
CREATE POLICY "Users can delete their own companies" ON public.business_companies
  FOR DELETE USING (auth.uid() = user_id);

-- 6. ایجاد جدول پروژه‌ها
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status project_status DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.business_companies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- 7. ایجاد جدول وظایف پروژه
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view project tasks" ON public.project_tasks;
CREATE POLICY "Users can view project tasks" ON public.project_tasks
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can create tasks" ON public.project_tasks;
CREATE POLICY "Users can create tasks" ON public.project_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their tasks" ON public.project_tasks;
CREATE POLICY "Users can update their tasks" ON public.project_tasks
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = assigned_to);

DROP POLICY IF EXISTS "Users can delete their tasks" ON public.project_tasks;
CREATE POLICY "Users can delete their tasks" ON public.project_tasks
  FOR DELETE USING (auth.uid() = user_id);

-- 8. ایجاد جدول برنامه‌ریزی شخصی
CREATE TABLE IF NOT EXISTS public.personal_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  domain TEXT DEFAULT 'personal',
  category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.personal_planning ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own plans" ON public.personal_planning;
CREATE POLICY "Users can view their own plans" ON public.personal_planning
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create plans" ON public.personal_planning;
CREATE POLICY "Users can create plans" ON public.personal_planning
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their plans" ON public.personal_planning;
CREATE POLICY "Users can update their plans" ON public.personal_planning
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their plans" ON public.personal_planning;
CREATE POLICY "Users can delete their plans" ON public.personal_planning
  FOR DELETE USING (auth.uid() = user_id);

-- 9. ایجاد جدول ایده‌ها
CREATE TABLE IF NOT EXISTS public.ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  domain TEXT DEFAULT 'personal',
  category TEXT,
  status TEXT DEFAULT 'new',
  priority task_priority DEFAULT 'medium',
  tags TEXT[],
  ai_analysis JSONB,
  feasibility_score INTEGER,
  impact_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ideas" ON public.ideas;
CREATE POLICY "Users can view their own ideas" ON public.ideas
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create ideas" ON public.ideas;
CREATE POLICY "Users can create ideas" ON public.ideas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their ideas" ON public.ideas;
CREATE POLICY "Users can update their ideas" ON public.ideas
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their ideas" ON public.ideas;
CREATE POLICY "Users can delete their ideas" ON public.ideas
  FOR DELETE USING (auth.uid() = user_id);

-- 10. ایجاد جدول جلسات
CREATE TABLE IF NOT EXISTS public.meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date TIMESTAMPTZ NOT NULL,
  duration INTEGER,
  status meeting_status DEFAULT 'scheduled',
  location TEXT,
  agenda TEXT,
  notes TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.business_companies(id) ON DELETE SET NULL,
  domain TEXT DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own meetings" ON public.meetings;
CREATE POLICY "Users can view their own meetings" ON public.meetings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create meetings" ON public.meetings;
CREATE POLICY "Users can create meetings" ON public.meetings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their meetings" ON public.meetings;
CREATE POLICY "Users can update their meetings" ON public.meetings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their meetings" ON public.meetings;
CREATE POLICY "Users can delete their meetings" ON public.meetings
  FOR DELETE USING (auth.uid() = user_id);

-- 11. ایجاد جدول مشارکت‌کنندگان جلسات
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view meeting participants" ON public.meeting_participants;
CREATE POLICY "Users can view meeting participants" ON public.meeting_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_participants.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Meeting owners can manage participants" ON public.meeting_participants;
CREATE POLICY "Meeting owners can manage participants" ON public.meeting_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings 
      WHERE meetings.id = meeting_participants.meeting_id 
      AND meetings.user_id = auth.uid()
    )
  );

-- 12. ایجاد جدول تقویم
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  all_day BOOLEAN DEFAULT false,
  event_type TEXT,
  color TEXT,
  domain TEXT DEFAULT 'personal',
  related_task_id UUID,
  related_meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own events" ON public.calendar_events;
CREATE POLICY "Users can view their own events" ON public.calendar_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create events" ON public.calendar_events;
CREATE POLICY "Users can create events" ON public.calendar_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their events" ON public.calendar_events;
CREATE POLICY "Users can update their events" ON public.calendar_events
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their events" ON public.calendar_events;
CREATE POLICY "Users can delete their events" ON public.calendar_events
  FOR DELETE USING (auth.uid() = user_id);

-- 13. ایجاد جدول دانش (Knowledge Base)
CREATE TABLE IF NOT EXISTS public.knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  source_url TEXT,
  para_category TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own knowledge" ON public.knowledge_items;
CREATE POLICY "Users can view their own knowledge" ON public.knowledge_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create knowledge" ON public.knowledge_items;
CREATE POLICY "Users can create knowledge" ON public.knowledge_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their knowledge" ON public.knowledge_items;
CREATE POLICY "Users can update their knowledge" ON public.knowledge_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their knowledge" ON public.knowledge_items;
CREATE POLICY "Users can delete their knowledge" ON public.knowledge_items
  FOR DELETE USING (auth.uid() = user_id);

-- 14. ایجاد جدول گزارش سلامت
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight DECIMAL,
  blood_pressure TEXT,
  heart_rate INTEGER,
  sleep_hours DECIMAL,
  exercise_minutes INTEGER,
  water_intake INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own health data" ON public.health_metrics;
CREATE POLICY "Users can view their own health data" ON public.health_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create health data" ON public.health_metrics;
CREATE POLICY "Users can create health data" ON public.health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their health data" ON public.health_metrics;
CREATE POLICY "Users can update their health data" ON public.health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their health data" ON public.health_metrics;
CREATE POLICY "Users can delete their health data" ON public.health_metrics
  FOR DELETE USING (auth.uid() = user_id);

-- 15. ایجاد جدول سپاسگزاری
CREATE TABLE IF NOT EXISTS public.gratitude_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT,
  tags TEXT[],
  media_urls TEXT[],
  links TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own gratitude" ON public.gratitude_entries;
CREATE POLICY "Users can view their own gratitude" ON public.gratitude_entries
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create gratitude" ON public.gratitude_entries;
CREATE POLICY "Users can create gratitude" ON public.gratitude_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their gratitude" ON public.gratitude_entries;
CREATE POLICY "Users can update their gratitude" ON public.gratitude_entries
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their gratitude" ON public.gratitude_entries;
CREATE POLICY "Users can delete their gratitude" ON public.gratitude_entries
  FOR DELETE USING (auth.uid() = user_id);

-- 16. ایجاد جدول محتوای فرهنگی
CREATE TABLE IF NOT EXISTS public.cultural_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference TEXT,
  language TEXT DEFAULT 'fa',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cultural_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view cultural content" ON public.cultural_content;
CREATE POLICY "Anyone can view cultural content" ON public.cultural_content
  FOR SELECT USING (true);

-- 17. ایجاد جدول تواقق‌نامه‌های سازمانی
CREATE TABLE IF NOT EXISTS public.correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  correspondence_type TEXT,
  reference_number TEXT,
  date DATE,
  status TEXT DEFAULT 'draft',
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.correspondence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their correspondence" ON public.correspondence;
CREATE POLICY "Users can view their correspondence" ON public.correspondence
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create correspondence" ON public.correspondence;
CREATE POLICY "Users can create correspondence" ON public.correspondence
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their correspondence" ON public.correspondence;
CREATE POLICY "Users can update their correspondence" ON public.correspondence
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their correspondence" ON public.correspondence;
CREATE POLICY "Users can delete their correspondence" ON public.correspondence
  FOR DELETE USING (auth.uid() = user_id);

-- 18. ایجاد جدول مدیریت ریسک
CREATE TABLE IF NOT EXISTS public.organization_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  likelihood INTEGER CHECK (likelihood >= 1 AND likelihood <= 5),
  impact INTEGER CHECK (impact >= 1 AND impact <= 5),
  mitigation_strategy TEXT,
  status TEXT DEFAULT 'identified',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_risks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their risks" ON public.organization_risks;
CREATE POLICY "Users can view their risks" ON public.organization_risks
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create risks" ON public.organization_risks;
CREATE POLICY "Users can create risks" ON public.organization_risks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their risks" ON public.organization_risks;
CREATE POLICY "Users can update their risks" ON public.organization_risks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their risks" ON public.organization_risks;
CREATE POLICY "Users can delete their risks" ON public.organization_risks
  FOR DELETE USING (auth.uid() = user_id);

-- 19. ایجاد جدول خط‌مشی‌های سازمانی
CREATE TABLE IF NOT EXISTS public.organization_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  policy_type TEXT,
  status TEXT DEFAULT 'draft',
  effective_date DATE,
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their policies" ON public.organization_policies;
CREATE POLICY "Users can view their policies" ON public.organization_policies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create policies" ON public.organization_policies;
CREATE POLICY "Users can create policies" ON public.organization_policies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their policies" ON public.organization_policies;
CREATE POLICY "Users can update their policies" ON public.organization_policies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their policies" ON public.organization_policies;
CREATE POLICY "Users can delete their policies" ON public.organization_policies
  FOR DELETE USING (auth.uid() = user_id);

-- 20. ایجاد جدول ماموریت‌های سازمانی
CREATE TABLE IF NOT EXISTS public.organization_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES public.organization_policies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL,
  current_value DECIMAL DEFAULT 0,
  unit TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organization_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their missions" ON public.organization_missions;
CREATE POLICY "Users can view their missions" ON public.organization_missions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create missions" ON public.organization_missions;
CREATE POLICY "Users can create missions" ON public.organization_missions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their missions" ON public.organization_missions;
CREATE POLICY "Users can update their missions" ON public.organization_missions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their missions" ON public.organization_missions;
CREATE POLICY "Users can delete their missions" ON public.organization_missions
  FOR DELETE USING (auth.uid() = user_id);

-- 21. ایجاد جدول پست‌های سازمانی (جانشین‌پروری)
CREATE TABLE IF NOT EXISTS public.succession_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  level TEXT,
  criticality TEXT DEFAULT 'medium',
  requirements TEXT[],
  current_holder TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.succession_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their positions" ON public.succession_positions;
CREATE POLICY "Users can view their positions" ON public.succession_positions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create positions" ON public.succession_positions;
CREATE POLICY "Users can create positions" ON public.succession_positions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their positions" ON public.succession_positions;
CREATE POLICY "Users can update their positions" ON public.succession_positions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their positions" ON public.succession_positions;
CREATE POLICY "Users can delete their positions" ON public.succession_positions
  FOR DELETE USING (auth.uid() = user_id);

-- 22. ایجاد جدول وکیل و حقوقی
CREATE TABLE IF NOT EXISTS public.legal_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  case_type TEXT,
  status TEXT DEFAULT 'open',
  court TEXT,
  judge TEXT,
  opposing_party TEXT,
  filing_date DATE,
  next_hearing_date DATE,
  domain TEXT DEFAULT 'personal',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their legal cases" ON public.legal_cases;
CREATE POLICY "Users can view their legal cases" ON public.legal_cases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create legal cases" ON public.legal_cases;
CREATE POLICY "Users can create legal cases" ON public.legal_cases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their legal cases" ON public.legal_cases;
CREATE POLICY "Users can update their legal cases" ON public.legal_cases
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their legal cases" ON public.legal_cases;
CREATE POLICY "Users can delete their legal cases" ON public.legal_cases
  FOR DELETE USING (auth.uid() = user_id);

-- 23. ایجاد Indexes برای بهبود عملکرد
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_user_id ON public.project_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON public.project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON public.ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON public.calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_personal_planning_user_id ON public.personal_planning(user_id);
CREATE INDEX IF NOT EXISTS idx_organizations_user_id ON public.organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.business_companies(user_id);

-- 24. ایجاد Function برای بررسی نقش کاربر
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
  )
$$;

-- 25. ایجاد Function برای به‌روزرسانی خودکار updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 26. ایجاد Triggers برای به‌روزرسانی خودکار updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.business_companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.business_companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_meetings_updated_at ON public.meetings;
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 27. ایجاد Function برای ایجاد پروفایل خودکار هنگام ثبت‌نام
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, full_name, email)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 28. ایجاد Trigger برای ایجاد پروفایل خودکار
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();