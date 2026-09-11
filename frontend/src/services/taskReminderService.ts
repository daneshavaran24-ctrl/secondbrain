/**
 * Task Reminder Service
 * Provides notifications and summaries for overdue and pending tasks
 */

import { supabase } from '@/integrations/supabase/client';

export interface OverdueTask {
  id: string;
  title: string;
  due_date: string;
  priority: string;
  days_overdue: number;
}

export interface DailySummary {
  overdue: OverdueTask[];
  dueToday: OverdueTask[];
  upcoming: OverdueTask[];
  totalPending: number;
  hasUrgent: boolean;
}

class TaskReminderService {
  /**
   * Get daily summary of tasks
   */
  async getDailySummary(): Promise<DailySummary> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        overdue: [],
        dueToday: [],
        upcoming: [],
        totalPending: 0,
        hasUrgent: false
      };
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get tasks
    const { data: tasks, error } = await supabase
      .from('delegation_tasks')
      .select('id, title, due_date, priority, status')
      .eq('delegator_id', user.id)
      .neq('status', 'completed')
      .lte('due_date', weekAhead)
      .order('due_date', { ascending: true })
      .limit(50);

    if (error || !tasks) {
      console.error('[TaskReminderService] Error:', error);
      return {
        overdue: [],
        dueToday: [],
        upcoming: [],
        totalPending: 0,
        hasUrgent: false
      };
    }

    const overdue: OverdueTask[] = [];
    const dueToday: OverdueTask[] = [];
    const upcoming: OverdueTask[] = [];
    let hasUrgent = false;

    for (const task of tasks) {
      if (!task.due_date) continue;
      
      const taskDate = task.due_date.split('T')[0];
      const daysOverdue = Math.floor(
        (new Date(today).getTime() - new Date(taskDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      const taskItem: OverdueTask = {
        id: task.id,
        title: task.title,
        due_date: task.due_date,
        priority: task.priority || 'medium',
        days_overdue: daysOverdue > 0 ? daysOverdue : 0
      };

      if (task.priority === 'urgent') hasUrgent = true;

      if (taskDate < today) {
        overdue.push(taskItem);
      } else if (taskDate === today) {
        dueToday.push(taskItem);
      } else {
        upcoming.push(taskItem);
      }
    }

    return {
      overdue,
      dueToday,
      upcoming,
      totalPending: overdue.length + dueToday.length + upcoming.length,
      hasUrgent
    };
  }

  /**
   * Get overdue tasks count for badge
   */
  async getOverdueCount(): Promise<number> {
    const summary = await this.getDailySummary();
    return summary.overdue.length;
  }

  /**
   * Format summary as Persian message
   */
  formatSummaryMessage(summary: DailySummary): string {
    if (summary.totalPending === 0) {
      return '✨ هیچ وظیفه‌ای در انتظار ندارید!';
    }

    const parts: string[] = [];

    if (summary.overdue.length > 0) {
      parts.push(`⚠️ ${summary.overdue.length} کار عقب‌افتاده`);
    }

    if (summary.dueToday.length > 0) {
      parts.push(`📅 ${summary.dueToday.length} کار امروز`);
    }

    if (summary.upcoming.length > 0) {
      parts.push(`🔜 ${summary.upcoming.length} کار این هفته`);
    }

    return parts.join(' • ');
  }

  /**
   * Check if user has overdue tasks (for notifications)
   */
  async hasOverdueTasks(): Promise<boolean> {
    const summary = await this.getDailySummary();
    return summary.overdue.length > 0;
  }

  /**
   * Get notification message for overdue tasks
   */
  async getOverdueNotification(): Promise<string | null> {
    const summary = await this.getDailySummary();
    
    if (summary.overdue.length === 0) return null;

    if (summary.overdue.length === 1) {
      return `⚠️ وظیفه «${summary.overdue[0].title}» عقب افتاده است`;
    }

    return `⚠️ شما ${summary.overdue.length} وظیفه عقب‌افتاده دارید`;
  }
}

export const taskReminderService = new TaskReminderService();
