/**
 * پاکسازی هدفمند localStorage برای حذف داده‌های تستی
 */

// کلیدهایی که باید حفظ شوند
const PRESERVE_KEYS = [
  'theme',
  'language',
  'admin_credentials',
  'sb-jymajpnwthgqcghmkmam-auth-token',
  'supabase.auth.token'
];

// کلیدهای خاص برای حذف
const SPECIFIC_TEST_KEYS = [
  'khk_social_needs',
  'khk_service_projects',
  'partners',
  'roadmap-programs',
  'meetings',
  'meeting_minutes',
  'meeting_resolutions',
  'professional_meetings_v1',
  'professional_meetings',
  'meeting_tracking_data',
  'legal_cases',
  'legal_meetings',
  'legal_documents',
  'lawyer_notes',
  'risk-assessments',
  'personal_journal',
  'personal_planning_tasks',
  'professional_planning_tasks',
  'organizational_planning_tasks',
  'organizational_planning',
  'organizational_planning_v1',
  'organizational_task_filters',
  'organizational_task_stats',
  'organizational_kanban_data',
  'organizational_scrum_data',
  'secretary_notifications',
  'secretaryNotifications',
  'projectNotifications',
  'project_notifications',
  'ui_notifications',
  'gratitude_entries',
  'personal_tasks',
  'professional_tasks',
  'organizational_tasks',
  'tasks',
  'risks',
  'social_needs',
  'needs',
  'journal_entries',
  'planning_data',
  'user_data',
  'app_data',
  // Cultural content keys
  'cw_books',
  'cw_articles',
  'cw_movies',
  'cw_podcasts',
  'cw_audiobooks',
  'cw_theater',
  // رسانه‌های اجتماعی
  'social_tracking_consent',
  'social_platforms',
  'social_behaviors',
  'social_interests'
];

// الگوهای کلیدهای تستی
const TEST_PATTERNS = [
  /^brainforge_/,
  /^test_/,
  /^demo_/,
  /^sample_/,
  /^mock_/,
  /^temp_/,
  /^debug_/,
  /^legal_/,
  /^meeting/,
  /^professional_meeting/,
  /^organizational_meeting/,
  /^organizational_planning/,
  /^organizational_task/,
  /^organizational_kanban/,
  /^organizational_scrum/,
  /^org_task/,
  /^cw_/,  // Cultural content pattern
  /notification/,
  /^secretary/,
  /^project/,
  /^khk_/,
  /^partners_/,
  /^roadmap_/,
  /^risk/,
  /^planning/,
  /^journal/,
  /^gratitude/,
  /^personal/,
  /^professional/,
  /^organizational/,
  /^social/,
  /^needs/,
  /^tasks/,
  /^entries/,
  /^data/,
  /خیط/,
  /تست/,
  /آزمایش/,
  /نمونه/,
  /حذف/,
  /موقت/,
  /user-drafts/,
  /draft-/,
  /sidebar-stats/,
  /cached-/,
  /_test$/,
  /_demo$/,
  /_sample$/,
  /_temp$/,
  /_v1$/,
  /_tracking$/,
  /^social_/
];

export function cleanupLocalStorage(): number {
  let removedCount = 0;
  
  // دریافت تمام کلیدها
  const allKeys = Object.keys(localStorage);
  
  for (const key of allKeys) {
    // حفظ کلیدهای مهم
    if (PRESERVE_KEYS.includes(key)) {
      continue;
    }
    
    // حذف کلیدهای خاص
    if (SPECIFIC_TEST_KEYS.includes(key)) {
      localStorage.removeItem(key);
      removedCount++;
      continue;
    }
    
    // حذف کلیدهای تستی بر اساس الگو
    const shouldRemove = TEST_PATTERNS.some(pattern => pattern.test(key));
    
    if (shouldRemove) {
      localStorage.removeItem(key);
      removedCount++;
    }
  }
  
  return removedCount;
}

export function cleanupSessionStorage(): number {
  let removedCount = 0;
  
  // دریافت تمام کلیدها
  const allKeys = Object.keys(sessionStorage);
  
  for (const key of allKeys) {
    // حفظ کلیدهای مهم
    if (PRESERVE_KEYS.includes(key)) {
      continue;
    }
    
    // حذف کلیدهای خاص
    if (SPECIFIC_TEST_KEYS.includes(key)) {
      sessionStorage.removeItem(key);
      removedCount++;
      continue;
    }
    
    // حذف کلیدهای تستی بر اساس الگو
    const shouldRemove = TEST_PATTERNS.some(pattern => pattern.test(key));
    
    if (shouldRemove) {
      sessionStorage.removeItem(key);
      removedCount++;
    }
  }
  
  return removedCount;
}

export function performCompleteLocalCleanup(): { localStorage: number; sessionStorage: number } {
  return {
    localStorage: cleanupLocalStorage(),
    sessionStorage: cleanupSessionStorage()
  };
}

// پاکسازی فوری تمام داده‌های تستی موجود
export function immediateFullCleanup(): { localStorage: number; sessionStorage: number; message: string } {
  console.log('🧹 شروع پاکسازی فوری تمام داده‌های تستی...');
  
  const result = performCompleteLocalCleanup();
  
  // پاک کردن تمام کلیدهای مشکوک اضافی
  const suspiciousKeys = Object.keys(localStorage).filter(key => 
    key.includes('task') || 
    key.includes('risk') || 
    key.includes('need') || 
    key.includes('journal') || 
    key.includes('planning') ||
    key.includes('social') ||
    key.includes('khk') ||
    key.includes('data') ||
    key.includes('entries')
  );
  
  suspiciousKeys.forEach(key => {
    if (!PRESERVE_KEYS.includes(key)) {
      localStorage.removeItem(key);
      result.localStorage++;
    }
  });
  
  const message = `✅ پاکسازی فوری کامل: ${result.localStorage + result.sessionStorage} آیتم حذف شد`;
  console.log(message);
  
  return {
    ...result,
    message
  };
}