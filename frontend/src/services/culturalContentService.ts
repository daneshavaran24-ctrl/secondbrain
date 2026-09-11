/**
 * سرویس مدیریت محتوای فرهنگی
 * Cultural Content Management Service
 */

// کلیدهای localStorage مربوط به محتوای فرهنگی
const CULTURAL_CONTENT_KEYS = [
  'cw_books',
  'cw_articles', 
  'cw_movies',
  'cw_podcasts',
  'cw_audiobooks',
  'cw_theater'
];

class CulturalContentService {
  /**
   * پاکسازی کامل تمام داده‌های محتوای فرهنگی
   */
  cleanupAllData(): void {
    console.log('🎭 پاکسازی داده‌های محتوای فرهنگی...');
    
    let removedCount = 0;
    
    // پاکسازی کلیدهای اختصاصی
    CULTURAL_CONTENT_KEYS.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`   ✓ حذف شد: ${key}`);
      }
    });
    
    // پاکسازی سایر کلیدهای مرتبط با الگوی cw_
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('cw_') && !CULTURAL_CONTENT_KEYS.includes(key)) {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`   ✓ حذف شد (الگو): ${key}`);
        i--; // کاهش اندیس به دلیل تغییر طول آرایه
      }
    }
    
    console.log(`✅ پاکسازی محتوای فرهنگی کامل شد - ${removedCount} آیتم حذف شد`);
  }
  
  /**
   * بررسی وجود داده‌های محتوای فرهنگی
   */
  hasData(): boolean {
    return CULTURAL_CONTENT_KEYS.some(key => localStorage.getItem(key));
  }
  
  /**
   * دریافت آمار داده‌های محتوای فرهنگی
   */
  getDataStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    
    CULTURAL_CONTENT_KEYS.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsedData = JSON.parse(data);
          stats[key] = Array.isArray(parsedData) ? parsedData.length : 1;
        } catch {
          stats[key] = 1;
        }
      } else {
        stats[key] = 0;
      }
    });
    
    return stats;
  }
}

// صادر کردن نمونه واحد
export const culturalContentService = new CulturalContentService();