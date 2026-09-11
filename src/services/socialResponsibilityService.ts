import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type CSRProjectRow = Database['public']['Tables']['csr_projects']['Row'];
type CSRProjectInsert = Database['public']['Tables']['csr_projects']['Insert'];
type CSRProjectUpdate = Database['public']['Tables']['csr_projects']['Update'];

type CSRDocumentRow = Database['public']['Tables']['csr_project_documents']['Row'];
type CSRTeamRow = Database['public']['Tables']['csr_project_team']['Row'];
type CSRMilestoneRow = Database['public']['Tables']['csr_project_milestones']['Row'];
type CSRAssessmentRow = Database['public']['Tables']['csr_impact_assessments']['Row'];

export interface CSRProject extends CSRProjectRow {}
export interface CSRDocument extends CSRDocumentRow {}
export interface CSRTeamMember extends CSRTeamRow {}
export interface CSRMilestone extends CSRMilestoneRow {}
export interface CSRAssessment extends CSRAssessmentRow {}

export interface CSRStats {
  total: number;
  byType: {
    charity: number;
    environment: number;
    education: number;
    other: number;
  };
  byStatus: {
    planning: number;
    active: number;
    completed: number;
    on_hold: number;
  };
  totalBudget: number;
  totalBeneficiaries: number;
  avgSatisfaction: number;
}

export const socialResponsibilityService = {
  // Projects
  async getCSRProjects(filters?: {
    type?: string;
    status?: string;
    organizationId?: string;
  }): Promise<CSRProject[]> {
    try {
      let query = supabase.from('csr_projects').select('*').order('created_at', { ascending: false });
      
      if (filters?.type) {
        query = query.eq('type', filters.type);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.organizationId) {
        query = query.eq('organization_id', filters.organizationId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching CSR projects:', error);
      return [];
    }
  },

  async createCSRProject(project: Partial<CSRProject>): Promise<CSRProject | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { user_id, ...projectData } = project as any;
      const insertData: CSRProjectInsert = { ...projectData, user_id: user.id };
      const { data, error } = await supabase
        .from('csr_projects')
        .insert([insertData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating CSR project:', error);
      return null;
    }
  },

  async updateCSRProject(id: string, updates: CSRProjectUpdate): Promise<CSRProject | null> {
    try {
      const { data, error } = await supabase
        .from('csr_projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating CSR project:', error);
      return null;
    }
  },

  async deleteCSRProject(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('csr_projects')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting CSR project:', error);
      return false;
    }
  },

  async getCSRStats(organizationId?: string): Promise<CSRStats | null> {
    try {
      let query = supabase.from('csr_projects').select('*');
      
      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      }
      
      const { data: projects, error } = await query;
      if (error) throw error;

      const { data: assessments } = await supabase
        .from('csr_impact_assessments')
        .select('beneficiaries_count, satisfaction_score');

      const stats: CSRStats = {
        total: projects?.length || 0,
        byType: {
          charity: projects?.filter(p => p.type === 'charity').length || 0,
          environment: projects?.filter(p => p.type === 'environment').length || 0,
          education: projects?.filter(p => p.type === 'education').length || 0,
          other: projects?.filter(p => p.type === 'other').length || 0,
        },
        byStatus: {
          planning: projects?.filter(p => p.status === 'planning').length || 0,
          active: projects?.filter(p => p.status === 'active').length || 0,
          completed: projects?.filter(p => p.status === 'completed').length || 0,
          on_hold: projects?.filter(p => p.status === 'on_hold').length || 0,
        },
        totalBudget: projects?.reduce((sum, p) => sum + (Number(p.budget) || 0), 0) || 0,
        totalBeneficiaries: assessments?.reduce((sum, a) => sum + (a.beneficiaries_count || 0), 0) || 0,
        avgSatisfaction: assessments?.length 
          ? assessments.reduce((sum, a) => sum + (Number(a.satisfaction_score) || 0), 0) / assessments.length 
          : 0,
      };
      
      return stats;
    } catch (error) {
      console.error('Error fetching CSR stats:', error);
      return null;
    }
  },

  // Documents
  async uploadDocument(projectId: string, file: File, description?: string, category?: string): Promise<CSRDocument | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${projectId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('csr-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('csr-documents')
        .getPublicUrl(filePath);

      const { data, error } = await supabase
        .from('csr_project_documents')
        .insert({
          project_id: projectId,
          user_id: user.id,
          file_name: file.name,
          file_type: file.type,
          file_url: publicUrl,
          file_size: file.size,
          description,
          category,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error uploading document:', error);
      return null;
    }
  },

  async getProjectDocuments(projectId: string): Promise<CSRDocument[]> {
    try {
      const { data, error } = await supabase
        .from('csr_project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  },

  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('csr_project_documents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  },

  // Team
  async addTeamMember(member: Omit<CSRTeamMember, 'id' | 'created_at' | 'joined_at'>): Promise<CSRTeamMember | null> {
    try {
      const { data, error } = await supabase
        .from('csr_project_team')
        .insert(member)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding team member:', error);
      return null;
    }
  },

  async getProjectTeam(projectId: string): Promise<CSRTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('csr_project_team')
        .select('*')
        .eq('project_id', projectId)
        .order('joined_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching team:', error);
      return [];
    }
  },

  async removeTeamMember(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('csr_project_team')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  },

  // Milestones
  async createMilestone(milestone: Omit<CSRMilestone, 'id' | 'created_at' | 'updated_at'>): Promise<CSRMilestone | null> {
    try {
      const { data, error } = await supabase
        .from('csr_project_milestones')
        .insert(milestone)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating milestone:', error);
      return null;
    }
  },

  async updateMilestoneProgress(id: string, progress: number, status?: string): Promise<CSRMilestone | null> {
    try {
      const updates: any = { progress_percentage: progress };
      if (status) updates.status = status;
      if (progress === 100) updates.completed_date = new Date().toISOString();

      const { data, error } = await supabase
        .from('csr_project_milestones')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating milestone:', error);
      return null;
    }
  },

  async getMilestones(projectId: string): Promise<CSRMilestone[]> {
    try {
      const { data, error } = await supabase
        .from('csr_project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }
  },

  async deleteMilestone(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('csr_project_milestones')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting milestone:', error);
      return false;
    }
  },

  // Impact Assessments
  async submitAssessment(assessment: Omit<CSRAssessment, 'id' | 'created_at' | 'updated_at'>): Promise<CSRAssessment | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('csr_impact_assessments')
        .insert({ ...assessment, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error submitting assessment:', error);
      return null;
    }
  },

  async getImpactAssessments(projectId: string): Promise<CSRAssessment[]> {
    try {
      const { data, error } = await supabase
        .from('csr_impact_assessments')
        .select('*')
        .eq('project_id', projectId)
        .order('assessment_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching assessments:', error);
      return [];
    }
  },
};
