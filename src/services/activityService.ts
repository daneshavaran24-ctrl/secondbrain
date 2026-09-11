import { supabase } from '@/integrations/supabase/client';

export interface RecentActivity {
  id: string;
  title: string;
  time: string;
  type: 'success' | 'info' | 'warning';
}

export interface TodaysFocusItem {
  id: string;
  title: string;
  description?: string;
  time?: string;
  status: 'pending' | 'completed' | 'in_progress';
  type: 'task' | 'meeting' | 'event';
}

// Get recent activities from various sources
export async function getRecentActivities(): Promise<RecentActivity[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const activities: RecentActivity[] = [];
    
    // Get recent ideas (since personal_planning table doesn't exist yet)
    const { data: recentIdeas } = await supabase
      .from('ideas')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (recentIdeas) {
      recentIdeas.forEach(idea => {
        activities.push({
          id: idea.id,
          title: `ثبت ایده: ${idea.title}`,
          time: getRelativeTime(idea.updated_at),
          type: 'warning'
        });
      });
    }

    // Get recent meetings from calendar
    const { data: recentMeetings } = await supabase
      .from('calendar_events')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .eq('event_type', 'meeting')
      .order('updated_at', { ascending: false })
      .limit(2);

    if (recentMeetings) {
      recentMeetings.forEach(meeting => {
        activities.push({
          id: meeting.id,
          title: `جلسه ${meeting.title}`,
          time: getRelativeTime(meeting.updated_at),
          type: 'info'
        });
      });
    }

    // Get recent legal cases
    const { data: recentCases } = await supabase
      .from('legal_cases')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(2);

    if (recentCases) {
      recentCases.forEach(legalCase => {
        activities.push({
          id: legalCase.id,
          title: `پرونده: ${legalCase.title}`,
          time: getRelativeTime(legalCase.updated_at),
          type: 'info'
        });
      });
    }

    // Sort by time and return max 5 activities
    return activities.slice(0, 5);

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

// Get today's focus items (tasks and meetings for today)
export async function getTodaysFocus(): Promise<TodaysFocusItem[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];
    const focusItems: TodaysFocusItem[] = [];

    // Get today's events from calendar
    const { data: todayEvents } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, event_type')
      .eq('user_id', user.id)
      .gte('start_date', `${today}T00:00:00`)
      .lt('start_date', `${today}T23:59:59`)
      .eq('event_type', 'task')
      .order('start_date', { ascending: true })
      .limit(3);

    if (todayEvents) {
      todayEvents.forEach(event => {
        focusItems.push({
          id: event.id,
          title: event.title,
          description: 'وظیفه امروز',
          status: 'pending',
          type: 'task'
        });
      });
    }

    // Get today's meetings from calendar
    const { data: todayMeetings } = await supabase
      .from('calendar_events')
      .select('id, title, start_date, end_date')
      .eq('user_id', user.id)
      .gte('start_date', `${today}T00:00:00`)
      .lt('start_date', `${today}T23:59:59`)
      .order('start_date', { ascending: true })
      .limit(2);

    if (todayMeetings) {
      todayMeetings.forEach(meeting => {
        const startTime = new Date(meeting.start_date);
        const timeString = startTime.toLocaleTimeString('fa-IR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        focusItems.push({
          id: meeting.id,
          title: meeting.title,
          time: timeString,
          status: startTime < new Date() ? 'completed' : 'pending',
          type: 'meeting'
        });
      });
    }

    return focusItems.slice(0, 5);

  } catch (error) {
    console.error('Error fetching today\'s focus:', error);
    return [];
  }
}

// Helper function to get relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes} دقیقه پیش`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours} ساعت پیش`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days} روز پیش`;
  }
}