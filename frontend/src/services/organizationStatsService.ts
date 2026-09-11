import { supabase } from '@/integrations/supabase/client';

export interface OrganizationStats {
  totalMembers: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  completedTasks: number;
  totalMeetings: number;
  upcomingMeetings: number;
  completionRate: number;
  averageResponseTime: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface ActivityLog {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
}

class OrganizationStatsService {
  async getOrganizationStats(organizationId: string): Promise<OrganizationStats> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get member count
      const { count: memberCount } = await supabase
        .from('user_organizations')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      // Get projects count (using ideas table with organizational domain)
      const { count: totalProjects } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('domain', 'organizational');

      const { count: activeProjects } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('domain', 'organizational')
        .in('status', ['in_progress', 'new']);

      const { count: completedProjects } = await supabase
        .from('ideas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('domain', 'organizational')
        .eq('status', 'completed');

      // Get delegation tasks
      const { count: totalTasks } = await supabase
        .from('delegation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('delegator_id', user.id);

      const { count: completedTasks } = await supabase
        .from('delegation_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('delegator_id', user.id)
        .eq('status', 'completed');

      // Get meetings (calendar events with organizational domain)
      const { count: totalMeetings } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('domain', 'organizational');

      const { count: upcomingMeetings } = await supabase
        .from('calendar_events')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('domain', 'organizational')
        .gte('start_date', new Date().toISOString());

      const completionRate = (totalProjects || 0) > 0 
        ? Math.round(((completedProjects || 0) / (totalProjects || 0)) * 100) 
        : 0;

      return {
        totalMembers: memberCount || 0,
        totalProjects: totalProjects || 0,
        activeProjects: activeProjects || 0,
        completedProjects: completedProjects || 0,
        totalTasks: totalTasks || 0,
        completedTasks: completedTasks || 0,
        totalMeetings: totalMeetings || 0,
        upcomingMeetings: upcomingMeetings || 0,
        completionRate,
        averageResponseTime: 24,
      };
    } catch (error) {
      console.error('Error fetching organization stats:', error);
      return {
        totalMembers: 0,
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalMeetings: 0,
        upcomingMeetings: 0,
        completionRate: 0,
        averageResponseTime: 0,
      };
    }
  }

  async getProjectsChartData(organizationId: string): Promise<ChartData[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: projects } = await supabase
        .from('ideas')
        .select('status')
        .eq('user_id', user.id)
        .eq('domain', 'organizational');

      if (!projects) return [];

      const statusCount = projects.reduce((acc, project) => {
        const status = project.status || 'new';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusLabels: Record<string, string> = {
        'new': 'جدید',
        'in_progress': 'در حال انجام',
        'completed': 'تکمیل شده',
        'on_hold': 'متوقف شده',
        'cancelled': 'لغو شده'
      };

      return Object.entries(statusCount).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count
      }));
    } catch (error) {
      console.error('Error fetching projects chart data:', error);
      return [];
    }
  }

  async getRecentActivities(organizationId: string, limit: number = 10): Promise<ActivityLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get recent organizational activities
      const activities: ActivityLog[] = [];

      // Recent projects
      const { data: recentProjects } = await supabase
        .from('ideas')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('domain', 'organizational')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentProjects) {
        recentProjects.forEach(project => {
          activities.push({
            id: project.id,
            type: 'project',
            description: `پروژه "${project.title}" به‌روزرسانی شد`,
            timestamp: project.updated_at
          });
        });
      }

      // Recent tasks
      const { data: recentTasks } = await supabase
        .from('delegation_tasks')
        .select('id, title, updated_at')
        .eq('delegator_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);

      if (recentTasks) {
        recentTasks.forEach(task => {
          activities.push({
            id: task.id,
            type: 'task',
            description: `وظیفه "${task.title}" به‌روزرسانی شد`,
            timestamp: task.updated_at
          });
        });
      }

      // Sort by timestamp and limit
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }
}

export const organizationStatsService = new OrganizationStatsService();
