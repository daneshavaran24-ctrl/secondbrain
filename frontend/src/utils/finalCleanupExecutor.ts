/**
 * اجرای نهایی پاکسازی کامل سیستم
 */

import { executeCompleteDataCleanup } from './completeDataCleanup';
import { toast } from 'sonner';

export async function executeFinalCleanup(): Promise<void> {
  await executeCompleteDataCleanup();
}

// تابع اجرای خودکار در هنگام بارگیری صفحه
export function autoExecuteCleanupIfRequested(): void {
  // بررسی پارامتر URL برای اجرای خودکار
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('cleanup') === 'final') {
    setTimeout(() => {
      executeFinalCleanup();
      // پاک کردن پارامتر از URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }, 1000);
  }
}