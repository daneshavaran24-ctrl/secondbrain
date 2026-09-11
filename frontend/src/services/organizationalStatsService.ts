/**
 * خدمات آمارهای سازمانی
 * دریافت آمارهای واقعی از پایگاه داده برای صفحات سازمانی
 */

import { supabase } from '@/integrations/supabase/client';

export interface OrganizationalStats {
  activePolicies: number;
  goalAchievementRate: number;
  criticalPositions: number;
  highRisks: number;
}

class OrganizationalStatsService {
  private cacheKey = 'organizational-stats-cache';
  private cacheTimestamp = 'organizational-stats-timestamp';
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * دریافت آمارهای سازمانی
   */
  async getOrganizationalStats(): Promise<OrganizationalStats> {
    try {
      // Check cache first
      const cached = this.getCachedStats();
      if (cached) {
        return cached;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return this.getEmptyStats();
      }

      // Get user's organization from user_organizations table
      const { data: userOrg } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!userOrg?.organization_id) {
        return this.getEmptyStats();
      }

      const organizationId = userOrg.organization_id;

      // Get active policies count
      const { count: activePolicies } = await supabase
        .from('organization_policies')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('status', 'active');

      // Get total missions and completed missions for goal achievement rate
      const { data: missions } = await supabase
        .from('organization_missions')
        .select('progress, status')
        .eq('organization_id', organizationId);

      let goalAchievementRate = 0;
      if (missions && missions.length > 0) {
        const totalProgress = missions.reduce((sum, mission) => {
          return sum + (mission.progress || 0);
        }, 0);
        goalAchievementRate = Math.round(totalProgress / missions.length);
      }

      // Get critical positions count
      const { count: criticalPositions } = await supabase
        .from('succession_positions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('criticality', 'high');

      // For now, we don't have a risks table, so high risks will be 0
      // This can be updated when risk assessment is fully implemented
      const highRisks = 0;

      const stats: OrganizationalStats = {
        activePolicies: activePolicies || 0,
        goalAchievementRate,
        criticalPositions: criticalPositions || 0,
        highRisks
      };

      // Cache the results
      this.setCachedStats(stats);

      return stats;
    } catch (error) {
      console.error('Error fetching organizational stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * آمارهای خالی برای کاربر جدید
   */
  private getEmptyStats(): OrganizationalStats {
    return {
      activePolicies: 0,
      goalAchievementRate: 0,
      criticalPositions: 0,
      highRisks: 0
    };
  }

  /**
   * دریافت آمارهای کش شده
   */
  private getCachedStats(): OrganizationalStats | null {
    try {
      const timestamp = localStorage.getItem(this.cacheTimestamp);
      const cached = localStorage.getItem(this.cacheKey);

      if (!timestamp || !cached) {
        return null;
      }

      const cacheAge = Date.now() - parseInt(timestamp);
      if (cacheAge > this.cacheTimeout) {
        this.clearCache();
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      console.error('Error reading cached stats:', error);
      return null;
    }
  }

  /**
   * ذخیره آمارها در کش
   */
  private setCachedStats(stats: OrganizationalStats): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(stats));
      localStorage.setItem(this.cacheTimestamp, Date.now().toString());
    } catch (error) {
      console.error('Error caching stats:', error);
    }
  }

  /**
   * پاکسازی کش
   */
  clearCache(): void {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.cacheTimestamp);
  }

  /**
   * پاکسازی کامل داده‌های تستی
   */
  async cleanupAllData(): Promise<void> {
    this.clearCache();
    console.log('✅ پاکسازی کش آمارهای سازمانی انجام شد');
  }
}

export const organizationalStatsService = new OrganizationalStatsService();