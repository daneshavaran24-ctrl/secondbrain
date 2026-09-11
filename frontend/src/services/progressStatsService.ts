/**
 * سرویس محاسبه آمارهای پیشرفت برای نمودارها
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProgressStats {
  projects: number;
  tasks: number;
  ideas: number;
  meetings: number;
}

export async function getProgressStats(): Promise<ProgressStats> {
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    
    if (!userId) {
      return {
        projects: 0,
        tasks: 0,
        ideas: 0,
        meetings: 0
      };
    }

    // محاسبه تاریخ امروز و هفته جاری
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    // دریافت آمارها به صورت موثر
    const [
      projectsResult,
      completedProjectsResult,
      tasksResult,
      completedTasksResult,
      ideasResult,
      implementedIdeasResult,
      meetingsResult,
      completedMeetingsResult
    ] = await Promise.all([
      // کل پروژه‌ها
      supabase
        .from('organization_missions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // پروژه‌های تکمیل شده
      supabase
        .from('organization_missions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed'),
      
      // کل وظایف (از project_tasks)
      supabase
        .from('project_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId),
      
      // وظایف تکمیل شده
      supabase
        .from('project_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('assigned_to', userId)
        .eq('status', 'done'),
      
      // کل ایده‌ها
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // ایده‌های پیاده‌سازی شده
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'implemented'),
      
      // کل جلسات هفته جاری
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_date', weekStart.toISOString()),
      
      // جلسات تکمیل شده هفته جاری - فعلاً همان تعداد کل
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('start_date', weekStart.toISOString())
    ]);

    // محاسبه درصدها
    const totalProjects = projectsResult.count || 0;
    const completedProjects = completedProjectsResult.count || 0;
    const projectsProgress = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const totalTasks = tasksResult.count || 0;
    const completedTasks = completedTasksResult.count || 0;
    const tasksProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalIdeas = ideasResult.count || 0;
    const implementedIdeas = implementedIdeasResult.count || 0;
    const ideasProgress = totalIdeas > 0 ? Math.round((implementedIdeas / totalIdeas) * 100) : 0;

    const totalMeetings = meetingsResult.count || 0;
    const completedMeetings = completedMeetingsResult.count || 0;
    // فعلاً 50% تخمینی برای جلسات تکمیل شده
    const meetingsProgress = totalMeetings > 0 ? Math.min(50, Math.round((completedMeetings / totalMeetings) * 100)) : 0;

    return {
      projects: projectsProgress,
      tasks: tasksProgress,
      ideas: ideasProgress,
      meetings: meetingsProgress
    };

  } catch (error) {
    console.error('خطا در دریافت آمار پیشرفت:', error);
    return {
      projects: 0,
      tasks: 0,
      ideas: 0,
      meetings: 0
    };
  }
}