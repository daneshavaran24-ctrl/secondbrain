/**
 * کلاینت API برای ارتباط با بک‌اند مورا
 * جایگزین Supabase auth و Edge Functions
 */

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://mora-backend.liara.run';

const TOKEN_KEY = 'mora_access_token';
const REFRESH_KEY = 'mora_refresh_token';
const USER_KEY = 'mora_user';

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ─── Core fetch ──────────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function attemptRefresh(): Promise<string | null> {
  const refresh_token = getRefreshToken();
  if (!refresh_token) return null;

  try {
    const res = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token }),
    });

    if (!res.ok) {
      clearTokens();
      return null;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    clearTokens();
    return null;
  }
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const makeRequest = (token: string | null) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    return fetch(`${BACKEND_URL}${path}`, { ...options, headers });
  };

  let token = getAccessToken();
  let response = await makeRequest(token);

  // اگر 401 بود، refresh کن
  if (response.status === 401 && getRefreshToken()) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newToken = await attemptRefresh();
      isRefreshing = false;
      refreshQueue.forEach(cb => cb(newToken));
      refreshQueue = [];
      token = newToken;
    } else {
      // صبر برای refresh در حال انجام
      token = await new Promise<string | null>(resolve => {
        refreshQueue.push(resolve);
      });
    }

    if (token) response = await makeRequest(token);
  }

  return response;
}

// ─── Auth API ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    avatar_url?: string;
    mobile_phone?: string;
  };
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export async function apiLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'خطا در ورود' };
    }

    setTokens(data.access_token, data.refresh_token);

    // دریافت اطلاعات کاربر از /auth/me
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = meRes.ok ? await meRes.json() : null;
    if (user) setStoredUser(user);

    return { success: true, user: user || { id: '', email, role: 'user' } };
  } catch {
    return { success: false, error: 'خطا در اتصال به سرور' };
  }
}

export async function apiRegister(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResult> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'خطا در ثبت‌نام' };
    }

    setTokens(data.access_token, data.refresh_token);

    // دریافت اطلاعات کاربر از /auth/me
    const meRes = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const user = meRes.ok ? await meRes.json() : null;
    if (user) setStoredUser(user);

    return { success: true, user: user || { id: '', email, role: 'user' } };
  } catch {
    return { success: false, error: 'خطا در اتصال به سرور' };
  }
}

export async function apiLogout(): Promise<void> {
  try {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    }
  } catch {
    // silent
  } finally {
    clearTokens();
  }
}

export async function apiGetMe(): Promise<AuthUser | null> {
  try {
    const res = await apiFetch('/auth/me');
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const user = await res.json();
    setStoredUser(user);
    return user;
  } catch {
    return null;
  }
}

export async function apiSubUserLogin(email: string, password: string): Promise<AuthResult & { permissions?: any }> {
  try {
    const res = await fetch(`${BACKEND_URL}/sub-user-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { success: false, error: data.error || 'خطا در ورود' };
    }

    setTokens(data.token, data.token); // sub-user has single token
    const user: AuthUser = {
      id: data.user.id,
      email: data.user.email,
      role: 'sub_user',
      profile: { display_name: data.user.name },
    };
    setStoredUser(user);
    return { success: true, user, permissions: data.permissions };
  } catch {
    return { success: false, error: 'خطا در اتصال به سرور' };
  }
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: 'خطا در اتصال به سرور' };
  }
}

export async function apiRequestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/reset-password/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error };
    return { success: true };
  } catch {
    return { success: false, error: 'خطا در اتصال به سرور' };
  }
}
