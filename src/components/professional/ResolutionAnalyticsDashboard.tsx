import { MeetingResolution } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";

interface ResolutionAnalyticsDashboardProps {
  resolutions: MeetingResolution[];
}

const COLORS = {
  pending: '#94a3b8',
  approved: '#3b82f6',
  in_progress: '#8b5cf6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  rejected: '#f59e0b'
};

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e'
};

export const ResolutionAnalyticsDashboard = ({ resolutions }: ResolutionAnalyticsDashboardProps) => {
  // توزیع بر اساس وضعیت
  const statusDistribution = Object.entries(
    resolutions.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([status, count]) => ({
    name: status === 'pending' ? 'در انتظار' : 
          status === 'approved' ? 'تایید شده' : 
          status === 'in_progress' ? 'در حال اجرا' : 
          status === 'completed' ? 'تکمیل شده' : 
          status === 'cancelled' ? 'لغو شده' : 'رد شده',
    value: count,
    color: COLORS[status as keyof typeof COLORS]
  }));

  // توزیع اولویت
  const priorityDistribution = Object.entries(
    resolutions.reduce((acc, r) => {
      acc[r.priority] = (acc[r.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([priority, count]) => ({
    name: priority === 'high' ? 'بالا' : priority === 'medium' ? 'متوسط' : 'پایین',
    value: count,
    color: PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS]
  }));

  // روند تکمیل (30 روز اخیر)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const completionTrend = last30Days.map((date) => {
    const completed = resolutions.filter(r => 
      r.status === 'completed' && 
      r.updated_at.startsWith(date)
    ).length;

    return {
      date: new Date(date).toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
      completed
    };
  });

  // برترین اجراکنندگان
  const topPerformers = Object.entries(
    resolutions
      .filter(r => r.status === 'completed')
      .reduce((acc, r) => {
        const responsible = r.responsible_parties?.[0]?.user_name || r.responsible_party;
        acc[responsible] = (acc[responsible] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // آمار کلی
  const totalResolutions = resolutions.length;
  const completedResolutions = resolutions.filter(r => r.status === 'completed').length;
  const inProgressResolutions = resolutions.filter(r => r.status === 'in_progress').length;
  const overdueResolutions = resolutions.filter(r => 
    r.due_date && 
    new Date(r.due_date) < new Date() && 
    r.status !== 'completed'
  ).length;

  const completionRate = totalResolutions > 0 
    ? Math.round((completedResolutions / totalResolutions) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* آمار کلی */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نرخ تکمیل</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">در حال اجرا</p>
                <p className="text-2xl font-bold">{inProgressResolutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">تکمیل شده</p>
                <p className="text-2xl font-bold">{completedResolutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">عقب‌افتاده</p>
                <p className="text-2xl font-bold">{overdueResolutions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* نمودارها */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزیع وضعیت */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع بر اساس وضعیت</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* توزیع اولویت */}
        <Card>
          <CardHeader>
            <CardTitle>توزیع اولویت</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8">
                  {priorityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* روند تکمیل */}
        <Card>
          <CardHeader>
            <CardTitle>روند تکمیل (30 روز اخیر)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={completionTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" name="تکمیل شده" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* برترین اجراکنندگان */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              برترین اجراکنندگان
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                هنوز مصوبه‌ای تکمیل نشده است
              </p>
            ) : (
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`
                        flex items-center justify-center w-8 h-8 rounded-full
                        ${index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-muted'}
                        text-white font-bold
                      `}>
                        {index + 1}
                      </div>
                      <span className="font-medium">{performer.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {performer.count} مصوبه
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};