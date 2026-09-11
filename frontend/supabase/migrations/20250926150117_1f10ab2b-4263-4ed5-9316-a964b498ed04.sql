-- Create organizational KPIs table (if not exists)
CREATE TABLE IF NOT EXISTS public.organizational_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    target DECIMAL NOT NULL DEFAULT 0,
    current_value DECIMAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'عدد',
    period TEXT NOT NULL DEFAULT 'سالیانه',
    status TEXT NOT NULL DEFAULT 'درحال پیگیری',
    responsible TEXT,
    organization_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create approval workflows table (if not exists)
CREATE TABLE IF NOT EXISTS public.organizational_approval_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_title TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    current_step TEXT NOT NULL DEFAULT 'بررسی اولیه',
    status TEXT NOT NULL DEFAULT 'درانتظار',
    submission_date DATE NOT NULL,
    deadline DATE,
    policy_id UUID,
    organization_id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create policy attachments table (if not exists)
CREATE TABLE IF NOT EXISTS public.organizational_policy_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL, -- 'mission', 'policy', 'kpi', 'approval'
    item_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by UUID,
    organization_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on new tables only
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizational_kpis') THEN
        ALTER TABLE public.organizational_kpis ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizational_approval_workflows') THEN
        ALTER TABLE public.organizational_approval_workflows ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organizational_policy_attachments') THEN
        ALTER TABLE public.organizational_policy_attachments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;