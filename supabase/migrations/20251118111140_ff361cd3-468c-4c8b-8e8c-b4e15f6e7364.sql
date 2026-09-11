-- Phase 1: Enhance business_companies table
ALTER TABLE business_companies
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_companies_user_id ON business_companies(user_id);
CREATE INDEX IF NOT EXISTS idx_business_companies_active ON business_companies(is_active);

-- Phase 2.1: Create company_profiles table
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

-- RLS for company_profiles
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company profiles"
  ON company_profiles FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

CREATE POLICY "Users can manage their own company profiles"
  ON company_profiles FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

-- Phase 2.2: Create company_tasks table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_tasks_company_id ON company_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_company_tasks_status ON company_tasks(status);
CREATE INDEX IF NOT EXISTS idx_company_tasks_due_date ON company_tasks(due_date);

-- RLS for company_tasks
ALTER TABLE company_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company tasks"
  ON company_tasks FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

CREATE POLICY "Users can manage their own company tasks"
  ON company_tasks FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

-- Phase 2.3: Create company_notes table
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

-- Index
CREATE INDEX IF NOT EXISTS idx_company_notes_company_id ON company_notes(company_id);

-- RLS for company_notes
ALTER TABLE company_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company notes"
  ON company_notes FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

-- Phase 2.4: Create company_contacts table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_company_contacts_company_id ON company_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_company_contacts_type ON company_contacts(type);

-- RLS for company_contacts
ALTER TABLE company_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own company contacts"
  ON company_contacts FOR ALL
  USING (auth.uid() IN (SELECT user_id FROM business_companies WHERE id = company_id));

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_company_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();

CREATE TRIGGER update_company_tasks_updated_at
  BEFORE UPDATE ON company_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();

CREATE TRIGGER update_company_notes_updated_at
  BEFORE UPDATE ON company_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();

CREATE TRIGGER update_company_contacts_updated_at
  BEFORE UPDATE ON company_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_company_updated_at();