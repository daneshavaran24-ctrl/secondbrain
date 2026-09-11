CREATE TABLE IF NOT EXISTS public.assistant_action_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_id uuid NULL REFERENCES public.ai_chat_sessions(id) ON DELETE SET NULL,
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

ALTER TABLE public.assistant_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users view own assistant logs"
  ON public.assistant_action_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users insert own assistant logs"
  ON public.assistant_action_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users delete own assistant logs"
  ON public.assistant_action_logs FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_assistant_logs_user_created
  ON public.assistant_action_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assistant_logs_user_type
  ON public.assistant_action_logs(user_id, action_type);

CREATE INDEX IF NOT EXISTS idx_assistant_logs_user_domain
  ON public.assistant_action_logs(user_id, domain);