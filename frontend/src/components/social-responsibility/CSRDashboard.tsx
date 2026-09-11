import { useEffect, useState } from "react";
import { socialResponsibilityService, CSRStats } from "@/services/socialResponsibilityService";
import { Card } from "@/components/ui/card";
import { Heart, TreePine, GraduationCap, TrendingUp, Users, DollarSign } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from "recharts";

const COLORS = {
  charity: 'hsl(var(--chart-1))',
  environment: 'hsl(var(--chart-2))',
  education: 'hsl(var(--chart-3))',
  other: 'hsl(var(--chart-4))',
};

export function CSRDashboard() {
  const [stats, setStats] = useState<CSRStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const data = await socialResponsibilityService.getCSRStats();
    setStats(data);
    setLoading(false);
  };

  if (loading || !stats) {
    return <div className="text-center py-8">در حال بارگذاری...</div>;
  }

  const typeData = [
    { name: 'خیریه', value: stats.byType.charity, color: COLORS.charity },
    { name: 'محیط‌زیست', value: stats.byType.environment, color: COLORS.environment },
    { name: 'آموزش', value: stats.byType.education, color: COLORS.education },
    { name: 'سایر', value: stats.byType.other, color: COLORS.other },
  ];

  const statusData = [
    { name: 'برنامه‌ریزی', value: stats.byStatus.planning },
    { name: 'فعال', value: stats.byStatus.active },
    { name: 'تکمیل', value: stats.byStatus.completed },
    { name: 'متوقف', value: stats.byStatus.on_hold },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">کل پروژه‌ها</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">ذینفعان</p>
              <p className="text-3xl font-bold mt-2">{stats.totalBeneficiaries.toLocaleString('fa-IR')}</p>
            </div>
            <div className="p-3 bg-chart-2/10 rounded-lg">
              <Users className="h-6 w-6 text-chart-2" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">بودجه کل (ریال)</p>
              <p className="text-2xl font-bold mt-2">{stats.totalBudget.toLocaleString('fa-IR')}</p>
            </div>
            <div className="p-3 bg-chart-3/10 rounded-lg">
              <DollarSign className="h-6 w-6 text-chart-3" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">میانگین رضایت</p>
              <p className="text-3xl font-bold mt-2">{stats.avgSatisfaction.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-chart-1/10 rounded-lg">
              <Heart className="h-6 w-6 text-chart-1" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">توزیع پروژه‌ها بر اساس نوع</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">وضعیت پروژه‌ها</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={statusData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}