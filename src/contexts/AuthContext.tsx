import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'; // v2
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentLocalUser, localSignOut, clearUserLocalStorage } from '@/utils/localAuth';
import { fullUserSwitchCleanup, cleanupStaleData } from '@/utils/cacheManager';
import { debugSystemState, forceCleanupAll } from '@/utils/debugUtils';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, SystemRole } from '@/types/user-management';
import { UserManagementService } from '@/services/userManagementService-simple';

interface AuthState {
  user: UserProfile | null;
  role: SystemRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionType: 'local' | 'supabase' | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  debugAuth: () => void;
  forceReset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Get queryClient only when needed, not immediately
  let queryClient: any = null;
  try {
    queryClient = useQueryClient();
  } catch (error) {
    console.warn('QueryClient not available in AuthProvider:', error);
  }
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    sessionType: null
  });

  // پاکسازی داده‌های منقضی شده در شروع
  useEffect(() => {
    cleanupStaleData();
  }, []);

  // بررسی وضعیت احراز هویت
  const checkAuthStatus = useCallback(async () => {
    console.log('🔍 شروع بررسی وضعیت احراز هویت...');
    
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      // Check local auth first (faster)
      const localAuth = getCurrentLocalUser();
      if (localAuth.user && localAuth.session) {
        console.log('✅ کاربر محلی تأیید شد:', localAuth.user.email);
        
        const userProfile: UserProfile = {
          id: localAuth.user.id,
          user_id: localAuth.user.id,
          email: localAuth.user.email,
          display_name: localAuth.user.display_name,
          first_name: localAuth.user.display_name.split(' ')[0] || '',
          last_name: localAuth.user.display_name.split(' ').slice(1).join(' ') || '',
          is_active: true,
          email_verified: true,
          mobile_verified: false,
          created_at: localAuth.user.created_at,
          updated_at: new Date().toISOString(),
          avatar_url: null,
          mobile_phone: '',
          organization_id: null,
          bio: null,
          preferences: {}
        };

        setAuthState({
          user: userProfile,
          role: localAuth.user.role as SystemRole,
          isAuthenticated: true,
          isLoading: false,
          sessionType: 'local'
        });
        return;
      }

      // Check Supabase auth with timeout
      const authPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Auth timeout')), 5000)
      );
      
      const { data } = await Promise.race([authPromise, timeoutPromise]) as any;
      
      if (data?.session?.user) {
        console.log('✅ Session Supabase یافت شد:', data.session.user.email);
        
        setAuthState({
          user: {
            id: data.session.user.id,
            user_id: data.session.user.id,
            email: data.session.user.email || '',
            display_name: data.session.user.user_metadata?.display_name || 
                         data.session.user.email?.split('@')[0] || 'کاربر',
            first_name: data.session.user.user_metadata?.first_name || '',
            last_name: data.session.user.user_metadata?.last_name || '',
            is_active: true,
            email_verified: data.session.user.email_confirmed_at ? true : false,
            mobile_verified: false,
            created_at: data.session.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: data.session.user.user_metadata?.avatar_url || null,
            mobile_phone: data.session.user.user_metadata?.phone || '',
            organization_id: null,
            bio: null,
            preferences: data.session.user.user_metadata || {}
          },
          role: data.session.user.user_metadata?.role || 'user',
          isAuthenticated: true,
          isLoading: false,
          sessionType: 'supabase'
        });
        
        // Defer role fetching to avoid blocking auth flow
        setTimeout(async () => {
          try {
            const userData = await UserManagementService.getCurrentUser();
            if (userData?.role) {
              setAuthState(prev => ({ ...prev, role: userData.role.system_role as SystemRole }));
            }
          } catch (error) {
            console.warn('خطا در دریافت نقش کاربر:', error);
          }
        }, 0);
        return;
      }

      // هیچ احراز هویت معتبری یافت نشد
      console.log('❌ هیچ احراز هویت معتبری یافت نشد');
      setAuthState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        sessionType: null
      });
    } catch (error) {
      console.error('خطا در بررسی وضعیت احراز هویت:', error);
      setAuthState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        sessionType: null
      });
    }
  }, []);

  const performAuthCheck = async () => {
    // ابتدا بررسی احراز هویت محلی
    const localAuth = getCurrentLocalUser();
    if (localAuth.user && localAuth.session) {
      console.log('✅ کاربر محلی تأیید شد:', localAuth.user.email);
      
      // تبدیل کاربر محلی به فرمت UserProfile
      const userProfile: UserProfile = {
        id: localAuth.user.id,
        user_id: localAuth.user.id,
        email: localAuth.user.email,
        display_name: localAuth.user.display_name,
        first_name: localAuth.user.display_name.split(' ')[0] || '',
        last_name: localAuth.user.display_name.split(' ').slice(1).join(' ') || '',
        is_active: true,
        email_verified: true,
        mobile_verified: false,
        created_at: localAuth.user.created_at,
        updated_at: new Date().toISOString(),
        avatar_url: null,
        mobile_phone: '',
        organization_id: null,
        bio: null,
        preferences: {}
      };

      setAuthState({
        user: userProfile,
        role: localAuth.user.role as SystemRole,
        isAuthenticated: true,
        isLoading: false,
        sessionType: 'local'
      });
      return;
    }

    // بررسی احراز هویت Supabase
    const { data } = await supabase.auth.getSession();
    if (data.session && data.session.user) {
      console.log('✅ Session Supabase یافت شد:', data.session.user.email);
      
      try {
        const userData = await UserManagementService.getCurrentUser();
        if (userData?.profile) {
          setAuthState({
            user: userData.profile,
            role: userData.role?.system_role as SystemRole || null,
            isAuthenticated: true,
            isLoading: false,
            sessionType: 'supabase'
          });
          return;
        }
      } catch (error) {
        console.warn('خطا در دریافت اطلاعات کاربر از UserManagementService:', error);
      }
      
      // Fallback: استفاده از اطلاعات پایه session
      console.log('استفاده از اطلاعات پایه session...');
      const basicUserProfile: UserProfile = {
        id: data.session.user.id,
        user_id: data.session.user.id,
        email: data.session.user.email || '',
        display_name: data.session.user.user_metadata?.display_name || 
                     data.session.user.email?.split('@')[0] || 'کاربر',
        first_name: data.session.user.user_metadata?.first_name || '',
        last_name: data.session.user.user_metadata?.last_name || '',
        is_active: true,
        email_verified: data.session.user.email_confirmed_at ? true : false,
        mobile_verified: false,
        created_at: data.session.user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: data.session.user.user_metadata?.avatar_url || null,
        mobile_phone: data.session.user.user_metadata?.phone || '',
        organization_id: null,
        bio: null,
        preferences: data.session.user.user_metadata || {}
      };

      // تعیین نقش از metadata (نقش باید از دیتابیس بررسی شود)
      const userRole: SystemRole = data.session.user.user_metadata?.role || 'user';

      setAuthState({
        user: basicUserProfile,
        role: userRole,
        isAuthenticated: true,
        isLoading: false,
        sessionType: 'supabase'
      });
      return;
    }

    // هیچ احراز هویت معتبری یافت نشد
    console.log('❌ هیچ احراز هویت معتبری یافت نشد');
    setAuthState({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      sessionType: null
    });
  };

  // ورود
  const signIn = async (email: string, password: string) => {
    // این تابع در AuthPage پیاده‌سازی خواهد شد
    // فقط پس از ورود موفق، checkAuthStatus فراخوانی می‌شود
    await checkAuthStatus();
  };

  // خروج
  const signOut = async () => {
    try {
      const currentUserId = authState.user?.id;
      
      // پاکسازی cache سازمان‌ها
      const { organizationService } = await import('@/services/organizationService');
      organizationService.invalidateCache();
      
      // پاکسازی localStorage مربوط به سازمان‌ها
      localStorage.removeItem('main_organization');
      
      // پاکسازی کامل قبل از خروج
      if (currentUserId && queryClient) {
        fullUserSwitchCleanup(queryClient, currentUserId);
      }
      
      if (authState.sessionType === 'local') {
        localSignOut();
      } else if (authState.sessionType === 'supabase') {
        await supabase.auth.signOut();
      }
      
      setAuthState({
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: false,
        sessionType: null
      });
      
      console.log('✅ خروج کامل انجام شد - تمام cache ها و سازمان‌ها پاکسازی شدند');
    } catch (error) {
      console.error('خطا در خروج:', error);
    }
  };

  // بازسازی احراز هویت
  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  // Debug اطلاعات احراز هویت
  const debugAuth = () => {
    console.group('🔍 Debug اطلاعات احراز هویت');
    console.log('وضعیت فعلی:', authState);
    console.log('کاربر:', authState.user);
    console.log('نقش:', authState.role);
    console.log('احراز شده:', authState.isAuthenticated);
    console.log('در حال بارگذاری:', authState.isLoading);
    console.log('نوع جلسه:', authState.sessionType);
    
    // بررسی localStorage
    const localAuth = getCurrentLocalUser();
    console.log('احراز هویت محلی:', localAuth);
    
    if (queryClient) {
      debugSystemState(queryClient);
    }
    console.groupEnd();
  };

  // Reset اجباری
  const forceReset = () => {
    console.log('🔄 شروع Reset اجباری...');
    setAuthState({
      user: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      sessionType: null
    });
    
    if (queryClient) {
      forceCleanupAll(queryClient);
    }
  };

  // بررسی اولیه هنگام بارگذاری
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // گوش دادن به تغییرات session در Supabase
  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener FIRST to catch any immediate changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setAuthState({
          user: {
            id: session.user.id,
            user_id: session.user.id,
            email: session.user.email || '',
            display_name: session.user.user_metadata?.display_name || 
                         session.user.email?.split('@')[0] || 'کاربر',
            first_name: session.user.user_metadata?.first_name || '',
            last_name: session.user.user_metadata?.last_name || '',
            is_active: true,
            email_verified: session.user.email_confirmed_at ? true : false,
            mobile_verified: false,
            created_at: session.user.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            avatar_url: session.user.user_metadata?.avatar_url || null,
            mobile_phone: session.user.user_metadata?.phone || '',
            organization_id: null,
            bio: null,
            preferences: session.user.user_metadata || {}
          },
          role: session.user.user_metadata?.role || 'user',
          isAuthenticated: true,
          isLoading: false,
          sessionType: 'supabase'
        });
        
        // Defer role fetching to avoid blocking auth flow
        setTimeout(async () => {
          if (!mounted) return;
          try {
            const userData = await UserManagementService.getCurrentUser();
            if (mounted && userData?.role) {
              setAuthState(prev => ({ ...prev, role: userData.role.system_role as SystemRole }));
            }
          } catch (error) {
            console.warn('خطا در دریافت نقش کاربر:', error);
          }
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
          sessionType: null
        });
        localStorage.removeItem('localAuth');
      }
    });

    // THEN check for existing session
    checkAuthStatus();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [checkAuthStatus]);

  const contextValue: AuthContextType = {
    ...authState,
    signIn,
    signOut,
    refreshAuth,
    debugAuth,
    forceReset
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
