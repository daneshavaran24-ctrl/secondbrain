/**
 * ابزارهای Debug برای مشکلات Loading و Cache
 */

/**
 * گزارش وضعیت localStorage
 */
export function debugLocalStorage() {
    const report = {
        totalKeys: localStorage.length,
        brainforgeKeys: [] as string[],
        expiredKeys: [] as string[],
        tempKeys: [] as string[],
        userDataKeys: [] as string[],
        totalSize: 0
    };

    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            const value = localStorage.getItem(key);
            const size = value ? value.length : 0;
            report.totalSize += size;

            if (key.startsWith('brainforge_')) {
                report.brainforgeKeys.push(`${key} (${size} chars)`);
            }

            if (key.includes('_expires_')) {
                try {
                    const data = JSON.parse(value || '{}');
                    if (data.expiresAt && Date.now() > data.expiresAt) {
                        report.expiredKeys.push(key);
                    }
                } catch {
                    report.expiredKeys.push(key);
                }
            }

            if (key.includes('temp_') || key.includes('draft_')) {
                report.tempKeys.push(key);
            }

            if (key.includes('user_data_')) {
                report.userDataKeys.push(key);
            }
        }

        console.group('📊 گزارش وضعیت localStorage');
        console.log('تعداد کل کلیدها:', report.totalKeys);
        console.log('حجم کل:', `${(report.totalSize / 1024).toFixed(2)} KB`);
        console.log('کلیدهای Brainforge:', report.brainforgeKeys);
        console.log('کلیدهای منقضی:', report.expiredKeys);
        console.log('کلیدهای موقت:', report.tempKeys);
        console.log('کلیدهای داده کاربر:', report.userDataKeys);
        console.groupEnd();

        return report;
    } catch (error) {
        console.error('خطا در گزارش localStorage:', error);
        return null;
    }
}

/**
 * گزارش وضعیت React Query Cache
 */
export function debugQueryCache(queryClient: any) {
    if (!queryClient) {
        console.warn('QueryClient برای debug یافت نشد');
        return null;
    }

    try {
        const cache = queryClient.getQueryCache();
        const queries = cache.getAll();

        const report = {
            totalQueries: queries.length,
            activeQueries: queries.filter((q: any) => q.isActive()).length,
            staleQueries: queries.filter((q: any) => q.isStale()).length,
            loadingQueries: queries.filter((q: any) => q.isFetching()).length,
            errorQueries: queries.filter((q: any) => q.isError()).length,
            queryKeys: queries.map((q: any) => ({
                key: q.queryKey,
                state: q.state.status,
                dataUpdatedAt: q.state.dataUpdatedAt,
                errorUpdatedAt: q.state.errorUpdatedAt
            }))
        };

        console.group('📊 گزارش وضعیت React Query Cache');
        console.log('تعداد کل Query:', report.totalQueries);
        console.log('Query های فعال:', report.activeQueries);
        console.log('Query های Stale:', report.staleQueries);
        console.log('Query های در حال بارگذاری:', report.loadingQueries);
        console.log('Query های با خطا:', report.errorQueries);
        console.log('جزئیات Query ها:', report.queryKeys);
        console.groupEnd();

        return report;
    } catch (error) {
        console.error('خطا در گزارش Query Cache:', error);
        return null;
    }
}

/**
 * گزارش کامل وضعیت سیستم
 */
export function debugSystemState(queryClient?: any) {
    console.group('🔍 گزارش کامل وضعیت سیستم');

    // معلومات مرورگر
    console.log('نام مرورگر:', navigator.userAgent);
    console.log('زمان فعلی:', new Date().toISOString());

    // وضعیت localStorage
    debugLocalStorage();

    // وضعیت sessionStorage
    console.log('sessionStorage keys:', sessionStorage.length);
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('brainforge_')) {
            console.log(`sessionStorage: ${key}`);
        }
    }

    // وضعیت React Query
    if (queryClient) {
        debugQueryCache(queryClient);
    }

    console.groupEnd();
}

/**
 * پاکسازی اجباری تمام مشکلات Cache
 */
export function forceCleanupAll(queryClient?: any) {
    console.log('🧹 شروع پاکسازی اجباری...');

    try {
        // پاکسازی localStorage
        const lsKeys: string[] = [];
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('brainforge_') ||
                key.includes('cache') ||
                key.includes('temp') ||
                key.includes('expired') ||
                key.includes('react-query')
            )) {
                lsKeys.push(key);
                localStorage.removeItem(key);
            }
        }

        // پاکسازی sessionStorage
        const ssKeys: string[] = [];
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('brainforge_')) {
                ssKeys.push(key);
                sessionStorage.removeItem(key);
            }
        }

        // پاکسازی React Query
        if (queryClient) {
            queryClient.clear();
            queryClient.getQueryCache().clear();
            queryClient.getMutationCache().clear();
        }

        console.log(`✅ پاکسازی اجباری تمام - ${lsKeys.length} localStorage + ${ssKeys.length} sessionStorage`);

        // Force page reload
        setTimeout(() => {
            window.location.reload();
        }, 100);

    } catch (error) {
        console.error('خطا در پاکسازی اجباری:', error);
    }
}
