/**
 * Hook برای مدیریت Loading States و جلوگیری از Endless Loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLoadingManagerOptions {
  initialLoading?: boolean;
  timeout?: number; // در میلی‌ثانیه
  maxRetries?: number;
}

interface LoadingManagerReturn {
  isLoading: boolean;
  error: string | null;
  retry: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

export function useLoadingManager(options: UseLoadingManagerOptions = {}): LoadingManagerReturn {
  const {
    initialLoading = false,
    timeout = 10000, // 10 ثانیه پیش‌فرض
    maxRetries = 3
  } = options;

  const [isLoading, setIsLoadingState] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // تنظیم timeout برای loading
  const setLoading = useCallback((loading: boolean) => {
    setIsLoadingState(loading);
    setError(null);

    if (loading) {
      // تنظیم timeout
      timeoutRef.current = setTimeout(() => {
        setIsLoadingState(false);
        setError('درخواست منقضی شد. لطفا دوباره تلاش کنید.');
        console.warn('⚠️ Loading timeout reached');
      }, timeout);
    } else {
      // پاکسازی timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  }, [timeout]);

  // تلاش مجدد
  const retry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      setLoading(true);
      console.log(`🔄 Retry attempt ${retryCount + 1}/${maxRetries}`);
    } else {
      setError('حداکثر تعداد تلاش‌ها اتمام یافت. لطفا صفحه را بازیابی کنید.');
    }
  }, [retryCount, maxRetries, setLoading]);

  // بازنشانی وضعیت
  const resetState = useCallback(() => {
    setIsLoadingState(false);
    setError(null);
    setRetryCount(0);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // پاکسازی timeout در unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    retry,
    setLoading,
    setError,
    resetState
  };
}

/**
 * Hook برای مدیریت Data Fetching با Loading Management
 */
export function useDataWithLoading<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseLoadingManagerOptions = {}
) {
  const loadingManager = useLoadingManager(options);
  const [data, setData] = useState<T | null>(null);

  const fetchData = useCallback(async () => {
    try {
      loadingManager.setLoading(true);
      const result = await fetchFunction();
      setData(result);
    } catch (error: any) {
      console.error('خطا در دریافت داده:', error);
      loadingManager.setError(error.message || 'خطا در دریافت اطلاعات');
    } finally {
      loadingManager.setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    ...loadingManager,
    refetch: fetchData
  };
}

/**
 * Hook برای Cache-aware Loading
 */
export function useCacheAwareLoading(cacheKey: string, options: UseLoadingManagerOptions = {}) {
  const loadingManager = useLoadingManager(options);
  
  useEffect(() => {
    // بررسی وجود داده در cache
    const cachedData = localStorage.getItem(`brainforge_cache_${cacheKey}`);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const now = Date.now();
        
        // بررسی انقضا
        if (parsed.expiresAt && now < parsed.expiresAt) {
          console.log('✅ داده از cache بازیابی شد:', cacheKey);
          loadingManager.setLoading(false);
          return;
        } else {
          // داده منقضی شده
          localStorage.removeItem(`brainforge_cache_${cacheKey}`);
        }
      } catch (error) {
        // cache خراب است
        localStorage.removeItem(`brainforge_cache_${cacheKey}`);
      }
    }
    
    // اگر cache نداریم، loading ادامه یابد
    console.log('⚠️ Cache موجود نیست، loading ادامه می‌یابد:', cacheKey);
  }, [cacheKey, loadingManager]);

  return loadingManager;
}
