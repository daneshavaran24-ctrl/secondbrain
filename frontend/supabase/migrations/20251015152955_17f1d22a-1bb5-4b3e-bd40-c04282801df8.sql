-- فاز 3: جدول مستندات پروژه‌های CSR
CREATE TABLE IF NOT EXISTS public.csr_project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.csr_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  category TEXT CHECK (category IN ('photo', 'video', 'document', 'report')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS برای csr_project_documents
ALTER TABLE public.csr_project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project documents"
ON public.csr_project_documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_documents.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create documents for their projects"
ON public.csr_project_documents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_documents.project_id
    AND csr_projects.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

CREATE POLICY "Users can delete their project documents"
ON public.csr_project_documents FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_documents.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

-- فاز 4: جدول تیم پروژه‌های CSR
CREATE TABLE IF NOT EXISTS public.csr_project_team (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.csr_projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  member_email TEXT,
  role TEXT CHECK (role IN ('manager', 'coordinator', 'volunteer', 'consultant')),
  responsibilities TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS برای csr_project_team
ALTER TABLE public.csr_project_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project team"
ON public.csr_project_team FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_team.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their project team"
ON public.csr_project_team FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_team.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

-- فاز 5: جدول Milestones پروژه‌های CSR
CREATE TABLE IF NOT EXISTS public.csr_project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.csr_projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS برای csr_project_milestones
ALTER TABLE public.csr_project_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project milestones"
ON public.csr_project_milestones FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_milestones.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their project milestones"
ON public.csr_project_milestones FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_project_milestones.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

-- Trigger برای به‌روزرسانی updated_at
CREATE OR REPLACE FUNCTION public.update_csr_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_csr_milestones_updated_at
BEFORE UPDATE ON public.csr_project_milestones
FOR EACH ROW
EXECUTE FUNCTION public.update_csr_milestones_updated_at();

-- فاز 6: جدول ارزیابی اثرگذاری
CREATE TABLE IF NOT EXISTS public.csr_impact_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.csr_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL,
  beneficiaries_count INTEGER DEFAULT 0,
  satisfaction_score NUMERIC(3,2) CHECK (satisfaction_score >= 0 AND satisfaction_score <= 5),
  impact_metrics JSONB,
  feedback TEXT,
  sdg_goals TEXT[],
  assessor_name TEXT,
  assessment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS برای csr_impact_assessments
ALTER TABLE public.csr_impact_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their project assessments"
ON public.csr_impact_assessments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_impact_assessments.project_id
    AND csr_projects.user_id = auth.uid()
  )
);

CREATE POLICY "Users can manage their project assessments"
ON public.csr_impact_assessments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.csr_projects
    WHERE csr_projects.id = csr_impact_assessments.project_id
    AND csr_projects.user_id = auth.uid()
  )
  AND auth.uid() = user_id
);

-- Trigger برای به‌روزرسانی updated_at
CREATE TRIGGER update_csr_assessments_updated_at
BEFORE UPDATE ON public.csr_impact_assessments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ایجاد storage bucket برای مستندات CSR
INSERT INTO storage.buckets (id, name, public)
VALUES ('csr-documents', 'csr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS برای storage bucket
CREATE POLICY "Users can view their CSR documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'csr-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload their CSR documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'csr-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their CSR documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'csr-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their CSR documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'csr-documents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);