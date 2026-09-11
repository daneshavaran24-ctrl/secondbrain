-- Create resume templates table
CREATE TABLE IF NOT EXISTS resume_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
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

-- Create template customizations table
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

-- Create resume exports table
CREATE TABLE IF NOT EXISTS resume_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_resume_templates_user ON resume_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_templates_default ON resume_templates(user_id, is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_customizations_template ON resume_template_customizations(template_id);
CREATE INDEX IF NOT EXISTS idx_exports_user ON resume_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_exports_template ON resume_exports(template_id);

-- Enable RLS
ALTER TABLE resume_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_template_customizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_templates
CREATE POLICY "Users can view their own templates"
  ON resume_templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create templates"
  ON resume_templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON resume_templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON resume_templates FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for resume_template_customizations
CREATE POLICY "Users can view customizations for their templates"
  ON resume_template_customizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM resume_templates
      WHERE resume_templates.id = resume_template_customizations.template_id
      AND resume_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create customizations for their templates"
  ON resume_template_customizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM resume_templates
      WHERE resume_templates.id = resume_template_customizations.template_id
      AND resume_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update customizations for their templates"
  ON resume_template_customizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM resume_templates
      WHERE resume_templates.id = resume_template_customizations.template_id
      AND resume_templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete customizations for their templates"
  ON resume_template_customizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM resume_templates
      WHERE resume_templates.id = resume_template_customizations.template_id
      AND resume_templates.user_id = auth.uid()
    )
  );

-- RLS Policies for resume_exports
CREATE POLICY "Users can view their own exports"
  ON resume_exports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports"
  ON resume_exports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exports"
  ON resume_exports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exports"
  ON resume_exports FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_resume_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_resume_templates_updated_at
  BEFORE UPDATE ON resume_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_resume_templates_updated_at();

CREATE TRIGGER update_resume_customizations_updated_at
  BEFORE UPDATE ON resume_template_customizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();