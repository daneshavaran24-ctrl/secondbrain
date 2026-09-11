-- Add metadata fields to ai_chat_messages
ALTER TABLE ai_chat_messages
ADD COLUMN IF NOT EXISTS sentiment TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add session_id to ai_chat_messages if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ai_chat_messages' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE ai_chat_messages ADD COLUMN session_id UUID;
  END IF;
END $$;

-- Create ai_chat_sessions table if not exists
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS on ai_chat_sessions
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for ai_chat_sessions
DROP POLICY IF EXISTS "Users can view their own sessions" ON ai_chat_sessions;
CREATE POLICY "Users can view their own sessions" 
ON ai_chat_sessions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create sessions" ON ai_chat_sessions;
CREATE POLICY "Users can create sessions" 
ON ai_chat_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their sessions" ON ai_chat_sessions;
CREATE POLICY "Users can update their sessions" 
ON ai_chat_sessions FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their sessions" ON ai_chat_sessions;
CREATE POLICY "Users can delete their sessions" 
ON ai_chat_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- Add foreign key constraint for session_id in ai_chat_messages
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'ai_chat_messages_session_id_fkey'
  ) THEN
    ALTER TABLE ai_chat_messages 
    ADD CONSTRAINT ai_chat_messages_session_id_fkey 
    FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_created_at ON ai_chat_sessions(created_at DESC);

-- Add trigger for updating updated_at on ai_chat_sessions
CREATE OR REPLACE FUNCTION update_ai_chat_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_chat_sessions_updated_at_trigger ON ai_chat_sessions;
CREATE TRIGGER update_ai_chat_sessions_updated_at_trigger
BEFORE UPDATE ON ai_chat_sessions
FOR EACH ROW
EXECUTE FUNCTION update_ai_chat_sessions_updated_at();