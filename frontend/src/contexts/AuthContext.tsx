import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  apiGetMe,
  apiLogout,
  getAccessToken,
  getStoredUser,
  clearTokens,
  AuthUser,
} from '@/lib/api';
import { fullUserSwitchCleanup, cleanupStaleData } from '@/utils/cacheManager';
import { debugSystemState, forceCleanupAll } from '@/utils/debugUtils';
import { UserProfile, SystemRole } from '@/types/user-management';

interface AuthState {
  user: UserProfile | null;
  role: SystemRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionType: 'backend' | null;
}

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  debugAuth: () => void;
  forceReset: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function apiUserToProfile(user: any): UserProfile {
  // Backend /auth/me returns flat object; also support nested profile for compatibility
  const p = user.profile || user;
  return {
    id: user.id,
    user_id: user.id,
    email: user.email,
    display_name:
      p.display_name ||
      `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
      user.email?.split('@')[0] || '',
    first_name: p.first_name || '',
    last_name: p.last_name || '',
    is_active: true,
    email_verified: true,
    mobile_verified: false,
    created_at: user.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    avatar_url: p.avatar_url || null,
    mobile_phone: p.mobile_phone || '',
    organization_id: null,
    bio: null,
    preferences: {},
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  let queryClient: any = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    queryClient = useQueryClient();
  } catch {}

  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    role: null,
    isAuthenticated: false,
    isLoading: true,
    sessionType: null,
  });

  useEffect(() => {
    cleanupStaleData();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // اگر token در localStorage هست، وضعیت را از cached user ابتدا ست کن
      const token = getAccessToken();
      if (!token) {
        setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
        return;
      }

      // اول cached user را نمایش بده تا سریع‌تر باشد
      const cached = getStoredUser() as AuthUser | null;
      if (cached) {
        setAuthState({
          user: apiUserToProfile(cached),
          role: cached.role as SystemRole,
          isAuthenticated: true,
          isLoading: false,
          sessionType: 'backend',
        });
      }

      // سپس از سرور تأیید بگیر
      const user = await apiGetMe();
      if (user) {
        setAuthState({
          user: apiUserToProfile(user),
          role: user.role as SystemRole,
          isAuthenticated: true,
          isLoading: false,
          sessionType: 'backend',
        });
      } else {
        clearTokens();
        setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
      }
    } catch {
      clearTokens();
      setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
    }
  }, []);

  // signIn: فقط بعد از login موفق (از AuthPage) فراخوانی می‌شود
  const signIn = async (_email: string, _password: string) => {
    await checkAuthStatus();
  };

  const signOut = async () => {
    try {
      const currentUserId = authState.user?.id;
      const { organizationService } = await import('@/services/organizationService');
      organizationService.invalidateCache();
      localStorage.removeItem('main_organization');
      if (currentUserId && queryClient) {
        fullUserSwitchCleanup(queryClient, currentUserId);
      }
      await apiLogout();
      setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
    } catch {
      clearTokens();
      setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
    }
  };

  const refreshAuth = async () => {
    await checkAuthStatus();
  };

  const debugAuth = () => {
    console.group('🔍 Debug احراز هویت');
    console.log('وضعیت:', authState);
    if (queryClient) debugSystemState(queryClient);
    console.groupEnd();
  };

  const forceReset = () => {
    clearTokens();
    setAuthState({ user: null, role: null, isAuthenticated: false, isLoading: false, sessionType: null });
    if (queryClient) forceCleanupAll(queryClient);
  };

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <AuthContext.Provider value={{ ...authState, signIn, signOut, refreshAuth, debugAuth, forceReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
