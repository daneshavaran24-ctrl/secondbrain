/**
 * Helper utility to execute admin cleanup programmatically
 * This simulates the admin panel workflow for data cleanup
 */

import { supabase } from '@/integrations/supabase/client';
import { localSignIn } from '@/utils/localAuth';
import { cleanupService } from '@/services/cleanupService';

export interface CleanupResult {
  success: boolean;
  message: string;
  details?: {
    localStorageItemsRemoved: number;
    supabaseRecordsRemoved: number;
    tablesCleared: string[];
  };
  error?: string;
}

export async function executeAdminCleanup(): Promise<CleanupResult> {
  try {
    console.log('🧹 شروع فرآیند پاکسازی داده‌های تستی...');
    
    // مرحله 1: بررسی محیط توسعه
    const isDev = process.env.NODE_ENV === 'development' || 
                  (typeof window !== 'undefined' && (
                    window.location.hostname === 'localhost' ||
                    window.location.hostname.includes('127.0.0.1')
                  ));
    
    if (!isDev) {
      return {
        success: false,
        message: 'پاکسازی فقط در محیط توسعه مجاز است',
        error: 'غیرقانونی: محیط تولید شناسایی شد'
      };
    }
    console.log('✅ محیط توسعه تأیید شد');

    // مرحله 2: احراز هویت admin
    console.log('🔐 شروع احراز هویت admin...');
    
    // بررسی session موجود
    let isAuthenticated = false;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('system_role')
          .eq('user_id', user.id)
          .single();
        
        if (userRole?.system_role === 'admin') {
          isAuthenticated = true;
          console.log('✅ Admin session موجود تأیید شد');
        }
      }
    } catch (error) {
      console.log('⚠️ هیچ session Supabase فعالی یافت نشد');
    }

    // اگر احراز هویت نشده، ورود محلی
    if (!isAuthenticated) {
      console.log('🔄 تلاش برای ورود محلی...');
      try {
        await localSignIn('admin@brainforge.com', 'Admin123456');
        console.log('✅ ورود محلی admin موفق');
        isAuthenticated = true;
      } catch (error) {
        return {
          success: false,
          message: 'خطا در احراز هویت admin',
          error: `ورود ناموفق: ${error}`
        };
      }
    }

    if (!isAuthenticated) {
      return {
        success: false,
        message: 'دسترسی admin مورد نیاز است',
        error: 'احراز هویت ناموفق'
      };
    }

    // مرحله 3: بررسی آمار داده‌های موجود
    console.log('📊 بررسی داده‌های موجود...');
    const initialStats = await cleanupService.getCleanupStats();
    
    const totalLocalItems = initialStats.localStorageItems;
    const totalSupabaseRecords = Object.values(initialStats.supabaseRecords).reduce((sum, count) => sum + count, 0);
    
    console.log(`📈 آمار فعلی: ${totalLocalItems} آیتم localStorage، ${totalSupabaseRecords} رکورد Supabase`);

    if (totalLocalItems === 0 && totalSupabaseRecords === 0) {
      return {
        success: true,
        message: 'هیچ داده تستی برای پاکسازی یافت نشد',
        details: {
          localStorageItemsRemoved: 0,
          supabaseRecordsRemoved: 0,
          tablesCleared: []
        }
      };
    }

    // مرحله 4: اجرای پاکسازی کامل
    console.log('🧹 شروع پاکسازی کامل...');
    const cleanupResult = await cleanupService.performFullCleanup();

    if (cleanupResult.success) {
      console.log('✅ پاکسازی با موفقیت انجام شد');
      
      // مرحله 5: تأیید نتایج
      const finalStats = await cleanupService.getCleanupStats();
      const finalLocalItems = finalStats.localStorageItems;
      const finalSupabaseRecords = Object.values(finalStats.supabaseRecords).reduce((sum, count) => sum + count, 0);

      return {
        success: true,
        message: 'پاکسازی داده‌های تستی با موفقیت انجام شد',
        details: {
          localStorageItemsRemoved: totalLocalItems - finalLocalItems,
          supabaseRecordsRemoved: totalSupabaseRecords - finalSupabaseRecords,
          tablesCleared: Object.keys(cleanupResult.details?.supabase?.tables || {})
        }
      };
    } else {
      return {
        success: false,
        message: 'خطا در فرآیند پاکسازی',
        error: cleanupResult.details?.supabase?.errors?.[0] || 'خطای نامشخص'
      };
    }

  } catch (error) {
    console.error('❌ خطای کلی در پاکسازی:', error);
    return {
      success: false,
      message: 'خطای غیرمنتظره در فرآیند پاکسازی',
      error: String(error)
    };
  }
}

/**
 * تابع کمکی برای نمایش نتایج پاکسازی
 */
export function displayCleanupResults(result: CleanupResult): void {
  console.log('\n🏁 نتایج پاکسازی:');
  console.log(`✨ وضعیت: ${result.success ? 'موفق' : 'ناموفق'}`);
  console.log(`📝 پیام: ${result.message}`);
  
  if (result.details) {
    console.log(`🗂️ آیتم‌های localStorage حذف شده: ${result.details.localStorageItemsRemoved}`);
    console.log(`🗄️ رکوردهای Supabase حذف شده: ${result.details.supabaseRecordsRemoved}`);
    console.log(`📊 جداول پاک شده: ${result.details.tablesCleared.join(', ')}`);
  }
  
  if (result.error) {
    console.log(`❌ خطا: ${result.error}`);
  }
}