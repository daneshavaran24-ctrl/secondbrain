/**
 * ⚠️ SECURITY WARNING - DEVELOPMENT ONLY ⚠️
 * 
 * سیستم احراز هویت محلی (بدون Supabase)
 * این سیستم کاملاً offline کار می‌کند و فقط برای development استفاده می‌شود
 * 
 * ⛔ DO NOT USE IN PRODUCTION ⛔
 * 
 * Security Limitations:
 * - Credentials stored in localStorage (can be manipulated via DevTools)
 * - No server-side session validation
 * - Roles and permissions are client-side only and untrusted
 * - Session expiry is not enforced by server
 * 
 * For production:
 * - Use Supabase authentication exclusively
 * - Enforce all authorization via RLS policies
 * - Never trust client-supplied role/permission data
 * 
 * @deprecated This module should only be used for local development/testing.
 * All production authentication must use Supabase auth with server-side validation.
 */

// ⛔ PRODUCTION GUARD - Block all functionality and credentials in production
const IS_PRODUCTION = typeof window !== 'undefined' && (
  import.meta.env.PROD ||
  import.meta.env.MODE === 'production' ||
  window.location.hostname.includes('lovableproject.com') ||
  window.location.hostname.includes('lovable.dev') ||
  (!window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1'))
);

function throwProductionError(functionName: string): never {
  throw new Error(
    `${functionName} is disabled in production. ` +
    'All authentication must use Supabase auth with server-side validation.'
  );
}

// Log warning on module load in development only
if (typeof window !== 'undefined' && !IS_PRODUCTION) {
  console.warn(
    '⚠️ localAuth.ts loaded - This is for development only. ' +
    'Do not use in production. Use Supabase authentication instead.'
  );
}

interface LocalUser {
  id: string;
  email: string;
  password: string;
  display_name: string;
  role: string;
  created_at: string;
}

const LOCAL_STORAGE_KEYS = {
  USERS: 'brainforge_local_users',
  CURRENT_USER: 'brainforge_current_user',
  SESSION: 'brainforge_session',
  USER_DATA_PREFIX: 'brainforge_user_data_',
  CACHE_PREFIX: 'brainforge_cache_'
};

// کاربران پیش‌فرض - DEVELOPMENT ONLY (not bundled in production due to tree shaking)
const getDefaultUsers = (): LocalUser[] => {
  if (IS_PRODUCTION) return [];
  return [
    {
      id: 'admin-001',
      email: 'admin@brainforge.com',
      password: 'Admin123456',
      display_name: 'مدیر سیستم',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-002',
      email: 'admin.brainforge@gmail.com',
      password: 'Admin123456',
      display_name: 'مدیر سیستم Gmail',
      role: 'admin',
      created_at: new Date().toISOString()
    },
    {
      id: 'admin-003',
      email: 'admin@example.com',
      password: 'Admin123456',
      display_name: 'مدیر سیستم Example',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ];
};

/**
 * مقدار دهی اولیه سیستم احراز هویت محلی
 */
export function initializeLocalAuth(): boolean {
  if (IS_PRODUCTION) throwProductionError('initializeLocalAuth');
  
  try {
    const existingUsers = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);

    if (!existingUsers) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(getDefaultUsers()));
      console.log('✅ کاربران پیش‌فرض ایجاد شدند');
    }

    return true;
  } catch (error) {
    console.error('خطا در مقدار دهی اولیه:', error);
    return false;
  }
}

/**
 * ورود محلی
 */
