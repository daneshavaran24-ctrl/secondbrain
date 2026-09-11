
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type OrganizationalMission = Database['public']['Tables']['organization_missions']['Row'];
type OrganizationalMissionInsert = Database['public']['Tables']['organization_missions']['Insert'];
type OrganizationalMissionUpdate = Database['public']['Tables']['organization_missions']['Update'];

export interface MissionWithProgress extends OrganizationalMission {
  expected_progress?: number;
  progress_status?: 'on-track' | 'behind' | 'ahead';
}

export interface MissionStats {
  total: number;
  completed: number;
  active: number;
  delayed: number;
  completionRate: number;
  averageProgress: number;
}

export interface ExportData {
  missions: MissionWithProgress[];
  stats: MissionStats;
  exportDate: string;
}

class OrganizationalMissionService {
  async getMissions(): Promise<MissionWithProgress[]> {
    try {
      const { data, error } = await supabase
        .from('organization_missions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate expected progress and status for each mission
      return (data || []).map(mission => {
        const expectedProgress = this.calculateExpectedProgress(mission);
        const progressStatus = this.getProgressStatus(mission.progress || 0, expectedProgress);
        
        return {
          ...mission,
          expected_progress: expectedProgress,
          progress_status: progressStatus
        };
      });
    } catch (error) {
      console.error('Error fetching missions:', error);
      throw error;
    }
  }

  async getMissionById(id: string): Promise<OrganizationalMission | null> {
    try {
      const { data, error } = await supabase
        .from('organization_missions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching mission:', error);
      return null;
    }
  }

  async createMission(mission: Omit<OrganizationalMissionInsert, 'id' | 'created_at' | 'updated_at'>): Promise<OrganizationalMission> {
    try {
      const { data, error } = await supabase
        .from('organization_missions')
        .insert({
          ...mission,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating mission:', error);
      throw error;
    }
  }

  async updateMission(id: string, updates: OrganizationalMissionUpdate): Promise<OrganizationalMission> {
    try {
      const { data, error } = await supabase
        .from('organization_missions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating mission:', error);
      throw error;
    }
  }

  async deleteMission(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('organization_missions')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting mission:', error);
      throw error;
    }
  }

  // Helper methods
  private calculateExpectedProgress(mission: OrganizationalMission): number {
    if (!mission.end_date) return 0;

    const now = new Date();
    const startDate = new Date(mission.start_date || mission.created_at);
    const endDate = new Date(mission.end_date);
    
    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    
    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;
    
    return Math.round((elapsed / totalDuration) * 100);
  }

  private getProgressStatus(actualProgress: number, expectedProgress: number): 'on-track' | 'behind' | 'ahead' {
    const difference = actualProgress - expectedProgress;
    
    if (difference >= 10) return 'ahead';
    if (difference <= -15) return 'behind';
    return 'on-track';
  }

  async getMissionStats(): Promise<MissionStats> {
    try {
      const missions = await this.getMissions();
      
      const totalMissions = missions.length;
      const completedMissions = missions.filter(m => m.status === 'تکمیل شده').length;
      const activeMissions = missions.filter(m => m.status === 'درحال اجرا').length;
      const delayedMissions = missions.filter(m => m.progress_status === 'behind').length;
      
      const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 0;
      const averageProgress = totalMissions > 0 
        ? Math.round(missions.reduce((sum, m) => sum + (m.progress || 0), 0) / totalMissions)
        : 0;

      return {
        total: totalMissions,
        completed: completedMissions,
        active: activeMissions,
        delayed: delayedMissions,
        completionRate,
        averageProgress
      };
    } catch (error) {
      console.error('Error calculating mission stats:', error);
      return {
        total: 0,
        completed: 0,
        active: 0,
        delayed: 0,
        completionRate: 0,
        averageProgress: 0
      };
    }
  }

  async getCriticalAlerts(thresholds = { delayThreshold: 15, deadlineWarningDays: 7 }) {
    try {
      const missions = await this.getMissions();
      const now = new Date();
      
      return missions
        .filter(mission => {
          // Critical if behind schedule or deadline approaching
          const progressDiff = (mission.progress || 0) - (mission.expected_progress || 0);
          const isDelayed = progressDiff <= -thresholds.delayThreshold;
          const hasNearDeadline = mission.end_date && 
            new Date(mission.end_date).getTime() - now.getTime() < thresholds.deadlineWarningDays * 24 * 60 * 60 * 1000;
          
          return isDelayed || hasNearDeadline;
        })
        .map(mission => ({
          id: mission.id,
          mission: mission.title,
          alert: mission.progress_status === 'behind' 
            ? `عقب‌افتادگی ${Math.abs((mission.progress || 0) - (mission.expected_progress || 0))} درصدی از برنامه`
            : 'نزدیک شدن به ضرب‌الاجل',
          severity: mission.progress_status === 'behind' ? 'high' : 'medium',
          date: new Date().toLocaleDateString('fa-IR')
        }));
    } catch (error) {
      console.error('Error getting critical alerts:', error);
      return [];
    }
  }

  // Progress logging methods - currently not implemented in database
  async getMissionProgressHistory(missionId: string): Promise<any[]> {
    // Return empty array as mission_progress_logs table doesn't exist
    return [];
  }

  async addProgressNote(missionId: string, notes: string): Promise<void> {
    // No-op as mission_progress_logs table doesn't exist
    console.log('Progress note:', notes);
  }

  async exportMissionsData(): Promise<ExportData> {
    try {
      const missions = await this.getMissions();
      const stats = await this.getMissionStats();
      
      return {
        missions,
        stats,
        exportDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error exporting missions data:', error);
      throw error;
    }
  }

  // Real-time subscription methods
  subscribeToMissionChanges(callback: (payload: any) => void) {
    return supabase
      .channel('mission-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_missions'
        },
        callback
      )
      .subscribe();
  }
}

export const organizationalMissionService = new OrganizationalMissionService();
export default organizationalMissionService;
