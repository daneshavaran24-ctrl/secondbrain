-- Create knowledge_base table first
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(content, '')), 'B')
  ) STORED
);

-- Create index on search_vector
CREATE INDEX IF NOT EXISTS idx_knowledge_base_search_vector ON knowledge_base USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_author_id ON knowledge_base(author_id);

-- RLS Policies
ALTER TABLE knowledge_base ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own knowledge"
ON knowledge_base
FOR ALL
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Now create knowledge_folders table
CREATE TABLE IF NOT EXISTS knowledge_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES knowledge_folders(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  items_count INTEGER DEFAULT 0,
  sub_folders_count INTEGER DEFAULT 0
);

-- Add folder_id to knowledge_base
ALTER TABLE knowledge_base
ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES knowledge_folders(id) ON DELETE SET NULL;

-- Indexes for folders
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_user_id ON knowledge_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_folders_parent_id ON knowledge_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_folder_id ON knowledge_base(folder_id);

-- RLS Policies for folders
ALTER TABLE knowledge_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folders"
ON knowledge_folders
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at for folders
CREATE OR REPLACE FUNCTION update_knowledge_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_folders_updated_at
BEFORE UPDATE ON knowledge_folders
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_folders_updated_at();

-- Trigger to update updated_at for knowledge_base
CREATE OR REPLACE FUNCTION update_knowledge_base_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_knowledge_base_updated_at
BEFORE UPDATE ON knowledge_base
FOR EACH ROW
EXECUTE FUNCTION update_knowledge_base_updated_at();