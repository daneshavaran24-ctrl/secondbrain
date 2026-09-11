import { supabase } from '@/integrations/supabase/client';

export interface PersonalInfo {
  id?: string;
  user_id?: string;
  full_name: string;
  birth_date?: string;
  bio?: string;
  avatar_url?: string;
  social_links?: {
    instagram?: string;
    telegram?: string;
    x?: string;
    linkedin?: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id?: string;
  user_id?: string;
  degree: string;
  university: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
  description?: string;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Certificate {
  id?: string;
  user_id?: string;
  title: string;
  issuing_organization: string;
  issue_date: string;
  expiry_date?: string;
  certificate_url?: string;
  description?: string;
  skills?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface WorkExperience {
  id?: string;
  user_id?: string;
  job_title: string;
  company_name: string;
  company_website?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  responsibilities?: string[];
  achievements?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Award {
  id?: string;
  user_id?: string;
  title: string;
  category?: string;
  issuing_organization: string;
  award_date: string;
  description?: string;
  certificate_image_url?: string;
  video_url?: string;
  media_links?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Skill {
  id?: string;
  user_id?: string;
  skill_name: string;
  proficiency_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category?: string;
  years_of_experience?: number;
  certificate_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Affiliation {
  id?: string;
  user_id?: string;
  organization_name: string;
  position: string;
  category?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  responsibilities?: string[];
  media_urls?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface Publication {
  id?: string;
  user_id?: string;
  title: string;
  publication_type?: string;
  publisher?: string;
  publication_date: string;
  isbn?: string;
  description?: string;
  cover_image_url?: string;
  pdf_url?: string;
  external_link?: string;
  co_authors?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface MediaInterview {
  id?: string;
  user_id?: string;
  title: string;
  media_source: string;
  interview_date: string;
  content_type?: 'text' | 'video' | 'podcast';
  content_url?: string;
  description?: string;
  topics?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Interest {
  id?: string;
  user_id?: string;
  interest_name: string;
  category?: string;
  description?: string;
  created_at?: string;
}

// Personal Info
export const getPersonalInfo = async (userId: string): Promise<PersonalInfo | null> => {
  const { data, error } = await supabase
    .from('resume_personal_info')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data as PersonalInfo | null;
};

export const upsertPersonalInfo = async (userId: string, data: Partial<PersonalInfo>) => {
  const { error } = await supabase
    .from('resume_personal_info')
    .upsert({ ...data, user_id: userId } as any, { onConflict: 'user_id' });

  if (error) throw error;
};

// Education
export const getEducation = async (userId: string): Promise<Education[]> => {
  const { data, error } = await supabase
    .from('resume_education')
    .select('*')
    .eq('user_id', userId)
    .order('start_year', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createEducation = async (data: Omit<Education, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_education').insert(data as any);
  if (error) throw error;
};

export const updateEducation = async (id: string, data: Partial<Education>) => {
  const { error } = await supabase.from('resume_education').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteEducation = async (id: string) => {
  const { error } = await supabase.from('resume_education').delete().eq('id', id);
  if (error) throw error;
};

// Certificates
export const getCertificates = async (userId: string): Promise<Certificate[]> => {
  const { data, error } = await supabase
    .from('resume_certificates')
    .select('*')
    .eq('user_id', userId)
    .order('issue_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createCertificate = async (data: Omit<Certificate, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_certificates').insert(data as any);
  if (error) throw error;
};

export const updateCertificate = async (id: string, data: Partial<Certificate>) => {
  const { error } = await supabase.from('resume_certificates').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteCertificate = async (id: string) => {
  const { error } = await supabase.from('resume_certificates').delete().eq('id', id);
  if (error) throw error;
};

// Work Experience
export const getWorkExperience = async (userId: string): Promise<WorkExperience[]> => {
  const { data, error } = await supabase
    .from('resume_work_experience')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createWorkExperience = async (data: Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_work_experience').insert(data as any);
  if (error) throw error;
};

export const updateWorkExperience = async (id: string, data: Partial<WorkExperience>) => {
  const { error } = await supabase.from('resume_work_experience').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteWorkExperience = async (id: string) => {
  const { error } = await supabase.from('resume_work_experience').delete().eq('id', id);
  if (error) throw error;
};

// Awards
export const getAwards = async (userId: string): Promise<Award[]> => {
  const { data, error } = await supabase
    .from('resume_awards')
    .select('*')
    .eq('user_id', userId)
    .order('award_date', { ascending: false });

  if (error) throw error;
  return (data || []) as Award[];
};

export const createAward = async (data: Omit<Award, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_awards').insert(data as any);
  if (error) throw error;
};

export const updateAward = async (id: string, data: Partial<Award>) => {
  const { error } = await supabase.from('resume_awards').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteAward = async (id: string) => {
  const { error } = await supabase.from('resume_awards').delete().eq('id', id);
  if (error) throw error;
};

// Skills
export const getSkills = async (userId: string): Promise<Skill[]> => {
  const { data, error } = await supabase
    .from('resume_skills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createSkill = async (data: Omit<Skill, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_skills').insert(data as any);
  if (error) throw error;
};

export const updateSkill = async (id: string, data: Partial<Skill>) => {
  const { error } = await supabase.from('resume_skills').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteSkill = async (id: string) => {
  const { error } = await supabase.from('resume_skills').delete().eq('id', id);
  if (error) throw error;
};

// Affiliations
export const getAffiliations = async (userId: string): Promise<Affiliation[]> => {
  const { data, error } = await supabase
    .from('resume_affiliations')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  return (data || []) as Affiliation[];
};

export const createAffiliation = async (data: Omit<Affiliation, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_affiliations').insert(data as any);
  if (error) throw error;
};

export const updateAffiliation = async (id: string, data: Partial<Affiliation>) => {
  const { error } = await supabase.from('resume_affiliations').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteAffiliation = async (id: string) => {
  const { error } = await supabase.from('resume_affiliations').delete().eq('id', id);
  if (error) throw error;
};

// Publications
export const getPublications = async (userId: string): Promise<Publication[]> => {
  const { data, error } = await supabase
    .from('resume_publications')
    .select('*')
    .eq('user_id', userId)
    .order('publication_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createPublication = async (data: Omit<Publication, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_publications').insert(data as any);
  if (error) throw error;
};

export const updatePublication = async (id: string, data: Partial<Publication>) => {
  const { error } = await supabase.from('resume_publications').update(data).eq('id', id);
  if (error) throw error;
};

export const deletePublication = async (id: string) => {
  const { error } = await supabase.from('resume_publications').delete().eq('id', id);
  if (error) throw error;
};

// Media Interviews
export const getMediaInterviews = async (userId: string): Promise<MediaInterview[]> => {
  const { data, error } = await supabase
    .from('resume_media_interviews')
    .select('*')
    .eq('user_id', userId)
    .order('interview_date', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createMediaInterview = async (data: Omit<MediaInterview, 'id' | 'created_at' | 'updated_at'>) => {
  const { error } = await supabase.from('resume_media_interviews').insert(data as any);
  if (error) throw error;
};

export const updateMediaInterview = async (id: string, data: Partial<MediaInterview>) => {
  const { error } = await supabase.from('resume_media_interviews').update(data).eq('id', id);
  if (error) throw error;
};

export const deleteMediaInterview = async (id: string) => {
  const { error } = await supabase.from('resume_media_interviews').delete().eq('id', id);
  if (error) throw error;
};

// Interests
export const getInterests = async (userId: string): Promise<Interest[]> => {
  const { data, error } = await supabase
    .from('resume_interests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const createInterest = async (data: Omit<Interest, 'id' | 'created_at'>) => {
  const { error } = await supabase.from('resume_interests').insert(data as any);
  if (error) throw error;
};

export const deleteInterest = async (id: string) => {
  const { error } = await supabase.from('resume_interests').delete().eq('id', id);
  if (error) throw error;
};