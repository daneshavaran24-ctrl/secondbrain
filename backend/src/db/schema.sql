-- BrainForge PostgreSQL Schema
-- اجرا: psql -U postgres -d brainforge -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(255),
  first_name   VARCHAR(100),
  last_name    VARCHAR(100),
  mobile_phone VARCHAR(20),
  office_phone VARCHAR(20),
  home_phone   VARCHAR(20),
  national_id  VARCHAR(20),
  address      TEXT,
  employee_id  VARCHAR(50),
  department   VARCHAR(100),
  position     VARCHAR(100),
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  system_role VARCHAR(50) NOT NULL DEFAULT 'user'
    CHECK (system_role IN ('user', 'admin', 'moderator')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REFRESH TOKENS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- ─── PASSWORD RESET ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_resets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SUB USERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sub_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sub_user_permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_user_id UUID NOT NULL REFERENCES sub_users(id) ON DELETE CASCADE,
  domain      VARCHAR(100) NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_sub_user_permissions_sub_user_id ON sub_user_permissions(sub_user_id);

-- ─── AI CHAT ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(500),
  session_type VARCHAR(50) DEFAULT 'mentor',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role       VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);

-- ─── IDEAS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ideas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  description TEXT,
  category    VARCHAR(100),
  priority    VARCHAR(20) DEFAULT 'medium',
  status      VARCHAR(50) DEFAULT 'new',
  stage       VARCHAR(50) DEFAULT 'idea',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);

CREATE TABLE IF NOT EXISTS idea_analysis_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id         UUID REFERENCES ideas(id) ON DELETE SET NULL,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  analysis_result JSONB,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MEETINGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS meetings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(500) NOT NULL,
  meeting_date TIMESTAMPTZ,
  description  TEXT,
  status       VARCHAR(50) DEFAULT 'scheduled',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_meetings_user_id ON meetings(user_id);

-- ─── DELEGATION TASKS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delegation_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegator_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  delegatee_id          UUID,
  delegatee_name        VARCHAR(255),
  delegatee_first_name  VARCHAR(100),
  delegatee_last_name   VARCHAR(100),
  delegatee_email       VARCHAR(255),
  delegatee_phone       VARCHAR(50),
  title                 VARCHAR(500) NOT NULL,
  description           TEXT,
  due_date              TIMESTAMPTZ,
  priority              VARCHAR(20) DEFAULT 'medium',
  status                VARCHAR(50) DEFAULT 'pending',
  method                VARCHAR(50) DEFAULT 'email',
  domain                VARCHAR(50) DEFAULT 'personal',
  organization_id       UUID,
  requires_confirmation BOOLEAN DEFAULT FALSE,
  cc_recipients         JSONB DEFAULT '[]',
  tags                  JSONB DEFAULT '[]',
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delegation_tasks_delegator_id ON delegation_tasks(delegator_id);

