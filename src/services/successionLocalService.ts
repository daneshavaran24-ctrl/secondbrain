import { SuccessionServiceAPI, SuccessionPosition, TalentPoolMember, DevelopmentProgram, PositionGoal } from './successionServiceTypes';

const STORAGE_KEYS = {
  POSITIONS: 'brainforge_succession_positions',
  TALENT_POOL: 'brainforge_succession_talent_pool',
  PROGRAMS: 'brainforge_succession_programs',
  GOALS: 'brainforge_succession_goals'
};

class SuccessionLocalService implements SuccessionServiceAPI {
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getFromStorage<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveToStorage<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Positions CRUD
  async getPositions(): Promise<SuccessionPosition[]> {
    return this.getFromStorage<SuccessionPosition>(STORAGE_KEYS.POSITIONS);
  }

  async createPosition(position: Omit<SuccessionPosition, 'id' | 'created_at' | 'updated_at'>): Promise<SuccessionPosition> {
    const positions = this.getFromStorage<SuccessionPosition>(STORAGE_KEYS.POSITIONS);
    const newPosition: SuccessionPosition = {
      ...position,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    positions.push(newPosition);
    this.saveToStorage(STORAGE_KEYS.POSITIONS, positions);
    return newPosition;
  }

  async updatePosition(id: string, updates: Partial<SuccessionPosition>): Promise<SuccessionPosition> {
    const positions = this.getFromStorage<SuccessionPosition>(STORAGE_KEYS.POSITIONS);
    const index = positions.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error('Position not found');
    
    positions[index] = {
      ...positions[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage(STORAGE_KEYS.POSITIONS, positions);
    return positions[index];
  }

  async deletePosition(id: string): Promise<void> {
    const positions = this.getFromStorage<SuccessionPosition>(STORAGE_KEYS.POSITIONS);
    const filtered = positions.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.POSITIONS, filtered);
  }

  // Talent Pool CRUD
  async getTalentPool(): Promise<TalentPoolMember[]> {
    return this.getFromStorage<TalentPoolMember>(STORAGE_KEYS.TALENT_POOL);
  }

  async createTalentMember(member: Omit<TalentPoolMember, 'id' | 'created_at' | 'updated_at'>): Promise<TalentPoolMember> {
    const talentPool = this.getFromStorage<TalentPoolMember>(STORAGE_KEYS.TALENT_POOL);
    const newMember: TalentPoolMember = {
      ...member,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    talentPool.push(newMember);
    this.saveToStorage(STORAGE_KEYS.TALENT_POOL, talentPool);
    return newMember;
  }

  async updateTalentMember(id: string, updates: Partial<TalentPoolMember>): Promise<TalentPoolMember> {
    const talentPool = this.getFromStorage<TalentPoolMember>(STORAGE_KEYS.TALENT_POOL);
    const index = talentPool.findIndex(t => t.id === id);
    
    if (index === -1) throw new Error('Talent member not found');
    
    talentPool[index] = {
      ...talentPool[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage(STORAGE_KEYS.TALENT_POOL, talentPool);
    return talentPool[index];
  }

  async deleteTalentMember(id: string): Promise<void> {
    const talentPool = this.getFromStorage<TalentPoolMember>(STORAGE_KEYS.TALENT_POOL);
    const filtered = talentPool.filter(t => t.id !== id);
    this.saveToStorage(STORAGE_KEYS.TALENT_POOL, filtered);
  }

  // Development Programs CRUD
  async getDevelopmentPrograms(): Promise<DevelopmentProgram[]> {
    return this.getFromStorage<DevelopmentProgram>(STORAGE_KEYS.PROGRAMS);
  }

  async createDevelopmentProgram(program: Omit<DevelopmentProgram, 'id' | 'created_at' | 'updated_at'>): Promise<DevelopmentProgram> {
    const programs = this.getFromStorage<DevelopmentProgram>(STORAGE_KEYS.PROGRAMS);
    const newProgram: DevelopmentProgram = {
      ...program,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    programs.push(newProgram);
    this.saveToStorage(STORAGE_KEYS.PROGRAMS, programs);
    return newProgram;
  }

  async updateDevelopmentProgram(id: string, updates: Partial<DevelopmentProgram>): Promise<DevelopmentProgram> {
    const programs = this.getFromStorage<DevelopmentProgram>(STORAGE_KEYS.PROGRAMS);
    const index = programs.findIndex(p => p.id === id);
    
    if (index === -1) throw new Error('Program not found');
    
    programs[index] = {
      ...programs[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage(STORAGE_KEYS.PROGRAMS, programs);
    return programs[index];
  }

  async deleteDevelopmentProgram(id: string): Promise<void> {
    const programs = this.getFromStorage<DevelopmentProgram>(STORAGE_KEYS.PROGRAMS);
    const filtered = programs.filter(p => p.id !== id);
    this.saveToStorage(STORAGE_KEYS.PROGRAMS, filtered);
  }

  // Position Goals CRUD
  async getPositionGoals(_organizationId?: string, positionId?: string): Promise<PositionGoal[]> {
    const goals = this.getFromStorage<PositionGoal>(STORAGE_KEYS.GOALS);
    if (positionId) {
      return goals.filter(g => g.position_id === positionId);
    }
    return goals;
  }

  async createPositionGoal(goal: Omit<PositionGoal, 'id' | 'created_at' | 'updated_at'>): Promise<PositionGoal> {
    const goals = this.getFromStorage<PositionGoal>(STORAGE_KEYS.GOALS);
    const newGoal: PositionGoal = {
      ...goal,
      id: this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    goals.push(newGoal);
    this.saveToStorage(STORAGE_KEYS.GOALS, goals);
    return newGoal;
  }

  async updatePositionGoal(id: string, updates: Partial<PositionGoal>): Promise<PositionGoal> {
    const goals = this.getFromStorage<PositionGoal>(STORAGE_KEYS.GOALS);
    const index = goals.findIndex(g => g.id === id);
    
    if (index === -1) throw new Error('Goal not found');
    
    goals[index] = {
      ...goals[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.saveToStorage(STORAGE_KEYS.GOALS, goals);
    return goals[index];
  }

  async deletePositionGoal(id: string): Promise<void> {
    const goals = this.getFromStorage<PositionGoal>(STORAGE_KEYS.GOALS);
    const filtered = goals.filter(g => g.id !== id);
    this.saveToStorage(STORAGE_KEYS.GOALS, filtered);
  }

  // Helper methods
  getCriticalityBadgeVariant(criticality: string): "default" | "secondary" | "destructive" | "outline" {
    switch (criticality) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  }

  getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case 'active': return 'default';
      case 'completed': return 'secondary';
      case 'planning': return 'outline';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  }

  getReadinessBadgeVariant(readiness: string): "default" | "secondary" | "destructive" | "outline" {
    switch (readiness) {
      case 'ready_now': return 'default';
      case 'ready_1_year': return 'secondary';
      case 'ready_2_years': return 'outline';
      case 'not_ready': return 'destructive';
      default: return 'outline';
    }
  }

  formatReadinessText(readiness: string): string {
    switch (readiness) {
      case 'ready_now': return 'آماده';
      case 'ready_1_year': return '۱ سال';
      case 'ready_2_years': return '۲ سال';
      case 'not_ready': return 'غیرآماده';
      default: return readiness;
    }
  }

  formatCriticalityText(criticality: string): string {
    switch (criticality) {
      case 'critical': return 'بحرانی';
      case 'high': return 'بالا';
      case 'medium': return 'متوسط';
      case 'low': return 'پایین';
      default: return criticality;
    }
  }

  formatStatusText(status: string): string {
    switch (status) {
      case 'planning': return 'در حال برنامه‌ریزی';
      case 'active': return 'فعال';
      case 'completed': return 'تکمیل شده';
      case 'suspended': return 'متوقف';
      default: return status;
    }
  }

  getGoalTypeBadgeVariant(goalType: string): "default" | "secondary" | "destructive" | "outline" {
    switch (goalType) {
      case 'short_term': return 'default';
      case 'long_term': return 'secondary';
      case 'strategic': return 'outline';
      default: return 'outline';
    }
  }

  getGoalStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
      case 'completed': return 'default';
      case 'in_progress': return 'secondary';
      case 'planning': return 'outline';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  }

  formatGoalTypeText(goalType: string): string {
    switch (goalType) {
      case 'short_term': return 'کوتاه‌مدت';
      case 'long_term': return 'بلندمدت';
      case 'strategic': return 'استراتژیک';
      default: return goalType;
    }
  }

  formatGoalStatusText(status: string): string {
    switch (status) {
      case 'planning': return 'برنامه‌ریزی';
      case 'in_progress': return 'در حال اجرا';
      case 'completed': return 'تکمیل شده';
      case 'cancelled': return 'لغو شده';
      default: return status;
    }
  }
}

export const successionLocalService = new SuccessionLocalService();