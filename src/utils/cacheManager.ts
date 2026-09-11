/**
 * ابزارهای مدیریت Cache و LocalStorage
 * برای جلوگیری از مشکلات loading و cache باقی‌مانده
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * پاکسازی کامل React Query Cache
 */
export function clearAllQueryCache(queryClient?: QueryClient) {
    if (queryClient) {
        try {
            queryClient.clear();
            queryClient.getQueryCache().clear();
            queryClient.getMutationCache().clear();

            // Force garbage collection
            queryClient.invalidateQueries();

            console.log('🧹 React Query Cache کاملاً پاکسازی شد');
        } catch (error) {
            console.error('خطا در پاکسازی Query Cache:', error);
        }
    }
}

/**
 * پاکسازی Cache های مرتبط با کاربر خاص
 */
export function clearUserQueryCache(queryClient: QueryClient, userId: string) {
    try {
        // پاکسازی Query های مرتبط با کاربر
        queryClient.removeQueries({
            predicate: (query) => {
                const queryKey = query.queryKey;
                return Array.isArray(queryKey) && queryKey.some(key =>
                    typeof key === 'string' && (
                        key.includes('user') ||
                        key.includes(userId) ||
                        key.includes('profile') ||
                        key.includes('permissions') ||
                        key.includes('auth')
                    )
                );
            }
        });

        // پاکسازی Mutations مرتبط با کاربر
        queryClient.getMutationCache().clear();

        console.log('🧹 Cache های کاربر پاکسازی شد:', userId);
    } catch (error) {
        console.error('خطا در پاکسازی Cache کاربر:', error);
    }
}

/**
 * پاکسازی SessionStorage
 */
export function clearAppSessionStorage() {
    try {
        const keysToRemove: string[] = [];

        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && (
                key.startsWith('brainforge_') ||
                key.includes('react-query') ||
                key.includes('cache_') ||
                key.includes('temp_')
            )) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            try {
                sessionStorage.removeItem(key);
            } catch (error) {
                console.warn(`نمی‌توان کلید sessionStorage ${key} را حذف کرد:`, error);
            }
        });

        console.log(`🧹 SessionStorage پاکسازی شد - ${keysToRemove.length} کلید`);
    } catch (error) {
        console.error('خطا در پاکسازی SessionStorage:', error);
    }
}

/**
 * پاکسازی کامل برای تغییر کاربر
 */
export function fullUserSwitchCleanup(queryClient: QueryClient, currentUserId?: string) {
    try {
        console.log('🧹 شروع پاکسازی کامل برای تغییر کاربر...');

        // پاکسازی LocalStorage
        const keysToRemove: string[] = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('brainforge_cache_') ||
                key.startsWith('brainforge_user_data_') ||
                key.includes('temp') ||
                key.includes('draft') ||
                key.includes('_expires_') ||
                key.includes('react-query')
            )) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`نمی‌توان کلید localStorage ${key} را حذف کرد:`, error);
            }
        });

        // پاکسازی SessionStorage
        clearAppSessionStorage();

        // پاکسازی React Query Cache
        clearAllQueryCache(queryClient);

        // Force refresh memory
        if (typeof window !== 'undefined' && window.gc) {
            window.gc();
        }

        console.log(`🧹 پاکسازی کامل انجام شد - ${keysToRemove.length} کلید localStorage حذف شد`);
    } catch (error) {
        console.error('خطا در پاکسازی کامل:', error);
    }
}

/**
 * بررسی و پاکسازی Stale Data
 */
export function cleanupStaleData() {
    try {
        const now = Date.now();
        const keysToRemove = [];

        // بررسی LocalStorage برای داده‌های منقضی شده
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && key.includes('_expires_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    if (data.expiresAt && now > data.expiresAt) {
                        keysToRemove.push(key);
                    }
                } catch (error) {
                    // اگر parse نشد، احتمالاً corrupt است
                    keysToRemove.push(key);
                }
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));

        if (keysToRemove.length > 0) {
            console.log(`🧹 ${keysToRemove.length} داده منقضی شده پاکسازی شد`);
        }
    } catch (error) {
        console.error('خطا در پاکسازی داده‌های منقضی:', error);
    }
}

/**
 * ایجاد Storage Key با Expiration
 */
export function createExpiringStorageKey(baseKey: string, data: any, expirationMinutes: number = 60) {
    const expirationTime = Date.now() + (expirationMinutes * 60 * 1000);
    const wrappedData = {
        data,
        expiresAt: expirationTime,
        createdAt: Date.now()
    };

    localStorage.setItem(`${baseKey}_expires_${Date.now()}`, JSON.stringify(wrappedData));
}

/**
 * خواندن داده با بررسی انقضا
 */
export function getExpiringStorageData(keyPattern: string) {
    try {
        const now = Date.now();

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes(keyPattern) && key.includes('_expires_')) {
                const data = JSON.parse(localStorage.getItem(key) || '{}');

                if (data.expiresAt && now < data.expiresAt) {
                    return data.data;
                } else {
                    // داده منقضی شده، حذف کن
                    localStorage.removeItem(key);
                }
            }
        }

        return null;
    } catch (error) {
        console.error('خطا در خواندن داده منقضی:', error);
        return null;
    }
}
