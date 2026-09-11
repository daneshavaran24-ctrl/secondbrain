-- Create Hi Dock H1 Tables

-- Table 1: hi_dock_connections
CREATE TABLE hi_dock_connections (
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

ALTER TABLE hi_dock_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Hi Dock connection"
  ON hi_dock_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Hi Dock connection"
  ON hi_dock_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Hi Dock connection"
  ON hi_dock_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Hi Dock connection"
  ON hi_dock_connections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_hi_dock_connections_user ON hi_dock_connections(user_id);
CREATE INDEX idx_hi_dock_connections_serial ON hi_dock_connections(device_serial);

-- Table 2: hi_dock_recordings
CREATE TABLE hi_dock_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES hi_dock_connections(id) ON DELETE CASCADE,
  
  -- Recording Info
  dock_recording_id TEXT NOT NULL,
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
  
  -- Summary & Notes
  summary TEXT,
  notes_text TEXT,
  extracted_keywords JSONB,
  
  -- Metadata
  participants JSONB,
  tags TEXT[],
  category TEXT,
  
  -- Integration
  linked_meeting_id UUID,
  linked_calendar_event_id UUID,
  linked_task_id UUID,
  
  -- Storage
  storage_bucket TEXT DEFAULT 'recordings',
  storage_path TEXT,
  
  -- Status
  processing_status TEXT DEFAULT 'pending',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hi_dock_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recordings"
  ON hi_dock_recordings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recordings"
  ON hi_dock_recordings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recordings"
  ON hi_dock_recordings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recordings"
  ON hi_dock_recordings FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_hi_dock_recordings_user ON hi_dock_recordings(user_id);
CREATE INDEX idx_hi_dock_recordings_connection ON hi_dock_recordings(connection_id);
CREATE INDEX idx_hi_dock_recordings_recorded_at ON hi_dock_recordings(recorded_at DESC);

-- Table 3: hi_dock_import_logs
CREATE TABLE hi_dock_import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES hi_dock_connections(id) ON DELETE CASCADE,
  
  import_type TEXT NOT NULL,
  files_imported INTEGER DEFAULT 0,
  files_failed INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE hi_dock_import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own import logs"
  ON hi_dock_import_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import logs"
  ON hi_dock_import_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_hi_dock_import_logs_user ON hi_dock_import_logs(user_id);