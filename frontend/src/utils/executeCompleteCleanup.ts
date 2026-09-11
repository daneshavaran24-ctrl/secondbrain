/**
 * اجرای کامل پاکسازی تمام داده‌های تستی
 */

import { executeCompleteDataCleanup } from './completeDataCleanup';

// تابع اصلی برای اجرای پاکسازی کامل
export async function runCompleteCleanup() {
  console.log('\n🚀 شروع فرآیند پاکسازی کامل تمام داده‌های تستی...\n');
  
  try {
    await executeCompleteDataCleanup();
    console.log('\n🎉 پاکسازی کامل انجام شد! سیستم آماده کاربر جدید است.');
  } catch (error) {
    console.error('\n❌ خطا در پاکسازی کامل:', error);
  }
}

// اجرای فوری اگر فایل مستقیماً اجرا شود
if (typeof window !== 'undefined' && window.location.search.includes('complete_cleanup=true')) {
  runCompleteCleanup().catch(console.error);
}