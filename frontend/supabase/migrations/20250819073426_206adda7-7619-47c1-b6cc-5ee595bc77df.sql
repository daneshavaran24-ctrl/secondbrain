-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create organization_type enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.organization_type AS ENUM ('health', 'consulting', 'manufacturing', 'commerce', 'ngo', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type organization_type NOT NULL,
    description text,
    settings jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create updated_at trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON public.organizations;
DROP POLICY IF EXISTS "Organizations can be managed by authenticated users" ON public.organizations;

CREATE POLICY "Organizations are viewable by everyone"
    ON public.organizations FOR SELECT
    USING (true);

CREATE POLICY "Organizations can be managed by authenticated users"
    ON public.organizations FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert initial data if table is empty
INSERT INTO public.organizations (name, type, description)
SELECT * FROM (VALUES
    ('ورید هلث', 'health', 'سازمان بهداشتی ورید'),
    ('فرانگران نوین', 'consulting', 'شرکت مشاوره فرانگران'),
    ('انجمن تولیدکنندگان', 'manufacturing', 'انجمن تولیدکنندگان صنعتی'),
    ('اتاق بازرگانی', 'commerce', 'اتاق بازرگانی و صنایع')
) AS v(name, type, description)
WHERE NOT EXISTS (SELECT 1 FROM public.organizations);