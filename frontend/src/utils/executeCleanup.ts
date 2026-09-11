/**
 * اجرای خودکار پاکسازی داده‌های تستی
 * این فایل برای اجرای یکباره فرآیند پاکسازی استفاده می‌شود
 */

import { executeAdminCleanup, displayCleanupResults } from './adminCleanupHelper';

// تابع اصلی برای اجرای پاکسازی
export async function runCleanup() {
  console.log('\n🚀 شروع فرآیند پاکسازی خودکار داده‌های تستی...\n');
  
  const result = await executeAdminCleanup();
  displayCleanupResults(result);
  
  if (result.success) {
    console.log('\n🎉 پاکسازی کامل شد! داشبورد باید اکنون تمیز باشد.');
    console.log('💡 توصیه: صفحه را reload کنید تا تغییرات اعمال شود.');
    
    // reload خودکار برای نمایش تغییرات
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        console.log('🔄 Reload خودکار صفحه...');
        window.location.reload();
      }, 2000);
    }
  } else {
    console.log('\n❌ پاکسازی با خطا مواجه شد. لطفاً دستورالعمل‌های بالا را مطالعه کنید.');
  }
  
  return result;
}

// اجرای فوری اگر فایل مستقیماً اجرا شود
if (typeof window !== 'undefined' && window.location.search.includes('cleanup=true')) {
  runCleanup().catch(console.error);
}