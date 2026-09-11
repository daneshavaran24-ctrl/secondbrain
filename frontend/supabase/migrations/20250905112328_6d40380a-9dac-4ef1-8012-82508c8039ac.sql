-- Legal Cases Table
CREATE TABLE public.legal_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('civil', 'commercial', 'family', 'criminal', 'administrative')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'completed', 'suspended')),
  lawyer TEXT NOT NULL,
  opponent TEXT NOT NULL,
  court TEXT NOT NULL,
  next_hearing DATE,
  description TEXT,
  total_cost BIGINT DEFAULT 0,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legal Meetings Table  
CREATE TABLE public.legal_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  lawyer TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  duration INTEGER DEFAULT 60, -- duration in minutes
  summary TEXT NOT NULL,
  recommendations TEXT[], -- array of recommendations
  cost BIGINT DEFAULT 0,
  next_actions TEXT[], -- array of next actions
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Legal Documents Table
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.legal_cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('contract', 'petition', 'judgment', 'evidence', 'correspondence')),
  file_url TEXT,
  file_size BIGINT,
  mime_type TEXT,
  tags TEXT[],
  is_shared BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for legal_cases
CREATE POLICY "Users can view their own cases" 
ON public.legal_cases FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own cases" 
ON public.legal_cases FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own cases" 
ON public.legal_cases FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own cases" 
ON public.legal_cases FOR DELETE 
USING (user_id = auth.uid());

-- Organization members can see shared cases
CREATE POLICY "Organization members can view shared cases"
ON public.legal_cases FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
);

-- RLS Policies for legal_meetings
CREATE POLICY "Users can view their own meetings" 
ON public.legal_meetings FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own meetings" 
ON public.legal_meetings FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own meetings" 
ON public.legal_meetings FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own meetings" 
ON public.legal_meetings FOR DELETE 
USING (user_id = auth.uid());

-- Organization members can see shared meetings
CREATE POLICY "Organization members can view shared meetings"
ON public.legal_meetings FOR SELECT
USING (
  organization_id IS NOT NULL 
  AND organization_id = get_current_user_organization()
);

-- RLS Policies for legal_documents  
CREATE POLICY "Users can view their own documents" 
ON public.legal_documents FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own documents" 
ON public.legal_documents FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own documents" 
ON public.legal_documents FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own documents" 
ON public.legal_documents FOR DELETE 
USING (user_id = auth.uid());

-- Shared documents policy
CREATE POLICY "Users can view shared documents"
ON public.legal_documents FOR SELECT
USING (is_shared = true AND organization_id = get_current_user_organization());

-- Add updated_at triggers
CREATE TRIGGER update_legal_cases_updated_at
  BEFORE UPDATE ON public.legal_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_meetings_updated_at
  BEFORE UPDATE ON public.legal_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_legal_cases_user_id ON public.legal_cases(user_id);
CREATE INDEX idx_legal_cases_organization_id ON public.legal_cases(organization_id);
CREATE INDEX idx_legal_cases_status ON public.legal_cases(status);
CREATE INDEX idx_legal_meetings_user_id ON public.legal_meetings(user_id);
CREATE INDEX idx_legal_meetings_case_id ON public.legal_meetings(case_id);
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_documents_case_id ON public.legal_documents(case_id);