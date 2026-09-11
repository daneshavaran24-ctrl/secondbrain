import { supabase } from '@/integrations/supabase/client';

export interface ResumeTemplate {
  id: string;
  user_id: string;
  template_name: string;
  job_title?: string;
  company_name?: string;
  job_description?: string;
  sections_config: any;
  highlighted_skills?: string[];
  highlighted_experiences?: string[];
  highlighted_certificates?: string[];
  highlighted_education?: string[];
  highlighted_awards?: string[];
  ai_optimized: boolean;
  ai_suggestions?: any;
  template_type: string;
  color_scheme: string;
  layout_style: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateCustomization {
  id?: string;
  template_id: string;
  section_type: string;
  item_id: string;
  custom_description?: string;
  custom_highlights?: string[];
  display_order?: number;
  is_visible: boolean;
}

// Template Management
export const getTemplates = async (userId: string): Promise<ResumeTemplate[]> => {
  const { data, error } = await supabase
    .from('resume_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const getTemplate = async (id: string): Promise<ResumeTemplate | null> => {
  const { data, error } = await supabase
    .from('resume_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
};

export const createTemplate = async (data: Partial<ResumeTemplate>): Promise<ResumeTemplate> => {
  const { data: template, error } = await supabase
    .from('resume_templates')
    .insert(data as any)
    .select()
    .single();

  if (error) throw error;
  return template;
};

export const updateTemplate = async (id: string, data: Partial<ResumeTemplate>): Promise<void> => {
  const { error } = await supabase
    .from('resume_templates')
    .update(data)
    .eq('id', id);

  if (error) throw error;
};

export const deleteTemplate = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('resume_templates')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const setDefaultTemplate = async (userId: string, templateId: string): Promise<void> => {
  // First, unset all defaults for this user
  await supabase
    .from('resume_templates')
    .update({ is_default: false })
    .eq('user_id', userId);

  // Then set the new default
  const { error } = await supabase
    .from('resume_templates')
    .update({ is_default: true })
    .eq('id', templateId);

  if (error) throw error;
};

// Customization Management
export const getCustomizations = async (templateId: string): Promise<TemplateCustomization[]> => {
  const { data, error } = await supabase
    .from('resume_template_customizations')
    .select('*')
    .eq('template_id', templateId)
    .order('display_order', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const saveCustomization = async (customization: TemplateCustomization): Promise<void> => {
  if (customization.id) {
    const { error } = await supabase
      .from('resume_template_customizations')
      .update(customization)
      .eq('id', customization.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('resume_template_customizations')
      .insert(customization as any);
    if (error) throw error;
  }
};

export const deleteCustomization = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('resume_template_customizations')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Export tracking
export const trackExport = async (userId: string, templateId: string, format: string): Promise<string> => {
  const { data, error } = await supabase
    .from('resume_exports')
    .insert({
      user_id: userId,
      template_id: templateId,
      export_format: format,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data.id;
};

export const updateExportDownload = async (exportId: string): Promise<void> => {
  // Get current download count
  const { data: currentData } = await supabase
    .from('resume_exports')
    .select('download_count')
    .eq('id', exportId)
    .single();

  const newCount = (currentData?.download_count || 0) + 1;

  const { error } = await supabase
    .from('resume_exports')
    .update({
      download_count: newCount,
      last_downloaded_at: new Date().toISOString(),
    })
    .eq('id', exportId);

  if (error) console.error('Failed to update download count:', error);
};
