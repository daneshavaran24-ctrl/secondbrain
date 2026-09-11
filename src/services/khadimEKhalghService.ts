/**
 * خدمات مدیریت داده‌های بخش خادم خلق
 * Khadim-e-Khalgh section data management service
 */

export class KhadimEKhalghService {
  private readonly storageKeys = [
    'roadmap-programs',
    'khk_social_needs', 
    'khk_service_projects',
    'partners'
  ] as const;

  /**
   * پاکسازی کامل تمام داده‌های بخش خادم خلق
   * Complete cleanup of all Khadim-e-Khalgh section data
   */
  cleanupAllData(): { removedKeys: string[]; removedCount: number } {
    const removedKeys: string[] = [];
    let removedCount = 0;

    for (const key of this.storageKeys) {
      try {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          removedKeys.push(key);
          removedCount++;
        }
      } catch (error) {
        console.warn(`Error removing ${key}:`, error);
      }
    }

    console.log(`🧹 پاکسازی خادم خلق: ${removedCount} کلید حذف شد`, removedKeys);
    
    return {
      removedKeys,
      removedCount
    };
  }

  /**
   * بررسی وجود داده‌های تستی
   * Check for existing test data
   */
  hasTestData(): boolean {
    return this.storageKeys.some(key => {
      try {
        const data = localStorage.getItem(key);
        return data && data.length > 2; // more than just "[]"
      } catch {
        return false;
      }
    });
  }

  /**
   * دریافت آمار داده‌های ذخیره شده
   * Get statistics of stored data
   */
  getDataStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    
    for (const key of this.storageKeys) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          stats[key] = Array.isArray(parsed) ? parsed.length : 1;
        } else {
          stats[key] = 0;
        }
      } catch {
        stats[key] = 0;
      }
    }
    
    return stats;
  }
}

// صادرات نمونه واحد
// Export singleton instance
export const khadimEKhalghService = new KhadimEKhalghService();