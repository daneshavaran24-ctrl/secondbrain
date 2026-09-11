import { useState, useEffect, useMemo } from "react";
import {
  resolveRange,
  getActions,
  getConversations,
  computeStats,
  exportActionsToExcel,
  exportActionsToPDF,
  labelAction,
  labelDomain,
  type RangePreset,
  type AssistantActionLog,
  type ConversationMessage,
  type UsageStats,
} from "@/services/assistantReportService";
import { AuroraBackground } from "@/components/ui/luxe/AuroraBackground";
import { LuxeCard } from "@/components/ui/luxe/LuxeCard";
import { MinimalSectionHeader } from "@/components/ui/luxe/MinimalSectionHeader";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Download, FileSpreadsheet, FileText, MessageSquare, Activity, TrendingUp, CheckCircle2, XCircle, Loader2 } from "lucide-react";

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "امروز" },
  { value: "yesterday", label: "دیروز" },
  { value: "this_week", label: "این هفته" },
  { value: "this_month", label: "این ماه" },
  { value: "last_month", label: "ماه قبل" },
  { value: "custom", label: "بازه دلخواه" },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function AssistantReportsPage() {
  const [preset, setPreset] = useState<RangePreset>("this_week");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<AssistantActionLog[]>([]);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [search, setSearch] = useState("");

  const range = useMemo(() => {
    if (preset === "custom" && customStart && customEnd) {
      return resolveRange("custom", {
        start: new Date(customStart),
        end: new Date(customEnd + "T23:59:59"),
      });
    }
    return resolveRange(preset);
  }, [preset, customStart, customEnd]);

  const stats: UsageStats = useMemo(() => computeStats(actions, conversations), [actions, conversations]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getActions(range), getConversations(range)]).then(([a, c]) => {
      if (cancelled) return;
      setActions(a);
      setConversations(c);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [range.start.getTime(), range.end.getTime()]);

  const filteredActions = useMemo(() => {
    if (!search.trim()) return actions;
    const q = search.trim().toLowerCase();
    return actions.filter((a) =>
      a.summary.toLowerCase().includes(q) ||
      labelAction(a.action_type).includes(q) ||
      (a.domain && labelDomain(a.domain).includes(q))
    );
  }, [actions, search]);

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.trim().toLowerCase();
    return conversations.filter((m) => m.content.toLowerCase().includes(q));
  }, [conversations, search]);

  const rangeLabel = PRESETS.find((p) => p.value === preset)?.label ?? "";

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-6" dir="rtl">
        <MinimalSectionHeader
          title="گزارش‌های دستیار هوشمند"
          subtitle="مرور مکالمات، اقدامات و آمار استفاده از دستیار مورا"
        />

        {/* بازه + خروجی */}
        <LuxeCard className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <Button
                  key={p.value}
                  variant={preset === p.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreset(p.value)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportActionsToExcel(filteredActions)}
                disabled={filteredActions.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 ml-1" /> Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportActionsToPDF(filteredActions, stats, rangeLabel)}
                disabled={filteredActions.length === 0}
              >
                <FileText className="h-4 w-4 ml-1" /> PDF
              </Button>
            </div>
          </div>

          {preset === "custom" && (
            <div className="flex flex-wrap gap-3 mt-4">
              <div>
                <label className="text-xs text-muted-foreground">از</label>
                <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-44" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">تا</label>
                <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-44" />
              </div>
            </div>
          )}
        </LuxeCard>

        {/* کارت‌های آماری */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={<MessageSquare className="h-5 w-5" />} label="مکالمات" value={stats.totalConversations} />
          <StatCard icon={<Activity className="h-5 w-5" />} label="اقدامات" value={stats.totalActions} />
          <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />} label="موفق" value={stats.successCount} />
          <StatCard icon={<XCircle className="h-5 w-5 text-destructive" />} label="ناموفق" value={stats.failedCount} />
        </div>

        {/* نمودارها */}
        {!loading && stats.totalActions > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LuxeCard className="p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> اقدامات روزانه
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.perDay}>
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </LuxeCard>

            <LuxeCard className="p-4">
              <h3 className="text-sm font-medium mb-3">توزیع نوع اقدام</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={stats.perType.map((t) => ({ name: labelAction(t.type), value: t.count }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label
                  >
                    {stats.perType.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </LuxeCard>
          </div>
        )}

        {/* جستجو + تب‌ها */}
        <LuxeCard className="p-4">
          <Input
            placeholder="جستجو در مکالمات و اقدامات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-4"
          />

          <Tabs defaultValue="actions">
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              <TabsTrigger value="actions">
                اقدامات ({filteredActions.length})
              </TabsTrigger>
              <TabsTrigger value="conversations">
                مکالمات ({filteredMessages.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="actions" className="mt-4">
              {loading ? (
                <LoadingState />
              ) : filteredActions.length === 0 ? (
                <EmptyState text="هیچ اقدامی در این بازه ثبت نشده" />
              ) : (
                <ScrollArea className="h-[480px] pr-2">
                  <div className="space-y-2">
                    {filteredActions.map((a) => (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge variant="secondary">{labelAction(a.action_type)}</Badge>
                            {a.domain && <Badge variant="outline">{labelDomain(a.domain)}</Badge>}
                            <StatusBadge status={a.status} />
                            <span className="text-xs text-muted-foreground mr-auto">
                              {new Date(a.created_at).toLocaleString("fa-IR")}
                            </span>
                          </div>
                          <p className="text-sm">{a.summary}</p>
                          {a.error_message && (
                            <p className="text-xs text-destructive mt-1">{a.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="conversations" className="mt-4">
              {loading ? (
                <LoadingState />
              ) : filteredMessages.length === 0 ? (
                <EmptyState text="هیچ مکالمه‌ای در این بازه یافت نشد" />
              ) : (
                <ScrollArea className="h-[480px] pr-2">
                  <div className="space-y-2">
                    {filteredMessages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-3 rounded-lg ${
                          m.role === "user"
                            ? "bg-primary/10 border-r-2 border-primary"
                            : "bg-muted/30 border-r-2 border-accent"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant={m.role === "user" ? "default" : "secondary"}>
                            {m.role === "user" ? "کاربر" : "دستیار"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(m.created_at).toLocaleString("fa-IR")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </LuxeCard>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <LuxeCard className="p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
        <div>
          <div className="text-2xl font-bold">{value.toLocaleString("fa-IR")}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </LuxeCard>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "success") return <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20">موفق</Badge>;
  if (status === "failed") return <Badge variant="destructive">ناموفق</Badge>;
  return <Badge variant="outline">در انتظار</Badge>;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-16 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin ml-2" /> در حال بارگذاری...
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Download className="h-10 w-10 opacity-30 mb-3" />
      <p>{text}</p>
    </div>
  );
}