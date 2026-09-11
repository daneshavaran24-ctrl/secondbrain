-- Create enum for proficiency levels
CREATE TYPE proficiency_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');

-- Create enum for content types
CREATE TYPE media_content_type AS ENUM ('text', 'video', 'podcast');

-- ============================================
-- 1. Personal Info Table
-- ============================================
CREATE TABLE public.resume_personal_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE,
  bio TEXT,
  avatar_url TEXT,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.resume_personal_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own personal info"
  ON public.resume_personal_info FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own personal info"
  ON public.resume_personal_info FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own personal info"
  ON public.resume_personal_info FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own personal info"
  ON public.resume_personal_info FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 2. Education Table
-- ============================================
CREATE TABLE public.resume_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  university TEXT NOT NULL,
  field_of_study TEXT,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_education ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own education"
  ON public.resume_education FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 3. Certificates Table
-- ============================================
CREATE TABLE public.resume_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  certificate_url TEXT,
  description TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own certificates"
  ON public.resume_certificates FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 4. Work Experience Table
-- ============================================
CREATE TABLE public.resume_work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  company_website TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  achievements TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_work_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own work experience"
  ON public.resume_work_experience FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Awards Table
-- ============================================
CREATE TABLE public.resume_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  issuing_organization TEXT NOT NULL,
  award_date DATE NOT NULL,
  description TEXT,
  certificate_image_url TEXT,
  video_url TEXT,
  media_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own awards"
  ON public.resume_awards FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 6. Skills Table
-- ============================================
CREATE TABLE public.resume_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  proficiency_level proficiency_level DEFAULT 'intermediate',
  category TEXT,
  years_of_experience INTEGER,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own skills"
  ON public.resume_skills FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 7. Affiliations Table
-- ============================================
CREATE TABLE public.resume_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  position TEXT NOT NULL,
  category TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  description TEXT,
  responsibilities TEXT[] DEFAULT '{}',
  media_urls JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_affiliations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own affiliations"
  ON public.resume_affiliations FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 8. Publications Table
-- ============================================
CREATE TABLE public.resume_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  publication_type TEXT,
  publisher TEXT,
  publication_date DATE NOT NULL,
  isbn TEXT,
  description TEXT,
  cover_image_url TEXT,
  pdf_url TEXT,
  external_link TEXT,
  co_authors TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own publications"
  ON public.resume_publications FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 9. Media Interviews Table
-- ============================================
CREATE TABLE public.resume_media_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  media_source TEXT NOT NULL,
  interview_date DATE NOT NULL,
  content_type media_content_type DEFAULT 'text',
  content_url TEXT,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_media_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own media interviews"
  ON public.resume_media_interviews FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 10. Interests Table
-- ============================================
CREATE TABLE public.resume_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.resume_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own interests"
  ON public.resume_interests FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- Create Storage Bucket for Resume Files
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resume-files', 'resume-files', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Storage Policies
-- ============================================
CREATE POLICY "Users can upload their own resume files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'resume-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own resume files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'resume-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own resume files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'resume-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own resume files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'resume-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_resume_personal_info_updated_at
  BEFORE UPDATE ON public.resume_personal_info
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_education_updated_at
  BEFORE UPDATE ON public.resume_education
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_certificates_updated_at
  BEFORE UPDATE ON public.resume_certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_work_experience_updated_at
  BEFORE UPDATE ON public.resume_work_experience
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_awards_updated_at
  BEFORE UPDATE ON public.resume_awards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_skills_updated_at
  BEFORE UPDATE ON public.resume_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_affiliations_updated_at
  BEFORE UPDATE ON public.resume_affiliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_publications_updated_at
  BEFORE UPDATE ON public.resume_publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resume_media_interviews_updated_at
  BEFORE UPDATE ON public.resume_media_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();