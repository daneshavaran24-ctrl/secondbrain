-- ===========================
-- جداول اتصال ربات تلگرام Mora
-- ===========================

-- 1. جدول کاربران تلگرام (لینک به auth.users)
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. جدول پیام‌های خام تلگرام
CREATE TABLE IF NOT EXISTS public.telegram_raw_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('text', 'voice', 'photo', 'document')),
  raw_content TEXT,
  media_url TEXT,
  telegram_message_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. جدول گفت‌وگوهای چندمرحله‌ای
CREATE TABLE IF NOT EXISTS public.telegram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_user_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_module TEXT NOT NULL CHECK (target_module IN ('meetings', 'knowledge', 'tasks')),
  conversation_state JSONB DEFAULT '{}'::jsonb,
  current_step TEXT,
  step_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. جدول نتایج پردازش‌شده
CREATE TABLE IF NOT EXISTS public.telegram_processed_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_message_id UUID REFERENCES public.telegram_raw_messages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_module TEXT NOT NULL,
  target_record_id UUID,
  processing_result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================
-- ایندکس‌ها برای بهبود عملکرد
-- ===========================
CREATE INDEX IF NOT EXISTS idx_telegram_users_telegram_id ON public.telegram_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON public.telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_raw_messages_user_id ON public.telegram_raw_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_raw_messages_status ON public.telegram_raw_messages(processing_status);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_user_id ON public.telegram_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_conversations_active ON public.telegram_conversations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_telegram_processed_user_id ON public.telegram_processed_entries(user_id);

-- ===========================
-- فعال‌سازی Row Level Security
-- ===========================
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_raw_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_processed_entries ENABLE ROW LEVEL SECURITY;

-- ===========================
-- RLS Policies - telegram_users
-- ===========================
CREATE POLICY "Users can view their own telegram profile"
  ON public.telegram_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own telegram profile"
  ON public.telegram_users FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can insert (برای edge function)
CREATE POLICY "Service can insert telegram users"
  ON public.telegram_users FOR INSERT
  WITH CHECK (true);

-- ===========================
-- RLS Policies - telegram_raw_messages
-- ===========================
CREATE POLICY "Users can view their own messages"
  ON public.telegram_raw_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all messages"
  ON public.telegram_raw_messages FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================
-- RLS Policies - telegram_conversations
-- ===========================
CREATE POLICY "Users can view their own conversations"
  ON public.telegram_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all conversations"
  ON public.telegram_conversations FOR ALL
  USING (true)
  WITH CHECK (true);

-- ===========================
-- RLS Policies - telegram_processed_entries
-- ===========================
CREATE POLICY "Users can view their own processed entries"
  ON public.telegram_processed_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert processed entries"
  ON public.telegram_processed_entries FOR INSERT
  WITH CHECK (true);

-- ===========================
-- Trigger برای updated_at
-- ===========================
CREATE OR REPLACE FUNCTION public.update_telegram_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER telegram_users_updated_at
  BEFORE UPDATE ON public.telegram_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_telegram_updated_at();

CREATE TRIGGER telegram_conversations_updated_at
  BEFORE UPDATE ON public.telegram_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_telegram_updated_at();

-- ===========================
-- تابع کمکی: پیدا کردن یا ساخت کاربر تلگرام
-- ===========================
CREATE OR REPLACE FUNCTION public.get_or_create_telegram_user(
  p_telegram_id BIGINT,
  p_user_id UUID,
  p_username TEXT DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_telegram_user_id UUID;
BEGIN
  -- جستجوی کاربر موجود
  SELECT id INTO v_telegram_user_id
  FROM public.telegram_users
  WHERE telegram_id = p_telegram_id;
  
  -- اگر وجود نداشت، ایجاد کن
  IF v_telegram_user_id IS NULL THEN
    INSERT INTO public.telegram_users (
      telegram_id, user_id, username, first_name, last_name
    ) VALUES (
      p_telegram_id, p_user_id, p_username, p_first_name, p_last_name
    )
    RETURNING id INTO v_telegram_user_id;
  ELSE
    -- آپدیت اطلاعات
    UPDATE public.telegram_users
    SET 
      username = COALESCE(p_username, username),
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      updated_at = now()
    WHERE id = v_telegram_user_id;
  END IF;
  
  RETURN v_telegram_user_id;
END;
$$;

-- ===========================
-- تابع کمکی: بستن گفت‌وگوهای منقضی‌شده
-- ===========================
CREATE OR REPLACE FUNCTION public.close_expired_telegram_conversations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.telegram_conversations
  SET is_active = false
  WHERE is_active = true
    AND expires_at < now();
END;
$$;