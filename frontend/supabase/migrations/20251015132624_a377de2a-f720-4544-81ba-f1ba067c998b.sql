-- Create plaud_connections table for OAuth tokens and settings
CREATE TABLE plaud_connections (
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

ALTER TABLE plaud_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Plaud connection"
  ON plaud_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Plaud connection"
  ON plaud_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Plaud connection"
  ON plaud_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Plaud connection"
  ON plaud_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_plaud_connections_user ON plaud_connections(user_id);
CREATE INDEX idx_plaud_connections_status ON plaud_connections(status);

-- Create plaud_recordings table
CREATE TABLE plaud_recordings (
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

ALTER TABLE plaud_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recordings"
  ON plaud_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON plaud_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON plaud_recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON plaud_recordings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_plaud_recordings_user ON plaud_recordings(user_id);
CREATE INDEX idx_plaud_recordings_connection ON plaud_recordings(connection_id);
CREATE INDEX idx_plaud_recordings_status ON plaud_recordings(processing_status);
CREATE INDEX idx_plaud_recordings_recorded_at ON plaud_recordings(recorded_at DESC);

-- Create plaud_sync_logs table
CREATE TABLE plaud_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES plaud_connections(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL,
  recordings_synced INTEGER DEFAULT 0,
  recordings_failed INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plaud_sync_logs_user ON plaud_sync_logs(user_id);
CREATE INDEX idx_plaud_sync_logs_connection ON plaud_sync_logs(connection_id);