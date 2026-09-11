import { toast } from "sonner";

export interface ProfessionalCompanyGoal {
  id: string;
  company_id: string;
  user_id: string;
  goal_type: 'short_term' | 'long_term' | 'strategic';
  title: string;
  description?: string;
  target_date?: string;
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  success_metrics?: Array<{ metric: string; target: string; current?: string }>;
  responsible_person?: string;
  budget?: number;
  currency?: string;
  progress: number;
  roi_target?: number;
  actual_roi?: number;
  market_strategy?: string;
  competitive_advantage?: string;
  risk_assessment?: Array<{ risk: string; severity: string; mitigation: string }>;
  milestones?: Array<{ title: string; date: string; completed: boolean }>;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const GOAL_TYPES = {
  short_term: { label: 'کوتاه‌مدت (۳-۶ ماه)', color: 'bg-blue-500', icon: '📅' },
  long_term: { label: 'بلندمدت (۱-۳ سال)', color: 'bg-purple-500', icon: '🎯' },
  strategic: { label: 'استراتژیک (۳+ سال)', color: 'bg-amber-500', icon: '🚀' },
};

export const GOAL_STATUS = {
  planning: { label: 'برنامه‌ریزی', color: 'bg-gray-500' },
  in_progress: { label: 'در حال اجرا', color: 'bg-blue-500' },
  completed: { label: 'تکمیل شده', color: 'bg-green-500' },
  cancelled: { label: 'لغو شده', color: 'bg-red-500' },
  on_hold: { label: 'متوقف', color: 'bg-yellow-500' },
};

export const GOAL_PRIORITY = {
  low: { label: 'پایین', color: 'bg-gray-400' },
  medium: { label: 'متوسط', color: 'bg-blue-400' },
  high: { label: 'بالا', color: 'bg-orange-400' },
  critical: { label: 'حیاتی', color: 'bg-red-500' },
};

const STORAGE_KEY = 'professional_company_goals';

function getGoalsFromStorage(): ProfessionalCompanyGoal[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading goals from localStorage:', error);
    return [];
  }
}

function saveGoalsToStorage(goals: ProfessionalCompanyGoal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  } catch (error) {
    console.error('Error saving goals to localStorage:', error);
  }
}

export const professionalGoalsService = {
  async getCompanyGoals(companyId: string): Promise<ProfessionalCompanyGoal[]> {
    try {
      const allGoals = getGoalsFromStorage();
      return allGoals.filter(g => g.company_id === companyId);
    } catch (error) {
      console.error('Error fetching company goals:', error);
      toast.error('خطا در بارگذاری اهداف شرکت');
      return [];
    }
  },

  async addGoal(goal: Omit<ProfessionalCompanyGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ProfessionalCompanyGoal | null> {
    try {
      const newGoal: ProfessionalCompanyGoal = {
        ...goal,
        id: crypto.randomUUID(),
        user_id: 'current-user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const goals = getGoalsFromStorage();
      goals.push(newGoal);
      saveGoalsToStorage(goals);

      toast.success('هدف با موفقیت افزوده شد');
      return newGoal;
    } catch (error) {
      console.error('Error adding goal:', error);
      toast.error('خطا در افزودن هدف');
      return null;
    }
  },

  async updateGoal(goalId: string, updates: Partial<ProfessionalCompanyGoal>): Promise<boolean> {
    try {
      const goals = getGoalsFromStorage();
      const index = goals.findIndex(g => g.id === goalId);
      
      if (index === -1) {
        toast.error('هدف یافت نشد');
        return false;
      }

      goals[index] = {
        ...goals[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      saveGoalsToStorage(goals);
      toast.success('هدف با موفقیت به‌روزرسانی شد');
      return true;
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('خطا در به‌روزرسانی هدف');
      return false;
    }
  },

  async deleteGoal(goalId: string): Promise<boolean> {
    try {
      const goals = getGoalsFromStorage();
      const filtered = goals.filter(g => g.id !== goalId);
      saveGoalsToStorage(filtered);

      toast.success('هدف با موفقیت حذف شد');
      return true;
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('خطا در حذف هدف');
      return false;
    }
  },

  async getGoalStats(companyId: string): Promise<{
    total: number;
    by_status: Record<string, number>;
    by_priority: Record<string, number>;
    by_type: Record<string, number>;
    average_progress: number;
  }> {
    try {
      const goals = await this.getCompanyGoals(companyId);
      
      const stats = {
        total: goals.length,
        by_status: {} as Record<string, number>,
        by_priority: {} as Record<string, number>,
        by_type: {} as Record<string, number>,
        average_progress: 0,
      };

      if (goals.length === 0) return stats;

      // Count by status
      goals.forEach(goal => {
        stats.by_status[goal.status] = (stats.by_status[goal.status] || 0) + 1;
        stats.by_priority[goal.priority] = (stats.by_priority[goal.priority] || 0) + 1;
        stats.by_type[goal.goal_type] = (stats.by_type[goal.goal_type] || 0) + 1;
      });

      // Calculate average progress
      const totalProgress = goals.reduce((sum, goal) => sum + (goal.progress || 0), 0);
      stats.average_progress = Math.round(totalProgress / goals.length);

      return stats;
    } catch (error) {
      console.error('Error getting goal stats:', error);
      return {
        total: 0,
        by_status: {},
        by_priority: {},
        by_type: {},
        average_progress: 0,
      };
    }
  },
};
