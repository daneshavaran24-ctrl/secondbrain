import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  description?: string;
  category: string;
  color: string;
  target_days: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  archived_at?: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completed: boolean;
  notes?: string;
  completed_at: string;
}

export interface HabitStreak {
  id: string;
  habit_id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completion_date?: string;
  updated_at: string;
}

export interface HabitSettings {
  id: string;
  user_id: string;
  notification_enabled: boolean;
  notification_time: string;
  theme: string;
  start_of_week: number;
  created_at: string;
  updated_at: string;
}

export interface MonthlyStats {
  totalHabits: number;
  totalCompletions: number;
  totalPossible: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  bestDay?: { date: string; count: number };
  worstDay?: { date: string; count: number };
  dailyProgress: { date: string; completed: number; total: number; percentage: number }[];
}

export const habitTrackerService = {
  // ===== Habits CRUD =====
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createHabit(habit: Omit<Habit, 'id' | 'created_at' | 'updated_at'>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .insert(habit)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHabit(id: string, updates: Partial<Habit>): Promise<Habit> {
    const { data, error } = await supabase
      .from('habits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async archiveHabit(id: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .update({ archived_at: new Date().toISOString(), is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  async reorderHabits(habitIds: string[]): Promise<void> {
    const updates = habitIds.map((id, index) => ({ id, sort_order: index }));
    
    for (const update of updates) {
      await supabase
        .from('habits')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }
  },

  // ===== Completions =====
  async toggleCompletion(habitId: string, userId: string, date: string): Promise<HabitCompletion> {
    // Check if completion exists
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('completion_date', date)
      .maybeSingle();

    if (existing) {
      // Toggle existing
      const { data, error } = await supabase
        .from('habit_completions')
        .update({ completed: !existing.completed })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: userId,
          completion_date: date,
          completed: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  async getCompletionsForMonth(userId: string, year: number, month: number): Promise<HabitCompletion[]> {
    const startDate = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('completion_date', startDate)
      .lte('completion_date', endDate);

    if (error) throw error;
    return data || [];
  },

  async getCompletionsForDate(userId: string, date: string): Promise<HabitCompletion[]> {
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('completion_date', date);

    if (error) throw error;
    return data || [];
  },

  // ===== Streaks =====
  async getStreaks(userId: string): Promise<HabitStreak[]> {
    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async getStreakForHabit(habitId: string, userId: string): Promise<HabitStreak | null> {
    const { data, error } = await supabase
      .from('habit_streaks')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // ===== Statistics =====
  async getMonthlyStats(userId: string, year: number, month: number): Promise<MonthlyStats> {
    const habits = await this.getHabits(userId);
    const completions = await this.getCompletionsForMonth(userId, year, month);
    const streaks = await this.getStreaks(userId);

    const start = startOfMonth(new Date(year, month - 1));
    const end = endOfMonth(new Date(year, month - 1));
    const daysInMonth = end.getDate();

    const totalHabits = habits.length;
    const totalPossible = totalHabits * daysInMonth;
    const totalCompletions = completions.filter(c => c.completed).length;
    const completionRate = totalPossible > 0 ? (totalCompletions / totalPossible) * 100 : 0;

    // Calculate current and longest streaks
    const currentStreak = Math.max(...streaks.map(s => s.current_streak), 0);
    const longestStreak = Math.max(...streaks.map(s => s.longest_streak), 0);

    // Calculate daily progress
    const dailyProgress = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(year, month - 1, day), 'yyyy-MM-dd');
      const dayCompletions = completions.filter(
        c => c.completion_date === date && c.completed
      ).length;
      dailyProgress.push({
        date,
        completed: dayCompletions,
        total: totalHabits,
        percentage: totalHabits > 0 ? (dayCompletions / totalHabits) * 100 : 0,
      });
    }

    // Find best and worst days
    const sortedDays = [...dailyProgress].sort((a, b) => b.completed - a.completed);
    const bestDay = sortedDays[0];
    const worstDay = sortedDays[sortedDays.length - 1];

    return {
      totalHabits,
      totalCompletions,
      totalPossible,
      completionRate,
      currentStreak,
      longestStreak,
      bestDay: bestDay ? { date: bestDay.date, count: bestDay.completed } : undefined,
      worstDay: worstDay ? { date: worstDay.date, count: worstDay.completed } : undefined,
      dailyProgress,
    };
  },

  // ===== Settings =====
  async getSettings(userId: string): Promise<HabitSettings | null> {
    const { data, error } = await supabase
      .from('habit_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateSettings(userId: string, settings: Partial<HabitSettings>): Promise<HabitSettings> {
    const { data, error } = await supabase
      .from('habit_settings')
      .upsert({ user_id: userId, ...settings })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ===== Initialization =====
  async initializeDefaultHabits(userId: string): Promise<void> {
    const { error } = await supabase.rpc('create_default_habits', {
      p_user_id: userId,
    });

    if (error) throw error;
  },
};
