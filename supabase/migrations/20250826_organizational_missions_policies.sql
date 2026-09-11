-- Create organizational missions table
CREATE TABLE IF NOT EXISTS public.organizational_missions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'فعال' CHECK (status IN ('فعال', 'درحال اجرا', 'تکمیل شده', 'متوقف شده')),
    priority TEXT NOT NULL DEFAULT 'متوسط' CHECK (priority IN ('بالا', 'متوسط', 'پایین')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    deadline DATE,
    owner TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizational policies table
CREATE TABLE IF NOT EXISTS public.organizational_policies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL DEFAULT 'اجرایی' CHECK (type IN ('استراتژیک', 'اجرایی', 'تاکتیکی')),
    status TEXT NOT NULL DEFAULT 'درانتظار تصویب' CHECK (status IN ('تصویب‌شده', 'درانتظار تصویب', 'در دست بررسی', 'رد شده')),
    period TEXT NOT NULL DEFAULT 'سالیانه' CHECK (period IN ('سالیانه', 'فصلی', 'ماهیانه')),
    approval_date DATE,
    next_review DATE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organizational KPIs table
CREATE TABLE IF NOT EXISTS public.organizational_kpis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    target DECIMAL NOT NULL,
    current DECIMAL NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    period TEXT NOT NULL DEFAULT 'سالیانه' CHECK (period IN ('سالیانه', 'فصلی', 'ماهیانه', 'هفتگی')),
    status TEXT NOT NULL DEFAULT 'درحال پیگیری' CHECK (status IN ('درحال پیگیری', 'نیاز به بهبود', 'در مسیر هدف', 'هدف محقق شده')),
    responsible TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create approval workflow table
CREATE TABLE IF NOT EXISTS public.approval_workflows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    policy_title TEXT NOT NULL,
    submitted_by TEXT NOT NULL,
    current_step TEXT NOT NULL DEFAULT 'بررسی اولیه',
    status TEXT NOT NULL DEFAULT 'درانتظار' CHECK (status IN ('درانتظار', 'در دست بررسی', 'تأیید شده', 'رد شده')),
    submission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    policy_id UUID REFERENCES public.organizational_policies(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_organizational_missions_org_id ON public.organizational_missions(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizational_missions_user_id ON public.organizational_missions(user_id);
CREATE INDEX IF NOT EXISTS idx_organizational_missions_status ON public.organizational_missions(status);

CREATE INDEX IF NOT EXISTS idx_organizational_policies_org_id ON public.organizational_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizational_policies_user_id ON public.organizational_policies(user_id);
CREATE INDEX IF NOT EXISTS idx_organizational_policies_status ON public.organizational_policies(status);

CREATE INDEX IF NOT EXISTS idx_organizational_kpis_org_id ON public.organizational_kpis(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizational_kpis_user_id ON public.organizational_kpis(user_id);

CREATE INDEX IF NOT EXISTS idx_approval_workflows_org_id ON public.approval_workflows(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_user_id ON public.approval_workflows(user_id);
CREATE INDEX IF NOT EXISTS idx_approval_workflows_policy_id ON public.approval_workflows(policy_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.organizational_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizational_kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizational_missions
CREATE POLICY "Users can view all missions" ON public.organizational_missions
    FOR SELECT USING (true);

CREATE POLICY "Users can create missions" ON public.organizational_missions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own missions" ON public.organizational_missions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own missions" ON public.organizational_missions
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for organizational_policies
CREATE POLICY "Users can view all policies" ON public.organizational_policies
    FOR SELECT USING (true);

CREATE POLICY "Users can create policies" ON public.organizational_policies
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own policies" ON public.organizational_policies
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own policies" ON public.organizational_policies
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for organizational_kpis
CREATE POLICY "Users can view all KPIs" ON public.organizational_kpis
    FOR SELECT USING (true);

CREATE POLICY "Users can create KPIs" ON public.organizational_kpis
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own KPIs" ON public.organizational_kpis
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own KPIs" ON public.organizational_kpis
    FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for approval_workflows
CREATE POLICY "Users can view all workflows" ON public.approval_workflows
    FOR SELECT USING (true);

CREATE POLICY "Users can create workflows" ON public.approval_workflows
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workflows" ON public.approval_workflows
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workflows" ON public.approval_workflows
    FOR DELETE USING (user_id = auth.uid());

-- Create triggers for automatic updated_at timestamp updates
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_organizational_missions
    BEFORE UPDATE ON public.organizational_missions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_organizational_policies
    BEFORE UPDATE ON public.organizational_policies
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_organizational_kpis
    BEFORE UPDATE ON public.organizational_kpis
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_approval_workflows
    BEFORE UPDATE ON public.approval_workflows
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp();

-- Insert some sample data for testing
INSERT INTO public.organizational_missions (title, description, status, priority, progress, deadline, owner) 
VALUES 
    ('توسعه اقتصاد دیجیتال', 'ایجاد زیرساخت‌های لازم برای توسعه کسب‌وکارهای دیجیتال', 'فعال', 'بالا', 75, '2025-03-20', 'مدیر عامل'),
    ('بهبود خدمات مشتریان', 'افزایش کیفیت و سرعت ارائه خدمات به بخش خصوصی', 'درحال اجرا', 'متوسط', 45, '2025-06-15', 'مدیر خدمات');

INSERT INTO public.organizational_policies (title, description, type, status, period, approval_date, next_review)
VALUES 
    ('سیاست حمایت از استارتاپ‌ها', 'تعریف چارچوب حمایت مالی و فنی از کسب‌وکارهای نوپا', 'استراتژیک', 'تصویب‌شده', 'سالیانه', '2024-11-15', '2025-11-15'),
    ('سیاست تسهیلات صادراتی', 'ارائه تسهیلات ویژه به صادرکنندگان فعال', 'اجرایی', 'درانتظار تصویب', 'فصلی', NULL, '2025-03-01');

INSERT INTO public.organizational_kpis (name, target, current, unit, period, status, responsible)
VALUES 
    ('تعداد عضو جدید', 500, 342, 'نفر', 'سالیانه', 'درحال پیگیری', 'واحد عضویت'),
    ('میزان رضایت اعضا', 85, 78, 'درصد', 'فصلی', 'نیاز به بهبود', 'واحد کیفیت');

INSERT INTO public.approval_workflows (policy_title, submitted_by, current_step, status, submission_date, deadline)
VALUES 
    ('سیاست جدید همکاری با دانشگاه‌ها', 'احمد محمدی', 'بررسی کارشناسی', 'درانتظار', '2024-12-10', '2025-01-10');
