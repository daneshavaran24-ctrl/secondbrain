-- Create enum for correspondence types
CREATE TYPE correspondence_type AS ENUM (
  'incoming',
  'outgoing',
  'internal'
);

-- Create enum for related entity types
CREATE TYPE related_entity_type AS ENUM (
  'company',
  'organization',
  'csr_project',
  'general'
);

-- Create enum for correspondence status
CREATE TYPE correspondence_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'received',
  'archived'
);

-- Create enum for correspondence priority
CREATE TYPE correspondence_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- Create administrative_correspondence table
CREATE TABLE IF NOT EXISTS public.administrative_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_number TEXT,
  correspondence_type correspondence_type NOT NULL DEFAULT 'outgoing',
  related_entity_type related_entity_type NOT NULL DEFAULT 'general',
  related_entity_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  sender_phone TEXT,
  sender_address TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  status correspondence_status NOT NULL DEFAULT 'draft',
  priority correspondence_priority NOT NULL DEFAULT 'medium',
  correspondence_date DATE,
  response_deadline DATE,
  response_received_date DATE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  attachments JSONB DEFAULT '[]'::JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create correspondence_templates table
CREATE TABLE IF NOT EXISTS public.correspondence_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.administrative_correspondence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.correspondence_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for administrative_correspondence
CREATE POLICY "Users can create their own correspondence"
  ON public.administrative_correspondence
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own correspondence"
  ON public.administrative_correspondence
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND organization_id = get_current_user_organization())
  );

CREATE POLICY "Users can update their own correspondence"
  ON public.administrative_correspondence
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own correspondence"
  ON public.administrative_correspondence
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for correspondence_templates
CREATE POLICY "Users can create their own templates"
  ON public.correspondence_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view public templates or their own"
  ON public.correspondence_templates
  FOR SELECT
  TO authenticated
  USING (
    is_public = true OR
    auth.uid() = user_id OR
    (organization_id IS NOT NULL AND organization_id = get_current_user_organization())
  );

CREATE POLICY "Users can update their own templates"
  ON public.correspondence_templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.correspondence_templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_correspondence_user_id ON public.administrative_correspondence(user_id);
CREATE INDEX idx_correspondence_organization_id ON public.administrative_correspondence(organization_id);
CREATE INDEX idx_correspondence_status ON public.administrative_correspondence(status);
CREATE INDEX idx_correspondence_type ON public.administrative_correspondence(correspondence_type);
CREATE INDEX idx_correspondence_related_entity ON public.administrative_correspondence(related_entity_type, related_entity_id);
CREATE INDEX idx_correspondence_date ON public.administrative_correspondence(correspondence_date);
CREATE INDEX idx_correspondence_reference ON public.administrative_correspondence(reference_number);

CREATE INDEX idx_templates_user_id ON public.correspondence_templates(user_id);
CREATE INDEX idx_templates_organization_id ON public.correspondence_templates(organization_id);
CREATE INDEX idx_templates_public ON public.correspondence_templates(is_public);

-- Add trigger for updated_at
CREATE TRIGGER update_correspondence_updated_at
  BEFORE UPDATE ON public.administrative_correspondence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.correspondence_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();