/**
 * Mora Supabase Compatibility Layer
 *
 * auth.* calls → backend API (mora-backend.liara.run)
 * from() calls → Supabase real DB (for non-migrated tables)
 * functions.invoke() → backend API
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  apiChangePassword,
  apiFetch,
  getStoredUser,
  getAccessToken,
  setTokens,
  clearTokens,
  BACKEND_URL,
} from '@/lib/api';

const SUPABASE_URL = "https://jymajpnwthgqcghmkmam.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWFqcG53dGhncWNnaG1rbWFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3OTU1OTYsImV4cCI6MjA2OTM3MTU5Nn0.J6dMZX-UCAS7PGCsKyamhQwTaqfBJ662HTWA8KgJCbo";

// کلاینت Supabase واقعی فقط برای data (from() calls)
const _realSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: localStorage, persistSession: false, autoRefreshToken: false }
});

// ─── Auth Compatibility ───────────────────────────────────────────────────────

type AuthChangeCallback = (event: string, session: any) => void;
const authListeners: AuthChangeCallback[] = [];

function buildSession(user: any) {
  if (!user) return null;
  return {
    user: {
      id: user.id,
      email: user.email,
      user_metadata: {
        display_name: user.profile?.display_name || user.email?.split('@')[0],
        first_name: user.profile?.first_name || '',
        last_name: user.profile?.last_name || '',
        avatar_url: user.profile?.avatar_url || null,
        role: user.role,
      },
      created_at: new Date().toISOString(),
      email_confirmed_at: new Date().toISOString(),
    },
    access_token: getAccessToken() || '',
  };
}

const mockAuth = {
  getUser: async () => {
    const stored = getStoredUser();
    if (stored && getAccessToken()) {
      return { data: { user: buildSession(stored)?.user }, error: null };
    }
    // تلاش برای تجدید از سرور
    const user = await apiGetMe();
    if (user) {
      return { data: { user: buildSession(user)?.user }, error: null };
    }
    return { data: { user: null }, error: null };
  },

  getSession: async () => {
    const stored = getStoredUser();
    if (stored && getAccessToken()) {
      return { data: { session: buildSession(stored) }, error: null };
    }
    return { data: { session: null }, error: null };
  },

  signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
    const result = await apiLogin(email, password);
    if (result.success && result.user) {
      const session = buildSession(result.user);
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user: session?.user, session }, error: null };
    }
    return { data: { user: null, session: null }, error: { message: result.error || 'خطا در ورود' } };
  },

  signUp: async ({ email, password, options }: { email: string; password: string; options?: any }) => {
    const meta = options?.data || {};
    const result = await apiRegister(email, password, meta.first_name || '', meta.last_name || '');
    if (result.success && result.user) {
      const session = buildSession(result.user);
      authListeners.forEach(cb => cb('SIGNED_IN', session));
      return { data: { user: session?.user, session }, error: null };
    }
    return { data: { user: null, session: null }, error: { message: result.error || 'خطا در ثبت‌نام' } };
  },

  signOut: async (_opts?: any) => {
    await apiLogout();
    authListeners.forEach(cb => cb('SIGNED_OUT', null));
    return { error: null };
  },

  updateUser: async ({ password }: { password?: string }) => {
    if (password) {
      const result = await apiChangePassword('', password);
      if (!result.success) return { data: {}, error: { message: result.error } };
    }
    return { data: {}, error: null };
  },

  resetPasswordForEmail: async (email: string) => {
    try {
      await fetch(`${BACKEND_URL}/auth/reset-password/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
    return { error: null };
  },

  onAuthStateChange: (callback: AuthChangeCallback) => {
    authListeners.push(callback);
    // بررسی وضعیت فعلی
    const stored = getStoredUser();
    if (stored && getAccessToken()) {
      setTimeout(() => callback('SIGNED_IN', buildSession(stored)), 0);
    }
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const idx = authListeners.indexOf(callback);
            if (idx > -1) authListeners.splice(idx, 1);
          }
        }
      }
    };
  },

  // admin namespace (فقط برای سازگاری - عملاً disabled)
  admin: {
    createUser: async () => ({ data: null, error: { message: 'Use backend API' } }),
    deleteUser: async () => ({ error: null }),
  },
};

// ─── Functions Compatibility ──────────────────────────────────────────────────

const mockFunctions = {
  invoke: async (fnName: string, options?: { body?: any }) => {
    try {
      // apiFetch (not bare fetch) so an expired access token is refreshed and
      // the call retried — otherwise every edge function starts failing with
      // "Token invalid or expired" while from() queries keep working.
      const res = await apiFetch(`/${fnName}`, {
        method: 'POST',
        body: JSON.stringify(options?.body || {}),
      });

      // A gateway error can return HTML rather than JSON.
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        // The backend sends the user-facing text as `error`, but some routes
        // historically used `message`. Accept either before falling back.
        const message =
          data?.error ||
          data?.message ||
          (res.status === 401
            ? 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.'
            : `خطا در ارتباط با سرور (${res.status})`);
        return { data: null, error: { message, status: res.status, code: data?.code } };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'خطا در اتصال به سرور' } };
    }
  },
};

// ─── Backend Query Builder ────────────────────────────────────────────────────
// جداول موجود در backend PostgreSQL
const BACKEND_TABLES = new Set([
  // هسته اصلی
  'ideas', 'calendar_events', 'knowledge_base', 'business_companies',
  'meetings', 'gratitude_entries', 'health_metrics', 'delegation_tasks',
  'csr_projects', 'correspondence', 'social_media_posts', 'hi_dock_recordings',
  'legal_cases', 'user_profiles',
  // عادت‌سازی
  'habits', 'habit_completions', 'habit_streaks', 'habit_settings',
  // مخاطبین و شبکه‌سازی
  'personal_contacts',
  'networking_contacts', 'networking_interactions', 'networking_goals', 'networking_events',
  // محتوای فرهنگی
  'cultural_content',
  // چت هوش مصنوعی
  'ai_chat_sessions', 'ai_chat_messages',
  // واگذاری وظایف - جداول فرعی
  'delegation_subtasks', 'delegation_notifications', 'delegation_attachments', 'delegation_task_events',
  // سازمان‌ها
  'organizations', 'organization_members', 'organization_invitations',
  'organization_departments', 'organization_employees', 'organization_missions',
  'organization_policies', 'organization_finance', 'organization_hr',
  'organization_operations', 'organization_strategies', 'organization_okr_key_results',
  'organization_roadmap_milestones', 'organization_notifications', 'organization_chart_nodes',
  'organization_checklist_items', 'organization_decision_options', 'organization_sop_steps',
  'organization_succession_plans', 'organization_succession_successors',
  'organization_performance_evaluations', 'organizational_claims', 'organizational_policy_attachments',
  // برنامه‌ریزی و پروژه
  'personal_planning', 'projects', 'project_tasks', 'profiles',
  // رزومه
  'resume_personal_info', 'resume_work_experience', 'resume_education', 'resume_skills',
  'resume_certificates', 'resume_awards', 'resume_publications', 'resume_affiliations',
  'resume_interests', 'resume_media_interviews', 'resume_templates',
  'resume_template_customizations', 'resume_exports',
  // فروش و بازاریابی
  'sales_leads', 'sales_icp_profiles', 'sales_funnel_stages', 'marketing_campaigns',
  // ایده‌ها - جداول تحلیلی
  'idea_business_model_canvas', 'idea_swot_analysis', 'idea_strategy',
  'idea_financial_analysis', 'idea_milestones', 'idea_risks', 'idea_inspirations',
  'idea_revenue_opportunities', 'idea_suggested_actions', 'idea_analysis_queue',
  // دانش
  'knowledge_folders', 'knowledge_items',
  // CSR - جداول فرعی
  'csr_project_milestones', 'csr_project_documents', 'csr_project_team', 'csr_impact_assessments',
  // شرکت‌ها - جداول فرعی
  'company_contacts', 'company_notes', 'company_profiles', 'company_tasks', 'company_calls',
  // پیام‌رسانی
  'messages', 'channel_members', 'polls', 'poll_options', 'poll_votes',
  // دستگاه‌ها
  'plaud_connections', 'plaud_recordings', 'hi_dock_connections',
  // سیستم
  'user_organizations', 'user_permissions', 'user_audit_log', 'system_permissions',
  'assistant_action_logs', 'auth_audit', 'succession_positions',
  'documents', 'attachments', 'recordings', 'avatars',
]);

async function dbFetch(table: string, body: object) {
  try {
    // استفاده از apiFetch که token refresh خودکار دارد
    const res = await apiFetch(`/db/${table}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { data: null, error: { message: err.error || err.message || `HTTP ${res.status}` } };
    }
    return res.json();
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Network error' } };
  }
}

class BackendMutationBuilder {
  private _filters: any[];
  private _single = false;

  constructor(
    private table: string,
    private operation: string,
    private rowData: any,
    initialFilters: any[] = [],
  ) {
    this._filters = [...initialFilters];
  }

  eq(col: string, val: any)  { this._filters.push({ col, op: 'eq',  val }); return this; }
  neq(col: string, val: any) { this._filters.push({ col, op: 'neq', val }); return this; }
  gt(col: string, val: any)  { this._filters.push({ col, op: 'gt',  val }); return this; }
  gte(col: string, val: any) { this._filters.push({ col, op: 'gte', val }); return this; }
  lt(col: string, val: any)  { this._filters.push({ col, op: 'lt',  val }); return this; }
  lte(col: string, val: any) { this._filters.push({ col, op: 'lte', val }); return this; }
  select(_cols?: string) { return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }
  throwOnError() { return this; }

  then(resolve: (v: any) => void, reject: (e: any) => void) {
    dbFetch(this.table, {
      operation: this.operation,
      data: this.rowData,
      filters: this._filters,
      single: this._single,
    }).then(resolve).catch(reject);
  }
}

class BackendQueryBuilder {
  private _select = '*';
  private _filters: any[] = [];
  private _order: any = null;
  private _limit: number | null = null;
  private _offset: number | null = null;
  private _single = false;
  private _countMode = false;
  private _headOnly = false;

  constructor(private table: string) {}

  select(cols = '*', opts?: any) {
    this._select = cols;
    if (opts?.count === 'exact') this._countMode = true;
    if (opts?.head === true) this._headOnly = true;
    return this;
  }
  eq(col: string, val: any)   { this._filters.push({ col, op: 'eq',   val }); return this; }
  neq(col: string, val: any)  { this._filters.push({ col, op: 'neq',  val }); return this; }
  gt(col: string, val: any)   { this._filters.push({ col, op: 'gt',   val }); return this; }
  gte(col: string, val: any)  { this._filters.push({ col, op: 'gte',  val }); return this; }
  lt(col: string, val: any)   { this._filters.push({ col, op: 'lt',   val }); return this; }
  lte(col: string, val: any)  { this._filters.push({ col, op: 'lte',  val }); return this; }
  like(col: string, val: any) { this._filters.push({ col, op: 'like', val }); return this; }
  ilike(col: string, val: any){ this._filters.push({ col, op: 'ilike',val }); return this; }
  in(col: string, val: any[]) { this._filters.push({ col, op: 'in',   val }); return this; }
  is(col: string, val: any)   { this._filters.push({ col, op: 'is',   val }); return this; }
  // no-op methods for compatibility (not supported in backend but won't crash)
  contains(_col: string, _val: any) { return this; }
  textSearch(_col: string, _query: string, _opts?: any) { return this; }
  filter(_col: string, _op: string, _val: any) { return this; }
  not(_col: string, _op: string, _val: any) { return this; }
  or(_filter: string) { return this; }

  order(col: string, opts?: { ascending?: boolean }) {
    this._order = { col, asc: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this._limit = n; return this; }
  range(from: number, to: number) { this._offset = from; this._limit = to - from + 1; return this; }
  single() { this._single = true; return this; }
  maybeSingle() { this._single = true; return this; }
  throwOnError() { return this; }

  insert(data: any) { return new BackendMutationBuilder(this.table, 'insert', data); }
  update(data: any) { return new BackendMutationBuilder(this.table, 'update', data, this._filters); }
  delete()          { return new BackendMutationBuilder(this.table, 'delete', null,  this._filters); }
  upsert(data: any) { return new BackendMutationBuilder(this.table, 'upsert', data); }

  then(resolve: (v: any) => void, reject: (e: any) => void) {
    const doCount = this._countMode || this._headOnly;
    dbFetch(this.table, doCount
      ? { operation: 'count', filters: this._filters }
      : {
          operation: 'select',
          select: this._select,
          filters: this._filters,
          order: this._order,
          limit: this._limit,
          offset: this._offset,
          single: this._single,
        }
    ).then(result => {
      if (doCount) {
        resolve({ count: result.count ?? 0, data: null, error: result.error ?? null });
      } else {
        resolve(result);
      }
    }).catch(reject);
  }
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const supabase = {
  // auth → backend
  auth: mockAuth,
  // functions → backend
  functions: mockFunctions,
  // from: backend جداول مهاجرت‌شده → backend, بقیه → Supabase
  from: (table: string) => {
    if (BACKEND_TABLES.has(table)) return new BackendQueryBuilder(table) as any;
    return _realSupabase.from(table as any);
  },
  // storage → Supabase واقعی
  storage: _realSupabase.storage,
  // rpc → Supabase واقعی
  rpc: _realSupabase.rpc.bind(_realSupabase),
  // realtime → no-op (backend tables don't support realtime)
  channel: (_name: string) => ({
    on: (_event: string, _opts: any, _cb: any) => ({
      subscribe: (_cb2?: any) => ({ unsubscribe: () => {} }),
    }),
    subscribe: (_cb?: any) => ({ unsubscribe: () => {} }),
  }),
  removeChannel: (_channel: any) => Promise.resolve(),
} as any;
