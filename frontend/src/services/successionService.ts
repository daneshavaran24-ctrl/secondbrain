import { supabase } from "@/integrations/supabase/client";
import { SuccessionServiceAPI, SuccessionPosition, TalentPoolMember, DevelopmentProgram, PositionGoal } from './successionServiceTypes';

// Using localStorage for Talent Pool and Programs until tables are created
const TALENT_POOL_KEY = 'succession_talent_pool';
const DEV_PROGRAMS_KEY = 'succession_dev_programs';
const POSITION_GOALS_KEY = 'succession_position_goals';

function getFromStorage<T>(key: string): T[] {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveToStorage<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
}

class SuccessionPlanningService implements SuccessionServiceAPI {
  // Positions CRUD - Using Supabase
  async getPositions(organizationId?: string): Promise<SuccessionPosition[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('succession_positions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to expected interface
      return (data || []).map(pos => ({
        id: pos.id,
        organization_id: pos.organization_id,
        position_title: pos.title,
        department: pos.department,
        criticality: (pos.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
        current_holder_name: pos.current_holder,
        current_holder_id: null,
        successor_count: 0,
        readiness_level: 'not_ready' as const,
        skills_required: pos.requirements || [],
        qualifications_required: '',
        notes: '',
        created_at: pos.created_at,
        updated_at: pos.updated_at,
      }));
    } catch (error) {
      console.error('Error getting positions:', error);
      return [];
    }
  }

  async createPosition(position: Omit<SuccessionPosition, 'id' | 'created_at' | 'updated_at'>): Promise<SuccessionPosition> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('succession_positions')
      .insert({
        user_id: user.id,
        organization_id: position.organization_id,
        title: position.position_title,
        department: position.department,
        criticality: position.criticality,
        current_holder: position.current_holder_name || '',
        requirements: position.skills_required || [],
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      organization_id: data.organization_id,
      position_title: data.title,
      department: data.department,
      criticality: (data.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
      current_holder_name: data.current_holder,
      current_holder_id: null,
      successor_count: 0,
      readiness_level: 'not_ready',
      skills_required: data.requirements || [],
      qualifications_required: '',
      notes: '',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async updatePosition(id: string, updates: Partial<SuccessionPosition>): Promise<SuccessionPosition> {
    const dbUpdates: any = {};
    if (updates.position_title) dbUpdates.title = updates.position_title;
    if (updates.department) dbUpdates.department = updates.department;
    if (updates.criticality) dbUpdates.criticality = updates.criticality;
    if (updates.current_holder_name) dbUpdates.current_holder = updates.current_holder_name;
    if (updates.skills_required) dbUpdates.requirements = updates.skills_required;

    const { data, error } = await supabase
      .from('succession_positions')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      organization_id: data.organization_id,
      position_title: data.title,
      department: data.department,
      criticality: (data.criticality || 'medium') as 'low' | 'medium' | 'high' | 'critical',
      current_holder_name: data.current_holder,
      current_holder_id: null,
      successor_count: 0,
      readiness_level: 'not_ready',
      skills_required: data.requirements || [],
      qualifications_required: '',
      notes: '',
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  }

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from('succession_positions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Talent Pool CRUD - Using localStorage
  async getTalentPool(organizationId?: string): Promise<TalentPoolMember[]> {
    const pool = getFromStorage<TalentPoolMember>(TALENT_POOL_KEY);
    return organizationId ? pool.filter(m => m.organization_id === organizationId) : pool;
  }

  async createTalentMember(member: Omit<TalentPoolMember, 'id' | 'created_at' | 'updated_at'>): Promise<TalentPoolMember> {
    const newMember: TalentPoolMember = {
      ...member,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const pool = getFromStorage<TalentPoolMember>(TALENT_POOL_KEY);
    pool.push(newMember);
    saveToStorage(TALENT_POOL_KEY, pool);

    return newMember;
  }

  async updateTalentMember(id: string, updates: Partial<TalentPoolMember>): Promise<TalentPoolMember> {
    const pool = getFromStorage<TalentPoolMember>(TALENT_POOL_KEY);
    const index = pool.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Talent member not found');

    pool[index] = { ...pool[index], ...updates, updated_at: new Date().toISOString() };
    saveToStorage(TALENT_POOL_KEY, pool);

    return pool[index];
  }

  async deleteTalentMember(id: string): Promise<void> {
    const pool = getFromStorage<TalentPoolMember>(TALENT_POOL_KEY);
    const filtered = pool.filter(m => m.id !== id);
    saveToStorage(TALENT_POOL_KEY, filtered);
  }

  // Development Programs CRUD - Using localStorage
  async getDevelopmentPrograms(organizationId?: string): Promise<DevelopmentProgram[]> {
    const programs = getFromStorage<DevelopmentProgram>(DEV_PROGRAMS_KEY);
    return organizationId ? programs.filter(p => p.organization_id === organizationId) : programs;
  }

  async createDevelopmentProgram(program: Omit<DevelopmentProgram, 'id' | 'created_at' | 'updated_at'>): Promise<DevelopmentProgram> {
    const newProgram: DevelopmentProgram = {
      ...program,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const programs = getFromStorage<DevelopmentProgram>(DEV_PROGRAMS_KEY);
    programs.push(newProgram);
    saveToStorage(DEV_PROGRAMS_KEY, programs);

    return newProgram;
  }

  async updateDevelopmentProgram(id: string, updates: Partial<DevelopmentProgram>): Promise<DevelopmentProgram> {
    const programs = getFromStorage<DevelopmentProgram>(DEV_PROGRAMS_KEY);
    const index = programs.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Program not found');

    programs[index] = { ...programs[index], ...updates, updated_at: new Date().toISOString() };
    saveToStorage(DEV_PROGRAMS_KEY, programs);

    return programs[index];
  }

  async deleteDevelopmentProgram(id: string): Promise<void> {
    const programs = getFromStorage<DevelopmentProgram>(DEV_PROGRAMS_KEY);
    const filtered = programs.filter(p => p.id !== id);
    saveToStorage(DEV_PROGRAMS_KEY, filtered);
  }

  // Position Goals CRUD - Using localStorage
  async getPositionGoals(positionId: string): Promise<PositionGoal[]> {
    const goals = getFromStorage<PositionGoal>(POSITION_GOALS_KEY);
    return goals.filter(g => g.position_id === positionId);
  }

  async createPositionGoal(goal: Omit<PositionGoal, 'id' | 'created_at' | 'updated_at'>): Promise<PositionGoal> {
    const newGoal: PositionGoal = {
      ...goal,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const goals = getFromStorage<PositionGoal>(POSITION_GOALS_KEY);
    goals.push(newGoal);
    saveToStorage(POSITION_GOALS_KEY, goals);

    return newGoal;
  }

  async updatePositionGoal(id: string, updates: Partial<PositionGoal>): Promise<PositionGoal> {
    const goals = getFromStorage<PositionGoal>(POSITION_GOALS_KEY);
    const index = goals.findIndex(g => g.id === id);
    if (index === -1) throw new Error('Goal not found');

    goals[index] = { ...goals[index], ...updates, updated_at: new Date().toISOString() };
    saveToStorage(POSITION_GOALS_KEY, goals);

    return goals[index];
  }

  async deletePositionGoal(id: string): Promise<void> {
    const goals = getFromStorage<PositionGoal>(POSITION_GOALS_KEY);
    const filtered = goals.filter(g => g.id !== id);
    saveToStorage(POSITION_GOALS_KEY, filtered);
  }

  // Stats
  async getSuccessionStats(organizationId?: string): Promise<{
    total_positions: number;
    critical_positions: number;
    positions_with_successors: number;
    talent_pool_size: number;
    ready_successors: number;
    in_development: number;
  }> {
    const positions = await this.getPositions(organizationId);
    const talentPool = await this.getTalentPool(organizationId);

    return {
      total_positions: positions.length,
      critical_positions: positions.filter(p => p.criticality === 'critical' || p.criticality === 'high').length,
      positions_with_successors: positions.filter(p => p.successor_count > 0).length,
      talent_pool_size: talentPool.length,
      ready_successors: talentPool.filter(m => m.readiness_level === 'ready_now').length,
      in_development: talentPool.filter(m => m.readiness_level === 'ready_1_year' || m.readiness_level === 'ready_2_years').length,
    };
  }

  // Helper methods required by interface
  getCriticalityBadgeVariant(criticality: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      low: 'secondary',
      medium: 'default',
      high: 'destructive',
      critical: 'destructive'
    };
    return variants[criticality] || 'default';
  }

  getStatusBadgeVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      active: 'default',
      filled: 'default',
      vacant: 'destructive'
    };
    return variants[status] || 'secondary';
  }

  getReadinessBadgeVariant(readiness: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      not_ready: 'secondary',
      ready_2_years: 'default',
      ready_1_year: 'default',
      ready_now: 'default'
    };
    return variants[readiness] || 'secondary';
  }

  getGoalTypeBadgeVariant(_type: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    return 'default';
  }

  getGoalStatusBadgeVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
    const variants: Record<string, 'default' | 'destructive' | 'outline' | 'secondary'> = {
      not_started: 'secondary',
      in_progress: 'default',
      completed: 'default',
      blocked: 'destructive'
    };
    return variants[status] || 'secondary';
  }

  getProgramStatusBadgeVariant(status: string) {
    const variants = {
      planning: 'secondary',
      active: 'default',
      completed: 'default',
      cancelled: 'destructive'
    };
    return variants[status as keyof typeof variants] || 'secondary';
  }

  formatReadinessText(readiness: string): string {
    const texts: Record<string, string> = {
      not_ready: 'آماده نیست',
      ready_2_years: 'آماده در 2 سال',
      ready_1_year: 'آماده در 1 سال',
      ready_now: 'آماده است'
    };
    return texts[readiness] || readiness;
  }

  formatCriticalityText(criticality: string): string {
    const texts: Record<string, string> = {
      low: 'پایین',
      medium: 'متوسط',
      high: 'بالا',
      critical: 'حیاتی'
    };
    return texts[criticality] || criticality;
  }

  formatStatusText(status: string): string {
    const texts: Record<string, string> = {
      active: 'فعال',
      filled: 'پر شده',
      vacant: 'خالی'
    };
    return texts[status] || status;
  }

  formatGoalTypeText(type: string): string {
    const texts: Record<string, string> = {
      development: 'توسعه',
      performance: 'عملکرد',
      readiness: 'آمادگی'
    };
    return texts[type] || type;
  }

  formatGoalStatusText(status: string): string {
    const texts: Record<string, string> = {
      not_started: 'شروع نشده',
      in_progress: 'در حال اجرا',
      completed: 'تکمیل شده',
      blocked: 'مسدود'
    };
    return texts[status] || status;
  }

  formatDate(date: string) {
    try {
      return new Date(date).toLocaleDateString('fa-IR');
    } catch {
      return date;
    }
  }

  formatCurrency(amount: number, currency: string = 'IRR') {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency
    }).format(amount);
  }

  calculateProgress(current: number, target: number) {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  }

  getPerformancePotentialMatrix(performance: number, potential: number) {
    if (performance >= 4 && potential >= 4) return { label: 'ستاره‌ها', color: 'success' };
    if (performance >= 4 && potential < 4) return { label: 'کارکنان کلیدی', color: 'primary' };
    if (performance < 4 && potential >= 4) return { label: 'استعدادهای آینده', color: 'warning' };
    return { label: 'نیاز به توسعه', color: 'secondary' };
  }
}

export const successionService = new SuccessionPlanningService();
export default successionService;
