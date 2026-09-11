-- Create oura_connections table
CREATE TABLE oura_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- OAuth Tokens
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type TEXT DEFAULT 'Bearer',
  expires_at TIMESTAMPTZ,
  
  -- User Info
  oura_user_id TEXT,
  email TEXT,
  
  -- Sync Settings
  auto_sync BOOLEAN DEFAULT true,
  sync_interval INTEGER DEFAULT 30,
  last_sync_at TIMESTAMPTZ,
  
  -- Data Preferences
  sync_sleep BOOLEAN DEFAULT true,
  sync_activity BOOLEAN DEFAULT true,
  sync_readiness BOOLEAN DEFAULT true,
  sync_heart_rate BOOLEAN DEFAULT true,
  
  -- Status
  status TEXT DEFAULT 'active',
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for oura_connections
ALTER TABLE oura_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Oura connection"
  ON oura_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Oura connection"
  ON oura_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Oura connection"
  ON oura_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Oura connection"
  ON oura_connections FOR DELETE
  USING (auth.uid() = user_id);

-- Create oura_sync_logs table
CREATE TABLE oura_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  connection_id UUID REFERENCES oura_connections(id) ON DELETE CASCADE,
  
  sync_type TEXT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL,
  error_message TEXT,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_oura_sync_logs_user ON oura_sync_logs(user_id);
CREATE INDEX idx_oura_sync_logs_connection ON oura_sync_logs(connection_id);

-- RLS Policies for oura_sync_logs
ALTER TABLE oura_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON oura_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs"
  ON oura_sync_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add columns to health_metrics for external data sources
ALTER TABLE health_metrics 
ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS raw_data JSONB;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_health_metrics_source ON health_metrics(data_source, source_id);