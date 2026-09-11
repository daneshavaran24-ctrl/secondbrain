-- Create enum for collaboration types
CREATE TYPE collaboration_type AS ENUM (
  'client',
  'supplier',
  'partner',
  'competitor',
  'consultant',
  'investor',
  'other'
);

-- Create enum for collaboration status
CREATE TYPE collaboration_status AS ENUM (
  'active',
  'inactive',
  'negotiating',
  'on_hold',
  'terminated'
);

-- Create business_companies table
CREATE TABLE public.business_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  collaboration_type collaboration_type NOT NULL DEFAULT 'client',
  status collaboration_status NOT NULL DEFAULT 'active',
  industry TEXT,
  contact_person TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  website TEXT,
  address TEXT,
  description TEXT,
  notes TEXT,
  start_date DATE,
  end_date DATE,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_companies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own business companies"
  ON public.business_companies
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business companies"
  ON public.business_companies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND (
    SELECT COUNT(*) FROM public.business_companies WHERE user_id = auth.uid()
  ) < 50);

CREATE POLICY "Users can update their own business companies"
  ON public.business_companies
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business companies"
  ON public.business_companies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_business_companies_user_id ON public.business_companies(user_id);
CREATE INDEX idx_business_companies_status ON public.business_companies(status);
CREATE INDEX idx_business_companies_type ON public.business_companies(collaboration_type);

-- Create trigger for updated_at
CREATE TRIGGER update_business_companies_updated_at
  BEFORE UPDATE ON public.business_companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.business_companies IS 'Stores business relationships and companies that users professionally work with';