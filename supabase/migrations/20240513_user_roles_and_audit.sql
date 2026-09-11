-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

-- Create RLS policies for user_roles table
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY read_own_role ON user_roles 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy: Admins can read all roles
CREATE POLICY admin_read_all_roles ON user_roles 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert roles
CREATE POLICY admin_insert_roles ON user_roles 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can update roles
CREATE POLICY admin_update_roles ON user_roles 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on audit_logs timestamp for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Create RLS policies for audit_logs table
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read all audit logs
CREATE POLICY admin_read_audit_logs ON audit_logs 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Admins can insert audit logs
CREATE POLICY admin_insert_audit_logs ON audit_logs 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Insert initial admin user if not exists
-- Replace 'YOUR_ADMIN_USER_ID' with the actual UUID of your admin user
DO $$
DECLARE
  admin_id UUID := 'YOUR_ADMIN_USER_ID';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = admin_id) THEN
    INSERT INTO user_roles (user_id, role) VALUES (admin_id, 'admin');
  END IF;
END
$$;
