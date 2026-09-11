export interface SuccessionPosition {
  id?: string;
  organization_id?: string;
  position_title: string;
  department?: string;
  criticality: 'low' | 'medium' | 'high' | 'critical';
  current_holder_name?: string;
  current_holder_id?: string;
  successor_count?: number;
  readiness_level: 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready';
  skills_required?: string[];
  qualifications_required?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TalentPoolMember {
  id?: string;
  organization_id?: string;
  employee_name: string;
  employee_id?: string;
  current_position?: string;
  target_position_id?: string;
  readiness_level: 'ready_now' | 'ready_1_year' | 'ready_2_years' | 'not_ready';
  skills?: string[];
  performance_rating?: number;
  potential_rating?: number;
  development_needs?: string;
  career_aspirations?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DevelopmentProgram {
  id?: string;
  organization_id?: string;
  program_name: string;
  description?: string;
  participants?: string[];
  duration_months?: number;
  start_date?: string;
  end_date?: string;
  status: 'planning' | 'active' | 'completed' | 'suspended';
  completion_rate?: number;
  budget?: number;
  currency?: string;
  facilitator?: string;
  learning_objectives?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PositionGoal {
  id?: string;
  position_id?: string;
  organization_id?: string;
  goal_type: 'short_term' | 'long_term' | 'strategic';
  title: string;
  description?: string;
  target_date?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  success_metrics?: Array<{ metric: string; target: string; current?: string }>;
  responsible_person?: string;
  budget?: number;
  currency?: string;
  progress?: number;
  milestones?: Array<{ title: string; date: string; completed: boolean }>;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuccessionServiceAPI {
  // Positions CRUD
  getPositions(organizationId?: string): Promise<SuccessionPosition[]>;
  createPosition(position: Omit<SuccessionPosition, 'id' | 'created_at' | 'updated_at'>): Promise<SuccessionPosition>;
  updatePosition(id: string, updates: Partial<SuccessionPosition>): Promise<SuccessionPosition>;
  deletePosition(id: string): Promise<void>;

  // Talent Pool CRUD
  getTalentPool(organizationId?: string): Promise<TalentPoolMember[]>;
  createTalentMember(member: Omit<TalentPoolMember, 'id' | 'created_at' | 'updated_at'>): Promise<TalentPoolMember>;
  updateTalentMember(id: string, updates: Partial<TalentPoolMember>): Promise<TalentPoolMember>;
  deleteTalentMember(id: string): Promise<void>;

  // Development Programs CRUD
  getDevelopmentPrograms(organizationId?: string): Promise<DevelopmentProgram[]>;
  createDevelopmentProgram(program: Omit<DevelopmentProgram, 'id' | 'created_at' | 'updated_at'>): Promise<DevelopmentProgram>;
  updateDevelopmentProgram(id: string, updates: Partial<DevelopmentProgram>): Promise<DevelopmentProgram>;
  deleteDevelopmentProgram(id: string): Promise<void>;

  // Position Goals CRUD
  getPositionGoals(organizationId?: string, positionId?: string): Promise<PositionGoal[]>;
  createPositionGoal(goal: Omit<PositionGoal, 'id' | 'created_at' | 'updated_at'>): Promise<PositionGoal>;
  updatePositionGoal(id: string, updates: Partial<PositionGoal>): Promise<PositionGoal>;
  deletePositionGoal(id: string): Promise<void>;

  // Helper methods
  getCriticalityBadgeVariant(criticality: string): "default" | "secondary" | "destructive" | "outline";
  getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline";
  getReadinessBadgeVariant(readiness: string): "default" | "secondary" | "destructive" | "outline";
  getGoalTypeBadgeVariant(goalType: string): "default" | "secondary" | "destructive" | "outline";
  getGoalStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline";
  formatReadinessText(readiness: string): string;
  formatCriticalityText(criticality: string): string;
  formatStatusText(status: string): string;
  formatGoalTypeText(goalType: string): string;
  formatGoalStatusText(status: string): string;
}