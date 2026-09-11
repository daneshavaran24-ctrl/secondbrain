import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";

export type RangePreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AssistantActionLog {
  id: string;
  user_id: string;
  session_id: string | null;
  action_type: string;
  domain: string | null;
  target_table: string | null;
  target_id: string | null;
  summary: string;
  payload: any;
  status: string;
  error_message: string | null;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

export interface UsageStats {
  totalConversations: number;
  totalActions: number;
  successCount: number;
  failedCount: number;
  topDomain: string | null;
  topAction: string | null;
  perDay: { date: string; count: number }[];
  perType: { type: string; count: number }[];
  perDomain: { domain: string; count: number }[];
}

export function resolveRange(preset: RangePreset, custom?: DateRange): DateRange {
  const now = new Date();
  const startOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d: Date) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: startOfDay(y), end: endOfDay(y) };
    }
    case "this_week": {
      const s = new Date(now);
      s.setDate(s.getDate() - 7);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "this_month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(s), end: endOfDay(now) };
    }
    case "last_month": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: startOfDay(s), end: endOfDay(e) };
    }
    case "custom":
      return custom ?? { start: startOfDay(now), end: endOfDay(now) };
  }
}

export async function getActions(range: DateRange): Promise<AssistantActionLog[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase
      .from("assistant_action_logs")
      .select("*")
      .eq("user_id", user.id)
      .gte("created_at", range.start.toISOString())
      .lte("created_at", range.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []) as AssistantActionLog[];
  } catch (e) {
    logger.error("[assistantReport] getActions", e);
    return [];
  }
}

export async function getConversations(range: DateRange): Promise<ConversationMessage[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: sessions } = await supabase
      .from("ai_chat_sessions")
      .select("id")
      .eq("user_id", user.id);
    const sessionIds = (sessions ?? []).map((s: any) => s.id);
    if (sessionIds.length === 0) return [];

    const { data, error } = await supabase
      .from("ai_chat_messages")
      .select("id, session_id, role, content, created_at")
      .in("session_id", sessionIds)
      .gte("created_at", range.start.toISOString())
      .lte("created_at", range.end.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    return (data ?? []) as ConversationMessage[];
  } catch (e) {
    logger.error("[assistantReport] getConversations", e);
    return [];
  }
}

export function computeStats(actions: AssistantActionLog[], conversations: ConversationMessage[]): UsageStats {
  const perTypeMap = new Map<string, number>();
  const perDomainMap = new Map<string, number>();
  const perDayMap = new Map<string, number>();
  let successCount = 0;
  let failedCount = 0;

  actions.forEach((a) => {
    perTypeMap.set(a.action_type, (perTypeMap.get(a.action_type) ?? 0) + 1);
    if (a.domain) perDomainMap.set(a.domain, (perDomainMap.get(a.domain) ?? 0) + 1);
    const day = a.created_at.slice(0, 10);
    perDayMap.set(day, (perDayMap.get(day) ?? 0) + 1);
    if (a.status === "success") successCount++;
    if (a.status === "failed") failedCount++;
  });

  const sortedTypes = [...perTypeMap.entries()].sort((a, b) => b[1] - a[1]);
  const sortedDomains = [...perDomainMap.entries()].sort((a, b) => b[1] - a[1]);

  return {
    totalConversations: new Set(conversations.map((m) => m.session_id)).size,
    totalActions: actions.length,
    successCount,
    failedCount,
    topDomain: sortedDomains[0]?.[0] ?? null,
    topAction: sortedTypes[0]?.[0] ?? null,
    perDay: [...perDayMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    perType: sortedTypes.map(([type, count]) => ({ type, count })),
    perDomain: sortedDomains.map(([domain, count]) => ({ domain, count })),
  };
}

const ACTION_LABELS: Record<string, string> = {
  task_create: "ایجاد کار",
  meeting_create: "ایجاد جلسه",
  contact_create: "افزودن مخاطب",
  note_create: "ثبت یادداشت",
  health_metric: "ثبت شاخص سلامتی",
  journal_entry: "نوشتن دفترچه",
  knowledge_add: "افزودن دانش",
  idea_create: "ثبت ایده",
  gratitude_add: "ثبت سپاسگزاری",
  email_sent: "ارسال ایمیل",
  reminder_set: "تنظیم یادآور",
};

const DOMAIN_LABELS: Record<string, string> = {
  personal: "شخصی",
  professional: "حرفه‌ای",
  organization: "سازمانی",
  legal: "حقوقی",
  health: "سلامتی",
  social: "اجتماعی",
};

export const labelAction = (k: string) => ACTION_LABELS[k] ?? k;
export const labelDomain = (k: string | null) => (k ? DOMAIN_LABELS[k] ?? k : "—");

/** خروجی Excel با ستون‌های فارسی */
export async function exportActionsToExcel(actions: AssistantActionLog[], filename = "assistant-actions.xlsx") {
  const XLSX = await import("xlsx");
  const rows = actions.map((a) => ({
    "تاریخ": new Date(a.created_at).toLocaleString("fa-IR"),
    "نوع": labelAction(a.action_type),
    "دامنه": labelDomain(a.domain),
    "خلاصه": a.summary,
    "وضعیت": a.status === "success" ? "موفق" : a.status === "failed" ? "ناموفق" : "در انتظار",
    "جدول مقصد": a.target_table ?? "—",
    "خطا": a.error_message ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "اقدامات دستیار");
  XLSX.writeFile(wb, filename);
}

/** خروجی PDF با فونت فارسی Vazirmatn */
export async function exportActionsToPDF(actions: AssistantActionLog[], stats: UsageStats, rangeLabel: string) {
  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  // عنوان (LTR fallback، چون بدون بارگذاری فونت فارسی PDF نمی‌تواند RTL کامل بدهد)
  doc.setFontSize(16);
  doc.text("Mora Assistant Report", 40, 50);
  doc.setFontSize(10);
  doc.text(`Range: ${rangeLabel}`, 40, 70);
  doc.text(`Total actions: ${stats.totalActions}  |  Success: ${stats.successCount}  |  Failed: ${stats.failedCount}`, 40, 88);
  doc.text(`Conversations: ${stats.totalConversations}  |  Top action: ${stats.topAction ?? "-"}  |  Top domain: ${stats.topDomain ?? "-"}`, 40, 104);

  let y = 140;
  doc.setFontSize(11);
  doc.text("Date", 40, y);
  doc.text("Type", 160, y);
  doc.text("Domain", 260, y);
  doc.text("Summary", 340, y);
  y += 14;
  doc.line(40, y, 555, y);
  y += 10;

  doc.setFontSize(9);
  actions.slice(0, 200).forEach((a) => {
    if (y > 780) {
      doc.addPage();
      y = 50;
    }
    const date = new Date(a.created_at).toLocaleString("en-GB");
    doc.text(date, 40, y);
    doc.text(a.action_type.slice(0, 18), 160, y);
    doc.text((a.domain ?? "-").slice(0, 12), 260, y);
    const summary = a.summary.length > 60 ? a.summary.slice(0, 60) + "…" : a.summary;
    doc.text(summary, 340, y);
    y += 14;
  });

  doc.save(`assistant-report-${Date.now()}.pdf`);
}