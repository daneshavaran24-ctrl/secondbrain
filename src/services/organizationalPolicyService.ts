import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrganizationalMission = Database['public']['Tables']['organization_missions']['Row'];
type OrganizationalPolicy = Database['public']['Tables']['organization_policies']['Row'];
type NewPolicy = Omit<OrganizationalPolicy, 'id' | 'created_at' | 'updated_at'>;

// KPIs and Approval Workflows will use localStorage since tables don't exist
type OrganizationalKPI = {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  organization_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type ApprovalWorkflow = {
  id: string;
  title: string;
  description?: string;
  workflow_type: string;
  status: string;
  organization_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export interface PolicyAttachment {
  id: string;
  policy_id: string;
  file_name: string;
  file_path: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
}

export interface ExportData {
  missions: OrganizationalMission[];
  policies: OrganizationalPolicy[];
  kpis: OrganizationalKPI[];
  approvalWorkflows: ApprovalWorkflow[];
  attachments: PolicyAttachment[];
  exportedAt: string;
}

class OrganizationalPolicyService {
  private readonly KPI_STORAGE_KEY = 'organizational_kpis';
  private readonly WORKFLOW_STORAGE_KEY = 'approval_workflows';

  // Missions
  async getMissions(): Promise<OrganizationalMission[]> {
    try {
      const userOrgId = await this.getUserOrganizationId();
      
      let query = supabase
        .from('organization_missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (userOrgId) {
        query = query.eq('organization_id', userOrgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching missions:', error);
      return this.getMissionsFromLocalStorage();
    }
  }

  async createMission(mission: Omit<OrganizationalMission, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'organization_id'>): Promise<OrganizationalMission> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userOrgId = await this.getUserOrganizationId();

      const { data, error } = await supabase
        .from('organization_missions')
        .insert([{
          ...mission,
          user_id: user.id,
          organization_id: userOrgId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating mission:', error);
      throw error;
    }
  }

  async updateMission(id: string, updates: Partial<OrganizationalMission>): Promise<OrganizationalMission> {
    try {
      const { data, error } = await supabase
        .from('organization_missions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating mission:', error);
      throw error;
    }
  }

  async deleteMission(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_missions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting mission:', error);
      throw error;
    }
  }

  // Policies
  async getPolicies(): Promise<OrganizationalPolicy[]> {
    try {
      const userOrgId = await this.getUserOrganizationId();
      
      let query = supabase
        .from('organization_policies')
        .select('*')
        .order('created_at', { ascending: false });

      if (userOrgId) {
        query = query.eq('organization_id', userOrgId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching policies:', error);
      return this.getPoliciesFromLocalStorage();
    }
  }

  async createPolicy(policy: Omit<NewPolicy, 'user_id' | 'organization_id'>): Promise<OrganizationalPolicy> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const userOrgId = await this.getUserOrganizationId();

      const { data, error } = await supabase
        .from('organization_policies')
        .insert([{
          ...policy,
          user_id: user.id,
          organization_id: userOrgId
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating policy:', error);
      throw error;
    }
  }

  async updatePolicy(id: string, updates: Partial<OrganizationalPolicy>): Promise<OrganizationalPolicy> {
    try {
      const { data, error } = await supabase
        .from('organization_policies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  async deletePolicy(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_policies')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting policy:', error);
      throw error;
    }
  }

  // KPIs (localStorage only)
  async getKPIs(): Promise<OrganizationalKPI[]> {
    return this.getKPIsFromLocalStorage();
  }

  async createKPI(kpi: Omit<OrganizationalKPI, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationalKPI> {
    const kpis = this.getKPIsFromLocalStorage();
    const newKPI: OrganizationalKPI = {
      ...kpi,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    kpis.push(newKPI);
    localStorage.setItem(this.KPI_STORAGE_KEY, JSON.stringify(kpis));
    return newKPI;
  }

  async updateKPI(id: string, updates: Partial<OrganizationalKPI>): Promise<OrganizationalKPI> {
    const kpis = this.getKPIsFromLocalStorage();
    const index = kpis.findIndex(k => k.id === id);
    if (index === -1) throw new Error('KPI not found');
    
    kpis[index] = { ...kpis[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(this.KPI_STORAGE_KEY, JSON.stringify(kpis));
    return kpis[index];
  }

  async deleteKPI(id: string): Promise<void> {
    const kpis = this.getKPIsFromLocalStorage();
    const filtered = kpis.filter(k => k.id !== id);
    localStorage.setItem(this.KPI_STORAGE_KEY, JSON.stringify(filtered));
  }

  // Approval Workflows (localStorage only)
  async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
    return this.getWorkflowsFromLocalStorage();
  }

  async createApprovalWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at'>): Promise<ApprovalWorkflow> {
    const workflows = this.getWorkflowsFromLocalStorage();
    const newWorkflow: ApprovalWorkflow = {
      ...workflow,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    workflows.push(newWorkflow);
    localStorage.setItem(this.WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
    return newWorkflow;
  }

  async updateApprovalWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
    const workflows = this.getWorkflowsFromLocalStorage();
    const index = workflows.findIndex(w => w.id === id);
    if (index === -1) throw new Error('Workflow not found');
    
    workflows[index] = { ...workflows[index], ...updates, updated_at: new Date().toISOString() };
    localStorage.setItem(this.WORKFLOW_STORAGE_KEY, JSON.stringify(workflows));
    return workflows[index];
  }

  async deleteApprovalWorkflow(id: string): Promise<void> {
    const workflows = this.getWorkflowsFromLocalStorage();
    const filtered = workflows.filter(w => w.id !== id);
    localStorage.setItem(this.WORKFLOW_STORAGE_KEY, JSON.stringify(filtered));
  }

  // Attachments
  async uploadAttachment(file: File, itemType: string, itemId: string): Promise<PolicyAttachment> {
    const filePath = `${itemType}/${itemId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const attachment: PolicyAttachment = {
      id: crypto.randomUUID(),
      policy_id: itemId,
      file_name: file.name,
      file_path: filePath,
      mime_type: file.type,
      file_size: file.size,
      created_at: new Date().toISOString()
    };

    const { error: dbError } = await supabase
      .from('organizational_policy_attachments')
      .insert([attachment]);

    if (dbError) throw dbError;

    return attachment;
  }

  async deleteAttachment(id: string, filePath: string): Promise<void> {
    await supabase.storage.from('documents').remove([filePath]);
    
    const { error } = await supabase
      .from('organizational_policy_attachments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Export data
  async exportData(organizationName?: string): Promise<ExportData> {
    const missions = await this.getMissions();
    const policies = await this.getPolicies();
    const kpis = await this.getKPIs();
    const approvalWorkflows = await this.getApprovalWorkflows();
    
    const { data: attachments } = await supabase
      .from('organizational_policy_attachments')
      .select('*');

    return {
      missions,
      policies,
      kpis,
      approvalWorkflows,
      attachments: attachments || [],
      exportedAt: new Date().toISOString()
    };
  }

  // Helper methods
  private async getUserOrganizationId(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      return data?.organization_id || null;
    } catch {
      return null;
    }
  }

  private getMissionsFromLocalStorage(): OrganizationalMission[] {
    const stored = localStorage.getItem('organizational_missions');
    return stored ? JSON.parse(stored) : [];
  }

  private getPoliciesFromLocalStorage(): OrganizationalPolicy[] {
    const stored = localStorage.getItem('organizational_policies');
    return stored ? JSON.parse(stored) : [];
  }

  private getKPIsFromLocalStorage(): OrganizationalKPI[] {
    const stored = localStorage.getItem(this.KPI_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  private getWorkflowsFromLocalStorage(): ApprovalWorkflow[] {
    const stored = localStorage.getItem(this.WORKFLOW_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }
}

export const organizationalPolicyService = new OrganizationalPolicyService();
export default organizationalPolicyService;
