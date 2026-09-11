import { supabase } from '@/integrations/supabase/client';

// Types for our organizational data
export interface OrganizationalMission {
    id: string;
    title: string;
    description: string | null;
    status: 'فعال' | 'درحال اجرا' | 'تکمیل شده' | 'متوقف شده';
    priority: 'بالا' | 'متوسط' | 'پایین';
    progress: number;
    deadline: string | null;
    owner: string | null;
    organization_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrganizationalPolicy {
    id: string;
    title: string;
    description: string | null;
    type: 'استراتژیک' | 'اجرایی' | 'تاکتیکی';
    status: 'تصویب‌شده' | 'درانتظار تصویب' | 'در دست بررسی' | 'رد شده';
    period: 'سالیانه' | 'فصلی' | 'ماهیانه';
    approval_date: string | null;
    next_review: string | null;
    organization_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface OrganizationalKPI {
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
    period: 'سالیانه' | 'فصلی' | 'ماهیانه' | 'هفتگی';
    status: 'درحال پیگیری' | 'نیاز به بهبود' | 'در مسیر هدف' | 'هدف محقق شده';
    responsible: string | null;
    organization_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

export interface ApprovalWorkflow {
    id: string;
    policy_title: string;
    submitted_by: string;
    current_step: string;
    status: 'درانتظار' | 'در دست بررسی' | 'تأیید شده' | 'رد شده';
    submission_date: string;
    deadline: string | null;
    policy_id: string | null;
    organization_id: string | null;
    user_id: string | null;
    created_at: string;
    updated_at: string;
}

class OrganizationalPolicyMissionService {
    // Missions CRUD operations - Using localStorage as fallback
    async getMissions(): Promise<OrganizationalMission[]> {
        try {
            const stored = localStorage.getItem('organizational_missions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error fetching missions:', error);
            return [];
        }
    }

    async getMissionById(id: string): Promise<OrganizationalMission | null> {
        try {
            const missions = await this.getMissions();
            return missions.find(m => m.id === id) || null;
        } catch (error) {
            console.error('Error fetching mission:', error);
            return null;
        }
    }

    async createMission(mission: Omit<OrganizationalMission, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<OrganizationalMission> {
        try {
            const missions = await this.getMissions();
            const newMission: OrganizationalMission = {
                ...mission,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null
            };
            
            const updatedMissions = [...missions, newMission];
            localStorage.setItem('organizational_missions', JSON.stringify(updatedMissions));
            
            return newMission;
        } catch (error) {
            console.error('Error creating mission:', error);
            throw error;
        }
    }

    async updateMission(id: string, updates: Partial<OrganizationalMission>): Promise<OrganizationalMission> {
        try {
            const missions = await this.getMissions();
            const index = missions.findIndex(m => m.id === id);
            
            if (index === -1) {
                throw new Error('Mission not found');
            }
            
            const updatedMission = {
                ...missions[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            missions[index] = updatedMission;
            localStorage.setItem('organizational_missions', JSON.stringify(missions));
            
            return updatedMission;
        } catch (error) {
            console.error('Error updating mission:', error);
            throw error;
        }
    }

    async deleteMission(id: string): Promise<void> {
        try {
            const missions = await this.getMissions();
            const filteredMissions = missions.filter(m => m.id !== id);
            localStorage.setItem('organizational_missions', JSON.stringify(filteredMissions));
        } catch (error) {
            console.error('Error deleting mission:', error);
            throw error;
        }
    }

    // Policies CRUD operations - Using localStorage as fallback
    async getPolicies(): Promise<OrganizationalPolicy[]> {
        try {
            const stored = localStorage.getItem('organizational_policies');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error fetching policies:', error);
            return [];
        }
    }

    async getPolicyById(id: string): Promise<OrganizationalPolicy | null> {
        try {
            const policies = await this.getPolicies();
            return policies.find(p => p.id === id) || null;
        } catch (error) {
            console.error('Error fetching policy:', error);
            return null;
        }
    }

    async createPolicy(policy: Omit<OrganizationalPolicy, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<OrganizationalPolicy> {
        try {
            const policies = await this.getPolicies();
            const newPolicy: OrganizationalPolicy = {
                ...policy,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null
            };
            
            const updatedPolicies = [...policies, newPolicy];
            localStorage.setItem('organizational_policies', JSON.stringify(updatedPolicies));
            
            return newPolicy;
        } catch (error) {
            console.error('Error creating policy:', error);
            throw error;
        }
    }

    async updatePolicy(id: string, updates: Partial<OrganizationalPolicy>): Promise<OrganizationalPolicy> {
        try {
            const policies = await this.getPolicies();
            const index = policies.findIndex(p => p.id === id);
            
            if (index === -1) {
                throw new Error('Policy not found');
            }
            
            const updatedPolicy = {
                ...policies[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            policies[index] = updatedPolicy;
            localStorage.setItem('organizational_policies', JSON.stringify(policies));
            
            return updatedPolicy;
        } catch (error) {
            console.error('Error updating policy:', error);
            throw error;
        }
    }

    async deletePolicy(id: string): Promise<void> {
        try {
            const policies = await this.getPolicies();
            const filteredPolicies = policies.filter(p => p.id !== id);
            localStorage.setItem('organizational_policies', JSON.stringify(filteredPolicies));
        } catch (error) {
            console.error('Error deleting policy:', error);
            throw error;
        }
    }

    // KPIs CRUD operations - Using localStorage as fallback
    async getKPIs(): Promise<OrganizationalKPI[]> {
        try {
            const stored = localStorage.getItem('organizational_kpis');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            return [];
        }
    }

    async getKPIById(id: string): Promise<OrganizationalKPI | null> {
        try {
            const kpis = await this.getKPIs();
            return kpis.find(k => k.id === id) || null;
        } catch (error) {
            console.error('Error fetching KPI:', error);
            return null;
        }
    }

    async createKPI(kpi: Omit<OrganizationalKPI, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<OrganizationalKPI> {
        try {
            const kpis = await this.getKPIs();
            const newKPI: OrganizationalKPI = {
                ...kpi,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null
            };
            
            const updatedKPIs = [...kpis, newKPI];
            localStorage.setItem('organizational_kpis', JSON.stringify(updatedKPIs));
            
            return newKPI;
        } catch (error) {
            console.error('Error creating KPI:', error);
            throw error;
        }
    }

    async updateKPI(id: string, updates: Partial<OrganizationalKPI>): Promise<OrganizationalKPI> {
        try {
            const kpis = await this.getKPIs();
            const index = kpis.findIndex(k => k.id === id);
            
            if (index === -1) {
                throw new Error('KPI not found');
            }
            
            const updatedKPI = {
                ...kpis[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            kpis[index] = updatedKPI;
            localStorage.setItem('organizational_kpis', JSON.stringify(kpis));
            
            return updatedKPI;
        } catch (error) {
            console.error('Error updating KPI:', error);
            throw error;
        }
    }

    async deleteKPI(id: string): Promise<void> {
        try {
            const kpis = await this.getKPIs();
            const filteredKPIs = kpis.filter(k => k.id !== id);
            localStorage.setItem('organizational_kpis', JSON.stringify(filteredKPIs));
        } catch (error) {
            console.error('Error deleting KPI:', error);
            throw error;
        }
    }

    // Approval Workflows CRUD operations - Using localStorage as fallback
    async getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
        try {
            const stored = localStorage.getItem('approval_workflows');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error fetching approval workflows:', error);
            return [];
        }
    }

    async getApprovalWorkflowById(id: string): Promise<ApprovalWorkflow | null> {
        try {
            const workflows = await this.getApprovalWorkflows();
            return workflows.find(w => w.id === id) || null;
        } catch (error) {
            console.error('Error fetching approval workflow:', error);
            return null;
        }
    }

    async createApprovalWorkflow(workflow: Omit<ApprovalWorkflow, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<ApprovalWorkflow> {
        try {
            const workflows = await this.getApprovalWorkflows();
            const newWorkflow: ApprovalWorkflow = {
                ...workflow,
                id: Date.now().toString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                user_id: null
            };
            
            const updatedWorkflows = [...workflows, newWorkflow];
            localStorage.setItem('approval_workflows', JSON.stringify(updatedWorkflows));
            
            return newWorkflow;
        } catch (error) {
            console.error('Error creating approval workflow:', error);
            throw error;
        }
    }

    async updateApprovalWorkflow(id: string, updates: Partial<ApprovalWorkflow>): Promise<ApprovalWorkflow> {
        try {
            const workflows = await this.getApprovalWorkflows();
            const index = workflows.findIndex(w => w.id === id);
            
            if (index === -1) {
                throw new Error('Approval workflow not found');
            }
            
            const updatedWorkflow = {
                ...workflows[index],
                ...updates,
                updated_at: new Date().toISOString()
            };
            
            workflows[index] = updatedWorkflow;
            localStorage.setItem('approval_workflows', JSON.stringify(workflows));
            
            return updatedWorkflow;
        } catch (error) {
            console.error('Error updating approval workflow:', error);
            throw error;
        }
    }

    async deleteApprovalWorkflow(id: string): Promise<void> {
        try {
            const workflows = await this.getApprovalWorkflows();
            const filteredWorkflows = workflows.filter(w => w.id !== id);
            localStorage.setItem('approval_workflows', JSON.stringify(filteredWorkflows));
        } catch (error) {
            console.error('Error deleting approval workflow:', error);
            throw error;
        }
    }
}

export const organizationalPolicyMissionService = new OrganizationalPolicyMissionService();
export default organizationalPolicyMissionService;