export async function localSignIn(email: string, password: string) {
  if (IS_PRODUCTION) {
    return { success: false, error: 'Local auth disabled in production' };
  }
  
  try {
    console.log('🔐 تلاش برای ورود محلی:', email);

    initializeLocalAuth();

    const usersData = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    if (!usersData) {
      throw new Error('کاربرانی یافت نشد');
    }

    const users: LocalUser[] = JSON.parse(usersData);
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      throw new Error('ایمیل یا رمز عبور اشتباه است');
    }

    // ایجاد session
    const session = {
      user: user,
      token: `local_token_${user.id}_${Date.now()}`,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 ساعت
    };

    localStorage.setItem(LOCAL_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(LOCAL_STORAGE_KEYS.SESSION, JSON.stringify(session));

    console.log('✅ ورود محلی موفق:', user.email);

    return {
      success: true,
      user: user,
      session: session
    };

  } catch (error: any) {
    console.error('❌ خطا در ورود محلی:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ثبت‌نام محلی
 */
export async function localSignUp(email: string, password: string, displayName: string = 'کاربر جدید') {
  if (IS_PRODUCTION) {
    return { success: false, error: 'Local auth disabled in production' };
  }
  
  try {
    console.log('📝 ثبت‌نام محلی:', email);

    initializeLocalAuth();

    const usersData = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    const users: LocalUser[] = usersData ? JSON.parse(usersData) : [];

    // بررسی وجود کاربر
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      console.log('⚠️ کاربر از قبل وجود دارد، تلاش برای ورود...');
      return await localSignIn(email, password);
    }

    // ایجاد کاربر جدید
    const newUser: LocalUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email,
      password: password,
      display_name: displayName,
      role: 'admin', // همه کاربران جدید admin می‌شوند
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEYS.USERS, JSON.stringify(users));

    console.log('✅ کاربر جدید ایجاد شد:', newUser.id);

    // ورود خودکار
    return await localSignIn(email, password);

  } catch (error: any) {
    console.error('❌ خطا در ثبت‌نام محلی:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * دریافت کاربر فعلی
 */
export function getCurrentLocalUser() {
  // Safe to call in production - just returns null
  if (IS_PRODUCTION) {
    return { user: null, session: null };
  }
  
  try {
    const userData = localStorage.getItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    const sessionData = localStorage.getItem(LOCAL_STORAGE_KEYS.SESSION);

    if (!userData || !sessionData) {
      return { user: null, session: null };
    }

    const user = JSON.parse(userData);
    const session = JSON.parse(sessionData);

    // بررسی انقضای session
    if (new Date(session.expires_at) < new Date()) {
      console.log('⚠️ Session منقضی شده');
      localSignOut();
      return { user: null, session: null };
    }

    return { user, session };

  } catch (error) {
    console.error('خطا در دریافت کاربر فعلی:', error);
    return { user: null, session: null };
  }
}

/**
 * خروج محلی
 */
export function localSignOut(): boolean {
  // Safe to call in production - just returns true
  if (IS_PRODUCTION) {
    return true;
  }
  
  try {
    // پاکسازی localStorage کاربر فعلی قبل از خروج
    clearUserLocalStorage();

    localStorage.removeItem(LOCAL_STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
    console.log('✅ خروج موفق - localStorage پاکسازی شد');
    return true;
  } catch (error) {
    console.error('خطا در خروج:', error);
    return false;
  }
}

/**
 * ایجاد کاربر ادمین اضطراری
 */
export async function createEmergencyAdmin() {
  if (IS_PRODUCTION) {
    return { success: false, error: 'Local auth disabled in production' };
  }
  
  const emergencyEmail = `emergency_admin_${Date.now()}@local.com`;
  const emergencyPassword = 'EmergencyAdmin123!';

  console.log('🚨 ایجاد کاربر ادمین اضطراری...');

  const result = await localSignUp(emergencyEmail, emergencyPassword, 'ادمین اضطراری');

  if (result.success) {
    console.log('✅ کاربر ادمین اضطراری ایجاد شد:', emergencyEmail);
    // نمایش اطلاعات برای کاربر
    alert(`کاربر ادمین اضطراری ایجاد شد:\n\nایمیل: ${emergencyEmail}\nرمز عبور: ${emergencyPassword}\n\nاین اطلاعات را یادداشت کنید!`);
  }

  return result;
}

/**
 * پاکسازی اطلاعات کاربر فعلی از localStorage
 */
export function clearUserLocalStorage(_userId?: string): void {
  // Safe to call in production - just does nothing
  if (IS_PRODUCTION) {
    return;
  }
  
  try {
    console.log('🧹 شروع پاکسازی localStorage...');

    const keysToRemove: string[] = [];

    // جمع‌آوری تمام کلیدهای مربوط به برنامه
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('brainforge_') ||
        key.includes('_expires_') ||
        key.includes('temp_') ||
        key.includes('draft_') ||
        key.includes('cache_') ||
        key.includes('user_data_')
      )) {
        keysToRemove.push(key);
      }
    }

    // حذف کلیدها
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`نمی‌توان کلید ${key} را حذف کرد:`, error);
      }
    });

    // پاکسازی sessionStorage نیز
    try {
      const sessionKeysToRemove: string[] = [];
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('brainforge_')) {
          sessionKeysToRemove.push(key);
        }
      }
      sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log(`🧹 ${sessionKeysToRemove.length} کلید از sessionStorage پاکسازی شد`);
    } catch (error) {
      console.warn('خطا در پاکسازی sessionStorage:', error);
    }

    console.log(`🧹 ${keysToRemove.length} کلید از localStorage پاکسازی شد`);

    // فورس پاکسازی DOM storage events
    window.dispatchEvent(new StorageEvent('storage', {
      key: null,
      oldValue: null,
      newValue: null,
      storageArea: localStorage
    }));

  } catch (error) {
    console.error('خطا در پاکسازی localStorage:', error);
  }
}

/**
 * پاکسازی کامل localStorage مرتبط با برنامه
 */
export function clearAllAppLocalStorage(): void {
  // Safe to call in production - just does nothing
  if (IS_PRODUCTION) {
    return;
  }
  
  try {
    const keysToRemove: string[] = [];

    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith('brainforge_')) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`🧹 پاکسازی کامل localStorage - ${keysToRemove.length} کلید حذف شد`);

  } catch (error) {
    console.error('خطا در پاکسازی کامل localStorage:', error);
  }
}

/**
 * ایجاد کلید منحصربفرد برای ذخیره داده‌های کاربر
 */
export function createUserStorageKey(userId: string, dataType: string): string {
  return `${LOCAL_STORAGE_KEYS.USER_DATA_PREFIX}${userId}_${dataType}`;
}

/**
 * لیست تمام کاربران (برای debug)
 */
export function listAllLocalUsers(): any[] {
  // Safe to call in production - just returns empty array
  if (IS_PRODUCTION) {
    return [];
  }
  
  try {
    const usersData = localStorage.getItem(LOCAL_STORAGE_KEYS.USERS);
    if (!usersData) {
      return [];
    }

    const users: LocalUser[] = JSON.parse(usersData);
    console.table(users.map(u => ({
      id: u.id,
      email: u.email,
      display_name: u.display_name,
      role: u.role
    })));

    return users;
  } catch (error) {
    console.error('خطا در نمایش کاربران:', error);
    return [];
  }
}
