import { supabase } from '@/integrations/supabase/client';
import { companiesService } from './companiesService';

export interface SidebarStats {
  personalIdeas: number;
  personalPlanning: number;
  personalHealth: number;
  personalJournal: number;
  professionalPlanning: number;
  professionalMeetings: number;
  professionalProjects: number;
  professionalIdeas: number;
  knowledge: number;
  legal: number;
  organizationalIdeas: number;
  organizationalPlanning: number;
  companies: number;
  csrProjects: number;
}

export async function getSidebarStats(): Promise<SidebarStats> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      // Return all zeros if no user is logged in
      return {
        personalIdeas: 0,
        personalPlanning: 0,
        personalHealth: 0,
        personalJournal: 0,
        professionalPlanning: 0,
        professionalMeetings: 0,
        professionalProjects: 0,
        professionalIdeas: 0,
        knowledge: 0,
        legal: 0,
        organizationalIdeas: 0,
        organizationalPlanning: 0,
        companies: 0,
        csrProjects: 0,
      };
    }

    const userId = session.user.id;

    // Get all counts in parallel
    const [
      personalIdeasResult,
      professionalIdeasResult,
      organizationalIdeasResult,
      personalPlanningResult,
      professionalPlanningResult,
      organizationalPlanningResult,
      personalHealthResult,
      personalJournalResult,
      professionalMeetingsResult,
      professionalProjectsResult,
      knowledgeResult,
      legalResult,
      companiesStats,
      csrProjectsResult,
    ] = await Promise.all([
      // Ideas by category
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('category', 'personal'),
      
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('category', 'professional'),
        
      supabase
        .from('ideas')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('category', 'organizational'),

      // Calendar events by domain
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('domain', 'personal'),

      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('domain', 'professional'),

      // Organizational missions
      supabase
        .from('organization_missions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Health events
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('event_type', 'health'),

      // Personal journal entries (could be gratitude or other personal content)
      supabase
        .from('gratitude_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Professional meetings
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('domain', 'professional')
        .eq('event_type', 'meeting'),

      // Professional projects (for now use professional calendar events as proxy)
      supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('domain', 'professional')
        .eq('event_type', 'project'),

      // Knowledge base
      supabase
        .from('knowledge_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Legal cases
      supabase
        .from('legal_cases')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),

      // Companies stats
      companiesService.getCompanyStats(userId),

      // CSR projects
      supabase
        .from('csr_projects')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
    ]);

    return {
      personalIdeas: personalIdeasResult.count || 0,
      personalPlanning: personalPlanningResult.count || 0,
      personalHealth: personalHealthResult.count || 0,
      personalJournal: personalJournalResult.count || 0,
      professionalPlanning: professionalPlanningResult.count || 0,
      professionalMeetings: professionalMeetingsResult.count || 0,
      professionalProjects: professionalProjectsResult.count || 0,
      professionalIdeas: professionalIdeasResult.count || 0,
      knowledge: knowledgeResult.count || 0,
      legal: legalResult.count || 0,
      organizationalIdeas: organizationalIdeasResult.count || 0,
      organizationalPlanning: organizationalPlanningResult.count || 0,
      companies: companiesStats?.active || 0,
      csrProjects: csrProjectsResult.count || 0,
    };
  } catch (error) {
    console.error('Error fetching sidebar stats:', error);
    // Return all zeros on error
    return {
      personalIdeas: 0,
      personalPlanning: 0,
      personalHealth: 0,
      personalJournal: 0,
      professionalPlanning: 0,
      professionalMeetings: 0,
      professionalProjects: 0,
      professionalIdeas: 0,
      knowledge: 0,
      legal: 0,
      organizationalIdeas: 0,
      organizationalPlanning: 0,
      companies: 0,
      csrProjects: 0,
    };
  }
}

export async function getCurrentUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return {
        displayName: 'کاربر مهمان',
        role: 'مهمان',
        avatarUrl: null
      };
    }

    // Try to get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('user_id', session.user.id)
      .single();

    // Get user role
    const { data: role } = await supabase
      .from('user_roles')
      .select('system_role')
      .eq('user_id', session.user.id)
      .single();

    const displayName = profile?.full_name || 
                       session.user.email?.split('@')[0] || 'کاربر';

    const userRole = role?.system_role === 'admin' ? 'مدیر سیستم' : 'کاربر';

    return {
      displayName,
      role: userRole,
      avatarUrl: profile?.avatar_url || null
    };
  } catch (error) {
    console.error('Error fetching current user:', error);
    return {
      displayName: 'کاربر',
      role: 'کاربر',
      avatarUrl: null
    };
  }
}