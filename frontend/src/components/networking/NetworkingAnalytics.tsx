import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { networkingService, NetworkingContact, NetworkingGoal } from "@/services/networkingService";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import { Users, TrendingUp, Target, MessageSquare } from "lucide-react";
import { NetworkingRelationshipGraph } from "./NetworkingRelationshipGraph";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NetworkingAnalyticsProps {
  companyId?: string;
  organizationId?: string;
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const categoryLabels: Record<string, string> = {
  mentor: "منتور",
  advisor: "مشاور",
  investor: "سرمایه‌گذار",
  partner: "شریک",
  client: "مشتری",
  peer: "همتا",
  influencer: "اینفلوئنسر",
};

const statusLabels: Record<string, string> = {
  hot: "داغ",
  warm: "گرم",
  active: "فعال",
  dormant: "راکد",
  cold: "سرد",
};

export function NetworkingAnalytics({ companyId, organizationId }: NetworkingAnalyticsProps) {
  const [contacts, setContacts] = useState<NetworkingContact[]>([]);
  const [goals, setGoals] = useState<NetworkingGoal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [companyId, organizationId]);

  const loadData = async () => {
    try {
      const [contactsData, goalsData] = await Promise.all([
        networkingService.getContacts(companyId, organizationId),
        networkingService.getGoals(companyId, organizationId),
      ]);
      setContacts(contactsData);
      setGoals(goalsData);
    } catch (error) {
      console.error("Error loading analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Category distribution data
  const categoryData = Object.entries(
    contacts.reduce((acc, c) => {
      const cat = c.category || "other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: categoryLabels[name] || name,
    value,
  }));

  // Relationship strength distribution
  const strengthData = [1, 2, 3, 4, 5].map((strength) => ({
    strength: `${strength}`,
    count: contacts.filter((c) => c.relationship_strength === strength).length,
  }));

  // Status distribution
  const statusData = Object.entries(
    contacts.reduce((acc, c) => {
      const status = c.status || "active";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({
    name: statusLabels[name] || name,
    value,
  }));

  // Monthly growth (simulated based on created_at)
  const monthlyGrowth = contacts
    .reduce((acc, c) => {
      const date = new Date(c.created_at || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      acc[monthKey] = (acc[monthKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const growthData = Object.entries(monthlyGrowth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .reduce((acc, [month, count], idx) => {
      const prevTotal = idx > 0 ? acc[idx - 1].total : 0;
      acc.push({
        month: new Date(month + "-01").toLocaleDateString("fa-IR", { month: "short" }),
        count,
        total: prevTotal + count,
      });
      return acc;
    }, [] as { month: string; count: number; total: number }[]);

  // Goals progress
  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const goalsProgressData = [
    { name: "تکمیل شده", value: completedGoals.length },
    { name: "در حال انجام", value: activeGoals.length },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">داده‌ای برای تحلیل وجود ندارد</p>
        <p className="text-sm text-muted-foreground mt-2">
          ابتدا مخاطبین خود را اضافه کنید
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue="charts" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="charts">نمودارها</TabsTrigger>
        <TabsTrigger value="graph">گراف شبکه</TabsTrigger>
      </TabsList>

      <TabsContent value="graph" className="space-y-4">
        <NetworkingRelationshipGraph contacts={contacts} />
      </TabsContent>

      <TabsContent value="charts" className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{contacts.length}</div>
              <p className="text-sm text-muted-foreground">کل مخاطبین</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-500 font-bold">۵</span>
              </div>
              <div className="text-2xl font-bold">
                {contacts.filter((c) => c.relationship_strength >= 4).length}
              </div>
              <p className="text-sm text-muted-foreground">روابط قوی</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="text-2xl font-bold">{activeGoals.length}</div>
              <p className="text-sm text-muted-foreground">اهداف فعال</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold">
                {contacts.filter((c) => c.last_interaction_date).length}
              </div>
              <p className="text-sm text-muted-foreground">با تعامل اخیر</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Growth */}
          {growthData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">رشد شبکه ارتباطات</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={growthData}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorTotal)"
                      name="کل مخاطبین"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">توزیع دسته‌بندی</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Relationship Strength */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">قدرت روابط</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={strengthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="strength" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="تعداد" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">وضعیت روابط</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Goals Progress */}
        {goals.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">پیشرفت اهداف</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={150}>
                    <PieChart>
                      <Pie
                        data={goalsProgressData}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#3b82f6" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                  {activeGoals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate">{goal.title}</span>
                        <span className="text-muted-foreground">
                          {goal.current_count}/{goal.target_count}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500"
                          style={{ width: `${Math.min(100, (goal.current_count / goal.target_count) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