-- افزودن ستون‌های جدید به delegation_tasks در صورت وجود جدول قدیمی
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_id UUID;
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_name VARCHAR(255);
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_first_name VARCHAR(100);
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_last_name VARCHAR(100);
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_email VARCHAR(255);
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS delegatee_phone VARCHAR(50);
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS method VARCHAR(50) DEFAULT 'email';
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS domain VARCHAR(50) DEFAULT 'personal';
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS organization_id UUID;
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS requires_confirmation BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS cc_recipients JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';
ALTER TABLE IF EXISTS delegation_tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ─── DELEGATION SUB-TABLES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS delegation_subtasks (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_task_id UUID NOT NULL REFERENCES delegation_tasks(id) ON DELETE CASCADE,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title              VARCHAR(500) NOT NULL,
  completed          BOOLEAN DEFAULT FALSE,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delegation_subtasks_task_id ON delegation_subtasks(delegation_task_id);
CREATE INDEX IF NOT EXISTS idx_delegation_subtasks_user_id ON delegation_subtasks(user_id);

CREATE TABLE IF NOT EXISTS delegation_notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    UUID REFERENCES delegation_tasks(id) ON DELETE CASCADE,
  title      VARCHAR(500),
  message    TEXT,
  read       BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delegation_notifications_user_id ON delegation_notifications(user_id);

CREATE TABLE IF NOT EXISTS delegation_attachments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES delegation_tasks(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name  VARCHAR(500),
  file_path  TEXT,
  mime_type  VARCHAR(100),
  file_size  INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delegation_attachments_task_id ON delegation_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_delegation_attachments_user_id ON delegation_attachments(user_id);

CREATE TABLE IF NOT EXISTS delegation_task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES delegation_tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type  VARCHAR(100),
  description TEXT,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_delegation_task_events_user_id ON delegation_task_events(user_id);
CREATE INDEX IF NOT EXISTS idx_delegation_task_events_task_id ON delegation_task_events(task_id);

-- ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS knowledge_base (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(500) NOT NULL,
  content    TEXT,
  category   VARCHAR(100),
  tags       JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_author_id ON knowledge_base(author_id);

-- ─── GRATITUDE ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gratitude_entries (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  mood       VARCHAR(50),
  tags       JSONB DEFAULT '[]',
  media_urls JSONB DEFAULT '[]',
  date       DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gratitude_entries_user_id ON gratitude_entries(user_id);

-- ─── HEALTH ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date             DATE NOT NULL,
  weight           NUMERIC(5,2),
  exercise_minutes INTEGER,
  sleep_hours      NUMERIC(4,1),
  water_intake     INTEGER,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_health_metrics_user_id ON health_metrics(user_id);

-- ─── CALENDAR ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  start_date  TIMESTAMPTZ NOT NULL,
  end_date    TIMESTAMPTZ,
  description TEXT,
  event_type  VARCHAR(50) DEFAULT 'event',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- ─── COMPANIES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS business_companies (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(500) NOT NULL,
  industry     VARCHAR(100),
  description  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─── LEGAL CASES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_cases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  case_number      VARCHAR(100),
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  case_type        VARCHAR(100),
  status           VARCHAR(50) DEFAULT 'active',
  court            VARCHAR(300),
  judge            VARCHAR(300),
  opposing_party   VARCHAR(300),
  filing_date      DATE,
  next_hearing_date DATE,
  domain           VARCHAR(50) DEFAULT 'personal',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_legal_cases_user_id ON legal_cases(user_id);

-- ─── CORRESPONDENCE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS correspondence (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title                VARCHAR(500) NOT NULL,
  correspondence_type  VARCHAR(50),
  content              TEXT,
  reference_number     VARCHAR(100),
  status               VARCHAR(50) DEFAULT 'draft',
  date                 DATE DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── CSR PROJECTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS csr_projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  type        VARCHAR(100),
  description TEXT,
  budget      NUMERIC(15,2),
  status      VARCHAR(50) DEFAULT 'planning',
  priority    VARCHAR(20) DEFAULT 'medium',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SOCIAL MEDIA ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_media_posts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform   VARCHAR(50) NOT NULL,
  content    TEXT NOT NULL,
  post_url   TEXT,
  media_url  TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HI DOCK ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hi_dock_recordings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title             VARCHAR(500),
  category          VARCHAR(100) DEFAULT 'personal',
  dock_recording_id VARCHAR(255),
  recorded_at       TIMESTAMPTZ,
  audio_url         TEXT,
  transcript        TEXT,
  processing_status VARCHAR(50) DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TELEGRAM ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS telegram_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE NOT NULL,
  username    VARCHAR(255),
  first_name  VARCHAR(255),
  last_name   VARCHAR(255),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_raw_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id    BIGINT NOT NULL,
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type        VARCHAR(50) DEFAULT 'text',
  raw_content         TEXT,
  media_url           TEXT,
  telegram_message_id BIGINT,
  chat_id             BIGINT,
  processing_status   VARCHAR(50) DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_conversations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id   BIGINT NOT NULL,
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_module      VARCHAR(100),
  conversation_state JSONB DEFAULT '{}',
  current_step       VARCHAR(100),
  step_index         INTEGER DEFAULT 0,
  is_active          BOOLEAN DEFAULT TRUE,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS telegram_processed_entries (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message_id    UUID REFERENCES telegram_raw_messages(id) ON DELETE SET NULL,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_module     VARCHAR(100),
  target_record_id  UUID,
  processing_result JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── AUDIT ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_audit (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id   UUID,
  actor_type VARCHAR(50),
  action     VARCHAR(100) NOT NULL,
  details    JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_audit_actor_id ON auth_audit(actor_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON auth_audit(created_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action       VARCHAR(100) NOT NULL,
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  details      JSONB DEFAULT '{}',
  timestamp    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── HABIT TRACKER ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  emoji        VARCHAR(10) DEFAULT '✓',
  description  TEXT,
  category     VARCHAR(100) DEFAULT 'general',
  color        VARCHAR(50) DEFAULT '#3B82F6',
  target_days  INTEGER DEFAULT 7,
  is_active    BOOLEAN DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  archived_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);

CREATE TABLE IF NOT EXISTS habit_completions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id        UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed       BOOLEAN DEFAULT TRUE,
  notes           TEXT,
  completed_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_id ON habit_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON habit_completions(habit_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_completions_unique ON habit_completions(habit_id, completion_date);

CREATE TABLE IF NOT EXISTS habit_streaks (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id             UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak       INTEGER DEFAULT 0,
  longest_streak       INTEGER DEFAULT 0,
  last_completion_date DATE,
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_habit_streaks_user_id ON habit_streaks(user_id);

CREATE TABLE IF NOT EXISTS habit_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_enabled BOOLEAN DEFAULT FALSE,
  notification_time    VARCHAR(10) DEFAULT '20:00',
  theme                VARCHAR(50) DEFAULT 'default',
  start_of_week        INTEGER DEFAULT 6,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PERSONAL CONTACTS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS personal_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name    VARCHAR(255) NOT NULL,
  phone        VARCHAR(50),
  email        VARCHAR(255),
  organization VARCHAR(255),
  role         VARCHAR(100),
  address      TEXT,
  notes        TEXT,
  category     VARCHAR(100) DEFAULT 'general',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_personal_contacts_user_id ON personal_contacts(user_id);

-- ─── CULTURAL CONTENT ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cultural_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(500) NOT NULL,
  content      TEXT,
  content_type VARCHAR(50) NOT NULL DEFAULT 'book',
  reference    TEXT,
  cover_image  TEXT,
  status       VARCHAR(50) DEFAULT 'planning',
  rating       INTEGER,
  progress     INTEGER DEFAULT 0,
  tags         JSONB DEFAULT '[]',
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cultural_content_user_id ON cultural_content(user_id);

-- ─── NETWORKING ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS networking_contacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id            UUID,
  organization_id       UUID,
  name                  VARCHAR(255) NOT NULL,
  title                 VARCHAR(255),
  organization_name     VARCHAR(255),
  email                 VARCHAR(255),
  phone                 VARCHAR(50),
  linkedin_url          TEXT,
  photo_url             TEXT,
  category              VARCHAR(100) DEFAULT 'professional',
  relationship_strength INTEGER DEFAULT 5,
  networking_goal       TEXT,
  how_met               TEXT,
  met_at_event          TEXT,
  met_date              DATE,
  status                VARCHAR(50) DEFAULT 'warm',
  last_interaction_date DATE,
  next_followup_date    DATE,
  tags                  JSONB DEFAULT '[]',
  notes                 TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_networking_contacts_user_id ON networking_contacts(user_id);

CREATE TABLE IF NOT EXISTS networking_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id       UUID NOT NULL REFERENCES networking_contacts(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(100),
  title            VARCHAR(500) NOT NULL,
  description      TEXT,
  interaction_date DATE,
  duration         INTEGER,
  outcome          TEXT,
  follow_up_action TEXT,
  follow_up_date   DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_networking_interactions_user_id ON networking_interactions(user_id);

CREATE TABLE IF NOT EXISTS networking_goals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id      UUID,
  organization_id UUID,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  target_count    INTEGER DEFAULT 1,
  current_count   INTEGER DEFAULT 0,
  category        VARCHAR(100),
  deadline        DATE,
  status          VARCHAR(50) DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_networking_goals_user_id ON networking_goals(user_id);

CREATE TABLE IF NOT EXISTS networking_events (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id           UUID,
  organization_id      UUID,
  title                VARCHAR(500) NOT NULL,
  event_type           VARCHAR(100),
  location             TEXT,
  event_date           DATE,
  contacts_made        INTEGER DEFAULT 0,
  follow_ups_scheduled INTEGER DEFAULT 0,
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_networking_events_user_id ON networking_events(user_id);

-- ─── PHONE OTP ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone      VARCHAR(20)  NOT NULL,
  code_hash  VARCHAR(255) NOT NULL,
  purpose    VARCHAR(50)  NOT NULL DEFAULT 'login',
  expires_at TIMESTAMPTZ  NOT NULL,
  used       BOOLEAN      DEFAULT FALSE,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone   ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires ON phone_otps(expires_at);
-- ─── MIGRATED FROM SUPABASE ────────────────────────────────────────────────

-- Enums (safe create)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
    CREATE TYPE task_status AS ENUM ('todo','in_progress','done','cancelled');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('low','medium','high','urgent');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority') THEN
    CREATE TYPE priority AS ENUM ('low','medium','high','urgent');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_type') THEN
    CREATE TYPE organization_type AS ENUM ('company','ngo','government','startup','other');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'organization_role') THEN
    CREATE TYPE organization_role AS ENUM ('owner','admin','member','viewer');
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resume_section_type') THEN
    CREATE TYPE resume_section_type AS ENUM ('work','education','skills','certificates','awards','publications','affiliations','interests','media');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS organizations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type organization_type NOT NULL,
    description TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role DEFAULT 'member',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_pending_invitation UNIQUE(organization_id, email, status)
);

CREATE TABLE IF NOT EXISTS organization_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  head_id UUID,
  budget NUMERIC,
  parent_department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_code TEXT,
  full_name TEXT NOT NULL,
  position TEXT,
  department_id UUID REFERENCES organization_departments(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  employment_type TEXT DEFAULT 'full-time',
  hire_date DATE,
  base_salary NUMERIC,
  allowances NUMERIC DEFAULT 0,
  bonus NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  bank_account TEXT,
  status TEXT DEFAULT 'active',
  manager_id UUID REFERENCES organization_employees(id) ON DELETE SET NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_policies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  policy_type TEXT NOT NULL DEFAULT 'strategic', -- strategic, operational, annual, quarterly
  status TEXT NOT NULL DEFAULT 'draft', -- draft, approved, active, archived
  priority priority DEFAULT 'medium',
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  effective_date DATE,
  review_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID REFERENCES organization_policies(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS organization_finance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  finance_type TEXT NOT NULL CHECK (finance_type IN ('budget', 'report', 'policy', 'expense')),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC,
  currency TEXT DEFAULT 'IRR',
  content JSONB DEFAULT '{}'::jsonb,
  fiscal_year INTEGER,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_hr (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  hr_type TEXT NOT NULL CHECK (hr_type IN ('org_chart', 'succession', 'competency', 'onboarding', 'offboarding')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('sop', 'checklist', 'form', 'review_calendar')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  version TEXT DEFAULT '1.0',
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('okr', 'roadmap', 'decision_log')),
  title TEXT NOT NULL,
  description TEXT,
  content JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  priority TEXT DEFAULT 'medium',
  start_date DATE,
  end_date DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_okr_key_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  unit TEXT NOT NULL,
  weight INTEGER DEFAULT 25 CHECK (weight >= 0 AND weight <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_roadmap_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'blocked')),
  owner TEXT,
  deliverables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS organization_chart_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_id UUID NOT NULL REFERENCES organization_hr(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  level INTEGER NOT NULL,
  manager_id UUID REFERENCES organization_chart_nodes(id) ON DELETE SET NULL,
  avatar TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  department TEXT NOT NULL,
  employment_type TEXT DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract')),
  start_date DATE NOT NULL,
  location TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  required BOOLEAN DEFAULT false,
  order_index INTEGER NOT NULL,
  has_notes BOOLEAN DEFAULT false,
  has_attachment BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  parent_item_id UUID REFERENCES organization_checklist_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_decision_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  strategy_id UUID NOT NULL REFERENCES organization_strategies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  pros JSONB DEFAULT '[]'::jsonb,
  cons JSONB DEFAULT '[]'::jsonb,
  cost TEXT,
  time_estimate TEXT,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_sop_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operations_id UUID NOT NULL REFERENCES organization_operations(id) ON DELETE CASCADE,
  step_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  responsible TEXT,
  duration TEXT,
  warning TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  parent_step_id UUID REFERENCES organization_sop_steps(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_succession_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hr_id UUID NOT NULL REFERENCES organization_hr(id) ON DELETE CASCADE,
  position TEXT NOT NULL,
  current_holder TEXT NOT NULL,
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('low', 'medium', 'high', 'critical')),
  vacancy_risk INTEGER DEFAULT 50 CHECK (vacancy_risk >= 0 AND vacancy_risk <= 100),
  timeline TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_succession_successors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  succession_plan_id UUID NOT NULL REFERENCES organization_succession_plans(id) ON DELETE CASCADE,
  employee_id TEXT NOT NULL,
  name TEXT NOT NULL,
  readiness TEXT DEFAULT '1-2-years' CHECK (readiness IN ('ready-now', '1-2-years', '3-5-years')),
  readiness_score INTEGER DEFAULT 50 CHECK (readiness_score >= 0 AND readiness_score <= 100),
  strengths JSONB DEFAULT '[]'::jsonb,
  gaps JSONB DEFAULT '[]'::jsonb,
  development_actions JSONB DEFAULT '[]'::jsonb,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES organization_employees(id) ON DELETE CASCADE,
  evaluator_id UUID,
  evaluator_name TEXT NOT NULL,
  evaluation_period TEXT NOT NULL,
  evaluation_date DATE NOT NULL,
  performance_score INTEGER CHECK (performance_score >= 1 AND performance_score <= 5),
  goals_achieved INTEGER CHECK (goals_achieved >= 0 AND goals_achieved <= 100),
  strengths TEXT[],
  areas_for_improvement TEXT[],
  goals_for_next_period TEXT[],
  feedback TEXT,
  employee_comments TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizational_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  claim_number text,
  title text NOT NULL,
  description text,
  claim_type text,
  status text DEFAULT 'open',
  amount numeric,
  currency text DEFAULT 'IRR',
  filed_date date,
  resolution_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizational_policy_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL, -- 'mission', 'policy', 'kpi', 'approval'
    item_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by UUID,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS personal_planning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
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

CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assignee_id UUID REFERENCES users(id),
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

CREATE TABLE IF NOT EXISTS profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS resume_personal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS resume_work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_website TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  university TEXT NOT NULL,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level proficiency_level DEFAULT 'intermediate',
  category TEXT,
  years_of_experience INTEGER,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  certificate_url TEXT,
  description TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  issuing_organization TEXT NOT NULL,
  award_date DATE NOT NULL,
  description TEXT,
  certificate_image_url TEXT,
  video_url TEXT,
  media_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  publication_type TEXT,
  publisher TEXT,
  publication_date DATE NOT NULL,
  isbn TEXT,
  description TEXT,
  cover_image_url TEXT,
  pdf_url TEXT,
  external_link TEXT,
  co_authors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  position TEXT NOT NULL,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  media_urls JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_media_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_source TEXT NOT NULL,
  interview_date DATE NOT NULL,
  content_type media_content_type DEFAULT 'text',
  content_url TEXT,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Template info
  template_name TEXT NOT NULL,
  job_title TEXT,
  company_name TEXT,
  job_description TEXT,
  
  -- Display settings (which sections to show)
  sections_config JSONB DEFAULT '{
    "personal_info": true,
    "education": true,
    "work_experience": true,
    "skills": true,
    "certificates": true,
    "awards": true,
    "affiliations": false,
    "publications": false,
    "media_interviews": false,
    "interests": false
  }'::jsonb,
  
  -- Highlighted items
  highlighted_skills UUID[],
  highlighted_experiences UUID[],
  highlighted_certificates UUID[],
  highlighted_education UUID[],
  highlighted_awards UUID[],
  
  -- AI settings
  ai_optimized BOOLEAN DEFAULT false,
  ai_suggestions JSONB,
  
  -- Metadata
  template_type TEXT DEFAULT 'custom',
  color_scheme TEXT DEFAULT 'professional',
  layout_style TEXT DEFAULT 'modern',
  is_default BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_template_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES resume_templates(id) ON DELETE CASCADE,
  
  -- Customization content
  section_type TEXT NOT NULL,
  item_id UUID NOT NULL,
  
  -- Custom content
  custom_description TEXT,
  custom_highlights TEXT[],
  display_order INTEGER,
  is_visible BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resume_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id UUID REFERENCES resume_templates(id) ON DELETE SET NULL,
  
  -- Export info
  export_format TEXT NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  
  -- Metadata
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  stage_id UUID REFERENCES sales_funnel_stages(id),
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_icp_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  profile_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT,
  annual_revenue_range TEXT,
  decision_makers JSONB DEFAULT '[]'::jsonb,
  pain_points JSONB DEFAULT '[]'::jsonb,
  buying_triggers JSONB DEFAULT '[]'::jsonb,
  preferred_channels JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales_funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  conversion_rate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  position_title text,
  is_active boolean DEFAULT true,
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES system_permissions(id) ON DELETE CASCADE NOT NULL,
  permission_type text NOT NULL CHECK (permission_type IN ('grant', 'revoke')), -- اعطا یا سلب مجوز
  granted_by uuid REFERENCES users(id),
  granted_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  notes text,
  
  UNIQUE(user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_audit_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_permissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  permission_key text NOT NULL UNIQUE, -- کلید منحصر به فرد مجوز
  permission_name text NOT NULL,        -- نام نمایشی مجوز
  description text,                     -- توضیحات مجوز
  category text NOT NULL,               -- دسته‌بندی مجوز
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_business_model_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE UNIQUE,
  customer_segments JSONB,
  value_propositions JSONB,
  channels JSONB,
  customer_relationships JSONB,
  revenue_streams JSONB,
  key_resources JSONB,
  key_activities JSONB,
  key_partnerships JSONB,
  cost_structure JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_swot_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID NOT NULL,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  weaknesses TEXT[] NOT NULL DEFAULT '{}',
  opportunities TEXT[] NOT NULL DEFAULT '{}',
  threats TEXT[] NOT NULL DEFAULT '{}',
  so_strategies TEXT[] NOT NULL DEFAULT '{}', -- Strength-Opportunity strategies
  st_strategies TEXT[] NOT NULL DEFAULT '{}', -- Strength-Threat strategies
  wo_strategies TEXT[] NOT NULL DEFAULT '{}', -- Weakness-Opportunity strategies
  wt_strategies TEXT[] NOT NULL DEFAULT '{}', -- Weakness-Threat strategies
  overall_assessment TEXT,
  priority_actions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(idea_id)
);

CREATE TABLE IF NOT EXISTS idea_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE UNIQUE,
  
  -- استراتژی بازاریابی
  marketing_strategy JSONB,
  target_audience TEXT,
  positioning_statement TEXT,
  
  -- استراتژی رشد
  growth_strategy TEXT,
  scaling_plan JSONB,
  expansion_markets TEXT[],
  
  -- استراتژی رقابتی
  competitive_strategy TEXT,
  competitive_advantage TEXT[],
  differentiation_points TEXT[],
  
  -- استراتژی محصول
  product_roadmap JSONB,
  innovation_approach TEXT,
  technology_stack TEXT[],
  
  -- استراتژی عملیاتی
  operational_strategy TEXT,
  key_processes TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_financial_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE UNIQUE,
  
  -- سرمایه اولیه
  initial_capital_min NUMERIC,
  initial_capital_max NUMERIC,
  initial_capital_currency TEXT DEFAULT 'تومان',
  
  -- هزینه‌های عملیاتی ماهانه
  monthly_operational_costs JSONB,
  
  -- پیش‌بینی درآمد
  revenue_forecast JSONB,
  
  -- نقطه سربه‌سر
  break_even_month INTEGER,
  break_even_analysis TEXT,
  
  -- ROI
  roi_percentage NUMERIC,
  roi_timeline TEXT,
  
  -- نسبت‌های مالی کلیدی
  profit_margin_percentage NUMERIC,
  cash_flow_analysis TEXT,
  
  -- یادداشت‌های اضافی
  financial_notes TEXT,
  assumptions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_milestones (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_risks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    risk_type TEXT NOT NULL,
    description TEXT NOT NULL,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    impact INTEGER DEFAULT 0 CHECK (impact >= 0 AND impact <= 100),
    mitigation_strategy TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_inspirations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL,
    source_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  revenue_model TEXT NOT NULL,
  market_size TEXT,
  pricing_strategy TEXT,
  target_segment TEXT,
  revenue_estimate TEXT,
  timeline TEXT,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_suggested_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  timeline TEXT,
  estimated_effort TEXT,
  dependencies TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS idea_analysis_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status analysis_status NOT NULL DEFAULT 'pending',
  analysis_result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_folders(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items_count INTEGER DEFAULT 0,
  sub_folders_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS knowledge_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
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

CREATE TABLE IF NOT EXISTS csr_project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csr_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  category TEXT CHECK (category IN ('photo', 'video', 'document', 'report')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csr_project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  member_email TEXT,
  role TEXT CHECK (role IN ('manager', 'coordinator', 'volunteer', 'consultant')),
  responsibilities TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS csr_impact_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES csr_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  beneficiaries_count INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(3,2) CHECK (satisfaction_score >= 0 AND satisfaction_score <= 5),
  impact_metrics JSONB,
  feedback TEXT,
  sdg_goals TEXT[],
  assessor_name TEXT,
  assessment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS company_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES business_companies(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  role TEXT,
  organization TEXT,
  type TEXT,
  
  email TEXT,
  phone TEXT,
  address TEXT,
  
  notes TEXT,
  tags TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES business_companies(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  content TEXT,
  category TEXT,
  tags TEXT[],
  
  attachments JSONB,
  is_important BOOLEAN DEFAULT false,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES business_companies(id) ON DELETE CASCADE UNIQUE,
  
  -- Introduction
  vision TEXT,
  mission TEXT,
  values TEXT[],
  established_date DATE,
  employee_count INTEGER,
  annual_revenue NUMERIC,
  
  -- Products/Services
  products_services JSONB,
  
  -- Customers
  target_customers TEXT,
  major_clients TEXT[],
  
  -- Competitors
  competitors JSONB,
  
  -- Goals
  short_term_goals TEXT[],
  long_term_goals TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES business_companies(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  
  assigned_to TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  tags TEXT[],
  attachments JSONB,
  
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS company_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES business_companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Call information
  title TEXT NOT NULL,
  call_type TEXT DEFAULT 'phone' CHECK (call_type IN ('phone', 'video', 'online_meeting')),
  direction TEXT DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  
  -- Contact information
  contact_id UUID REFERENCES company_contacts(id) ON DELETE SET NULL,
  contact_name TEXT,
  contact_phone TEXT,
  contact_organization TEXT,
  
  -- Time and duration
  call_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  scheduled_date TIMESTAMPTZ,
  
  -- Status and outcome
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
  outcome TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Notes and follow-up
  notes TEXT,
  summary TEXT,
  follow_up_actions JSONB DEFAULT '[]'::jsonb,
  follow_up_date TIMESTAMPTZ,
  
  -- Categories and tags
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Recording
  has_recording BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  transcript TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  sender_id uuid not null,
  body text,
  rich jsonb not null default '{}'::jsonb,
  thread_root_id uuid references messages(id) on delete set null,
  reply_to_id uuid references messages(id) on delete set null,
  mentions jsonb not null default '[]'::jsonb,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  tsv tsvector generated always as (to_tsvector('simple', coalesce(body, ''))) stored
);

create table if not exists channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member', -- member|admin|owner
  joined_at timestamptz not null default now(),
  last_read_at timestamptz
);

create table if not exists polls (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references channels(id) on delete cascade,
  question text not null,
  anonymous boolean not null default false,
  allow_multi boolean not null default false,
  closes_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_text text not null,
  option_order int not null default 0
);

create table if not exists poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references polls(id) on delete cascade,
  option_id uuid not null references poll_options(id) on delete cascade,
  user_id uuid not null,
  voted_at timestamptz not null default now(),
  unique (poll_id, option_id, user_id)
);

CREATE TABLE IF NOT EXISTS plaud_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- OAuth Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  
  -- User Info
  plaud_user_id TEXT,
  email TEXT,
  
  -- Sync Settings
  auto_sync BOOLEAN DEFAULT true,
  sync_interval INTEGER DEFAULT 60,
  last_sync_at TIMESTAMPTZ,
  
  -- Data Preferences
  sync_audio BOOLEAN DEFAULT true,
  sync_transcript BOOLEAN DEFAULT true,
  sync_summary BOOLEAN DEFAULT true,
  sync_minutes BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'active',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plaud_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES plaud_connections(id) ON DELETE CASCADE,
  
  -- Recording Info
  plaud_recording_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  recorded_at TIMESTAMPTZ NOT NULL,
  duration INTEGER,
  
  -- Files
  audio_url TEXT,
  audio_format TEXT,
  audio_size INTEGER,
  
  -- Transcript
  transcript TEXT,
  transcript_language TEXT DEFAULT 'fa',
  
  -- Summary & Minutes
  summary TEXT,
  minutes_json JSONB,
  minutes_text TEXT,
  
  -- Metadata
  participants JSONB,
  tags TEXT[],
  category TEXT,
  
  -- Integration
  linked_meeting_id UUID,
  linked_calendar_event_id UUID,
  
  -- Storage
  storage_bucket TEXT,
  storage_path TEXT,
  
  -- Status
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hi_dock_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Device Info
  device_serial TEXT NOT NULL UNIQUE,
  device_name TEXT DEFAULT 'Hi Dock H1',
  device_version TEXT,
  
  -- Connection Settings
  connection_type TEXT DEFAULT 'usb',
  paired BOOLEAN DEFAULT false,
  auto_import BOOLEAN DEFAULT true,
  
  -- Sync Settings
  last_import_at TIMESTAMPTZ,
  import_interval INTEGER DEFAULT 30,
  
  -- Data Preferences
  import_audio BOOLEAN DEFAULT true,
  import_transcript BOOLEAN DEFAULT true,
  import_summary BOOLEAN DEFAULT true,
  auto_process BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'active',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assistant_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NULL REFERENCES ai_chat_sessions(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  domain text NULL,
  target_table text NULL,
  target_id uuid NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'success',
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('owner', 'sub_user', 'admin')),
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  budget NUMERIC DEFAULT 0,
  spent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'IRR',
  target_audience JSONB DEFAULT '{}'::jsonb,
  goals JSONB DEFAULT '[]'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS succession_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  position_title TEXT NOT NULL,
  department TEXT,
  is_critical BOOLEAN DEFAULT false,
  current_holder TEXT,
  required_skills TEXT[],
  responsibilities TEXT,
  succession_urgency TEXT DEFAULT 'normal', -- low, normal, high, critical
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

