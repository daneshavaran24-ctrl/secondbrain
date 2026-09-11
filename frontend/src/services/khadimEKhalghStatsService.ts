/**
 * خدمات آمارهای خادم خلق
 * مدیریت آمارهای مخصوص بخش خادم خلق
 */

export interface KhadimEKhalghStats {
  activeProjects: number;
  beneficiaries: number;
  coveredRegions: number;
  activeColleagues: number;
}

class KhadimEKhalghStatsService {
  private cacheKey = 'khadim-e-khalgh-stats-cache';
  private cacheTimestamp = 'khadim-e-khalgh-stats-timestamp';
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  /**
   * دریافت آمارهای خادم خلق
   */
  async getKhadimEKhalghStats(): Promise<KhadimEKhalghStats> {
    try {
      // Check cache first
      const cached = this.getCachedStats();
      if (cached) {
        return cached;
      }

      // Get stats from localStorage (projects, programs, etc.)
      const roadmapPrograms = this.getRoadmapPrograms();
      const activeProjects = roadmapPrograms.filter(p => 
        p.status === 'in-progress' && (p.type === 'project' || p.type === 'campaign')
      ).length;

      // Calculate beneficiaries from active programs
      const beneficiaries = roadmapPrograms
        .filter(p => p.status === 'in-progress')
        .reduce((total, program) => total + (program.targetBeneficiaries || 0), 0);

      // For now, we use placeholder logic for regions and colleagues
      // In a real implementation, these would come from specific data sources
      const coveredRegions = Math.min(5, Math.ceil(activeProjects / 3)); // Estimate regions based on projects
      const activeColleagues = Math.min(24, activeProjects * 2 + beneficiaries / 10); // Estimate colleagues

      const stats: KhadimEKhalghStats = {
        activeProjects,
        beneficiaries,
        coveredRegions,
        activeColleagues: Math.floor(activeColleagues)
      };

      // Cache the results
      this.setCachedStats(stats);

      return stats;
    } catch (error) {
      console.error('Error fetching Khadim E Khalgh stats:', error);
      return this.getEmptyStats();
    }
  }

  /**
   * دریافت برنامه‌های نقشه راه از localStorage
   */
  private getRoadmapPrograms(): any[] {
    try {
      const saved = localStorage.getItem('roadmap-programs');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading roadmap programs:', error);
      return [];
    }
  }

  /**
   * آمارهای خالی برای کاربر جدید
   */
  private getEmptyStats(): KhadimEKhalghStats {
    return {
      activeProjects: 0,
      beneficiaries: 0,
      coveredRegions: 0,
      activeColleagues: 0
    };
  }

  /**
   * دریافت آمارهای کش شده
   */
  private getCachedStats(): KhadimEKhalghStats | null {
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
      console.error('Error reading cached Khadim E Khalgh stats:', error);
      return null;
    }
  }

  /**
   * ذخیره آمارها در کش
   */
  private setCachedStats(stats: KhadimEKhalghStats): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(stats));
      localStorage.setItem(this.cacheTimestamp, Date.now().toString());
    } catch (error) {
      console.error('Error caching Khadim E Khalgh stats:', error);
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
    // Clear roadmap programs as well
    localStorage.removeItem('roadmap-programs');
    console.log('✅ پاکسازی کش آمارهای خادم خلق انجام شد');
  }
}

export const khadimEKhalghStatsService = new KhadimEKhalghStatsService();