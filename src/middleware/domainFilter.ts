import { DomainType } from '@/types/sub-user';

interface SubUserAuth {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    owner_id: string;
    type: 'sub_user';
  };
  permissions: Array<{
    domain: DomainType;
    permissions: string[];
  }>;
  expiresAt: number;
}

/**
 * دریافت اطلاعات احراز هویت Sub-User از localStorage
 */
export const getSubUserAuth = (): SubUserAuth | null => {
  try {
    const authData = localStorage.getItem('subUserAuth');
    if (!authData) return null;

    const auth: SubUserAuth = JSON.parse(authData);

    // بررسی انقضای توکن
    if (auth.expiresAt && auth.expiresAt < Math.floor(Date.now() / 1000)) {
      console.warn('⚠️ Sub-User token has expired');
      localStorage.removeItem('subUserAuth');
      return null;
    }

    return auth;
  } catch (error) {
    console.error('❌ Error parsing sub-user auth:', error);
    return null;
  }
};

/**
 * بررسی دسترسی به domain خاص
 * @param requiredDomain - دامنه مورد نیاز
 * @param requiredPermission - سطح دسترسی مورد نیاز (read, write, delete)
 * @returns true اگر دسترسی وجود داشته باشد
 */
export const checkDomainAccess = (
  requiredDomain: DomainType,
  requiredPermission: 'read' | 'write' | 'delete' = 'read'
): boolean => {
  const auth = getSubUserAuth();
  
  // اگر sub-user نیست (یعنی owner است)، دسترسی کامل دارد
  if (!auth) return true;

  // پیدا کردن دسترسی برای domain مورد نظر
  const domainPermission = auth.permissions.find(p => p.domain === requiredDomain);
  
  if (!domainPermission) {
    console.warn(`⚠️ No permission found for domain: ${requiredDomain}`);
    return false;
  }

  // بررسی وجود permission مورد نیاز
  const hasPermission = domainPermission.permissions.includes(requiredPermission);
  
  if (!hasPermission) {
    console.warn(`⚠️ Missing ${requiredPermission} permission for domain: ${requiredDomain}`);
  }

  return hasPermission;
};

/**
 * دریافت لیست domains که کاربر به آنها دسترسی دارد
 */
export const getAllowedDomains = (): DomainType[] => {
  const auth = getSubUserAuth();
  
  // اگر owner است، به همه دسترسی دارد
  if (!auth) {
    return [
      'calendar',
      'meetings',
      'ideas',
      'knowledge',
      'delegation',
      'reports',
      'health',
      'gratitude',
      'correspondence',
      'csr',
      'legal',
      'business'
    ];
  }

  // برگرداندن لیست domains با دسترسی
  return auth.permissions.map(p => p.domain);
};

/**
 * بررسی اینکه آیا کاربر فعلی Sub-User است یا Owner
 */
export const isSubUser = (): boolean => {
  return getSubUserAuth() !== null;
};

/**
 * دریافت نوع کاربر
 */
export const getUserType = (): 'owner' | 'sub_user' => {
  return isSubUser() ? 'sub_user' : 'owner';
};

/**
 * دریافت اطلاعات کاربر Sub-User
 */
export const getSubUserInfo = () => {
  const auth = getSubUserAuth();
  return auth?.user || null;
};

/**
 * پاکسازی اطلاعات احراز هویت Sub-User
 */
export const clearSubUserAuth = () => {
  localStorage.removeItem('subUserAuth');
};
