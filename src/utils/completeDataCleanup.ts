/**
 * پاکسازی کامل تمام داده‌های تستی و hardcoded
 */

import { performCompleteLocalCleanup } from './localStorageCleanup';
import { professionalMeetingService } from '../services/professionalMeetingService';
import { meetingService } from '../services/meetingService';
import { organizationalPlanningService } from '../services/organizationalPlanningService';
import { projectManagementService } from '../services/projectManagementService';
import { secretaryService } from '../services/secretaryService';
import { khadimEKhalghService } from '../services/khadimEKhalghService';
import { culturalContentService } from '../services/culturalContentService';
import { organizationalStatsService } from '../services/organizationalStatsService';
import { khadimEKhalghStatsService } from '../services/khadimEKhalghStatsService';
import { healthService } from '../services/healthService';
import { socialMediaService } from '../services/socialMediaService';
import { toast } from 'sonner';

export async function executeCompleteDataCleanup(): Promise<void> {
  try {
    console.log('🧹 شروع پاکسازی کامل تمام داده‌های تستی...');
    
    // پاکسازی سرویس‌های جلسات
    console.log('🏢 پاکسازی داده‌های جلسات حرفه‌ای...');
    professionalMeetingService.cleanupAllData();
    
    console.log('🏛️ پاکسازی داده‌های جلسات سازمانی...');
    meetingService.cleanupAllData();
    
    console.log('📋 پاکسازی داده‌های برنامه‌ریزی سازمانی...');
    organizationalPlanningService.cleanupAllData();
    
    console.log('🏗️ پاکسازی داده‌های مدیریت پروژه...');
    projectManagementService.cleanupAllData();
    
    console.log('👥 پاکسازی داده‌های دبیرخانه...');
    secretaryService.cleanupAllData();
    
    console.log('🤲 پاکسازی داده‌های بخش خادم خلق...');
    khadimEKhalghService.cleanupAllData();
    
    console.log('🎭 پاکسازی داده‌های محتوای فرهنگی...');
    culturalContentService.cleanupAllData();
    
    console.log('📊 پاکسازی کش آمارهای سازمانی...');
    await organizationalStatsService.cleanupAllData();
    
    console.log('🤲 پاکسازی کش آمارهای خادم خلق...');
    await khadimEKhalghStatsService.cleanupAllData();
    
    console.log('❤️ پاکسازی داده‌های سلامت...');
    await healthService.cleanupAllData();
    
    console.log('📱 پاکسازی داده‌های رسانه‌های اجتماعی...');
    socialMediaService.cleanupAllData();
    
    // Dashboard Service
    console.log('📊 پاکسازی داده‌های داشبورد خادم خلق...');
    try {
      const { khadimEKhalghDashboardService } = await import('../services/khadimEKhalghDashboardService');
      khadimEKhalghDashboardService.cleanup();
    } catch (error) {
      console.warn('Dashboard service cleanup failed:', error);
    }
    
    // Enhanced Gratitude Service
    console.log('🙏 پاکسازی داده‌های شکرگذاری پیشرفته...');
    try {
      const { gratitudeLocalService } = await import('../services/enhancedGratitudeService');
      gratitudeLocalService.cleanup();
    } catch (error) {
      console.warn('Gratitude service cleanup failed:', error);
    }
    
    // مرحله 1: پاکسازی localStorage و sessionStorage
    const storageCleanup = performCompleteLocalCleanup();
    
    // مرحله 2: پاکسازی IndexedDB (اگر استفاده می‌شود)
    try {
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        for (const db of databases) {
          if (db.name && (
            db.name.includes('test') || 
            db.name.includes('demo') || 
            db.name.includes('sample')
          )) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      }
    } catch (error) {
      console.warn('IndexedDB cleanup skipped:', error);
    }
    
    // مرحله 3: پاکسازی Cache API
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          if (cacheName.includes('test') || cacheName.includes('demo')) {
            await caches.delete(cacheName);
          }
        }
      }
    } catch (error) {
      console.warn('Cache cleanup skipped:', error);
    }
    
    // پاکسازی کش آمارهای داشبورد
    localStorage.removeItem('dashboard_stats_cache');
    localStorage.removeItem('progress_stats_cache');
    localStorage.removeItem('recent-activities-cache');
    localStorage.removeItem('todays-focus-cache');
    localStorage.removeItem('delegation-activities-cache');
    localStorage.removeItem('delegation-stats-cache');
    localStorage.removeItem('organizational-stats-cache');
    localStorage.removeItem('organizational-stats-timestamp');
    localStorage.removeItem('khadim-e-khalgh-stats-cache');
    localStorage.removeItem('khadim-e-khalgh-stats-timestamp');
    localStorage.removeItem('roadmap-programs');
    localStorage.removeItem('dashboard-stats-timestamp');
    
    console.log(`✅ پاکسازی کامل انجام شد:`);
    console.log(`   - localStorage: ${storageCleanup.localStorage} آیتم حذف شد`);
    console.log(`   - sessionStorage: ${storageCleanup.sessionStorage} آیتم حذف شد`);
    
    // نمایش پیام موفقیت
    toast.success('🎉 پاکسازی کامل انجام شد - سیستم آماده کاربر جدید است!', {
      description: `${storageCleanup.localStorage + storageCleanup.sessionStorage} آیتم از حافظه حذف شد`
    });
    
    // reload صفحه برای نمایش تغییرات
    setTimeout(() => {
      console.log('🔄 بارگیری مجدد صفحه...');
      window.location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('❌ خطا در پاکسازی کامل:', error);
    toast.error('خطا در پاکسازی کامل');
  }
}

// تابع اجرای خودکار در هنگام بارگیری صفحه
export function autoExecuteCompleteCleanup(): void {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('complete_cleanup') === 'true') {
    setTimeout(() => {
      executeCompleteDataCleanup();
      // پاک کردن پارامتر از URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }, 1000);
  }
}