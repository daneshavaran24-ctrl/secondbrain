/**
 * سرویس داشبورد برای دریافت آمارهای واقعی از Supabase
 */

import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  todayActivities: number;
  activeProjects: number;
  newIdeas: number;
  weeklyMeetings: number;
  activeMissions: number;
  activePolicies: number;
  totalClaims: number;
  totalKnowledgeItems: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // محاسبه تاریخ امروز و هفته جاری
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);

    // دریافت آمارها به صورت موثر - بدون محدودیت user_id برای نمایش کل آمار
    const [
      todayEventsResult,
      ideasResult,
      weeklyEventsResult,
      missionsResult,
      projectsResult,
      policiesResult,
      claimsResult,
      knowledgeResult
    ] = await Promise.all([
      // فعالیت‌های امروز (رویدادهای تقویم)
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .gte('start_date', todayStart.toISOString())
        .lt('start_date', new Date(todayStart.getTime() + 24 * 60 * 60 * 1000).toISOString()),
      
      // ایده‌های جدید (آخرین ۳۰ روز)
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // جلسات هفته جاری
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'meeting')
        .gte('start_date', weekStart.toISOString()),
      
      // ماموریت‌های فعال
      supabase
        .from('organization_missions')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // پروژه‌های فعال
      supabase
        .from('projects')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'completed'),
      
      // سیاست‌های فعال
      supabase
        .from('organization_policies')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active'),
      
      // کل ادعاها
      supabase
        .from('organizational_claims')
        .select('id', { count: 'exact', head: true }),
      
      // آیتم‌های دانش
      supabase
        .from('knowledge_items')
        .select('id', { count: 'exact', head: true })
    ]);

    return {
      todayActivities: todayEventsResult.count || 0,
      activeProjects: projectsResult.count || 0,
      newIdeas: ideasResult.count || 0,
      weeklyMeetings: weeklyEventsResult.count || 0,
      activeMissions: missionsResult.count || 0,
      activePolicies: policiesResult.count || 0,
      totalClaims: claimsResult.count || 0,
      totalKnowledgeItems: knowledgeResult.count || 0
    };

  } catch (error) {
    console.error('خطا در دریافت آمار داشبورد:', error);
    return {
      todayActivities: 0,
      activeProjects: 0,
      newIdeas: 0,
      weeklyMeetings: 0,
      activeMissions: 0,
      activePolicies: 0,
      totalClaims: 0,
      totalKnowledgeItems: 0
    };
  }
}