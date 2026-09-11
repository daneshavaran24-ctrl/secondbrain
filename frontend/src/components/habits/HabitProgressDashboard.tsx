import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProgressRing } from '@/components/ui/progress-ring';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Flame, Target, TrendingUp, Award } from 'lucide-react';
import { MonthlyStats } from '@/services/habitTrackerService';
import { PersianNumber } from '@/components/ui/persian-number';
import { format } from 'date-fns';

interface HabitProgressDashboardProps {
  stats: MonthlyStats;
}

export const HabitProgressDashboard: React.FC<HabitProgressDashboardProps> = ({ stats }) => {
  const goalVsActualData = [
    { name: 'هدف', value: stats.totalPossible },
    { name: 'انجام شده', value: stats.totalCompletions },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <ProgressRing
                progress={Math.round(stats.completionRate)}
                size={120}
                strokeWidth={12}
                color="hsl(var(--emerald-600))"
              />
              <div className="text-center">
                <p className="text-sm text-muted-foreground">پیشرفت کلی</p>
                <p className="text-2xl font-bold">
                  <PersianNumber>{Math.round(stats.completionRate)}%</PersianNumber>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-orange-500/10">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">استریک فعلی</p>
                <p className="text-3xl font-bold text-orange-500">
                  <PersianNumber>{stats.currentStreak}</PersianNumber>
                </p>
                <p className="text-xs text-muted-foreground">روز</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-purple-500/10">
                <Award className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">بهترین استریک</p>
                <p className="text-3xl font-bold text-purple-500">
                  <PersianNumber>{stats.longestStreak}</PersianNumber>
                </p>
                <p className="text-xs text-muted-foreground">روز</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-emerald-500/10">
                <Target className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">کل تکمیل‌ها</p>
                <p className="text-3xl font-bold text-emerald-500">
                  <PersianNumber>{stats.totalCompletions}</PersianNumber>
                </p>
                <p className="text-xs text-muted-foreground">
                  از <PersianNumber>{stats.totalPossible}</PersianNumber>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            پیشرفت روزانه
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={stats.dailyProgress}>
              <defs>
                <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--emerald-600))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--emerald-600))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(date) => format(new Date(date), 'd')}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [
                  `${Math.round(value)}%`,
                  'درصد تکمیل',
                ]}
                labelFormatter={(date) => format(new Date(date), 'dd MMM')}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--emerald-600))"
                strokeWidth={2}
                fill="url(#colorProgress)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Goal vs Actual Chart */}
      <Card>
        <CardHeader>
          <CardTitle>هدف در مقابل عملکرد</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={goalVsActualData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="value" fill="hsl(var(--emerald-600))" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Best & Worst Days */}
      {stats.bestDay && stats.worstDay && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardHeader>
              <CardTitle className="text-sm text-emerald-600">بهترین روز</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {format(new Date(stats.bestDay.date), 'd MMMM')}
              </p>
              <p className="text-sm text-muted-foreground">
                <PersianNumber>{stats.bestDay.count}</PersianNumber> عادت تکمیل شده
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="text-sm text-orange-600">روز با کمترین فعالیت</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {format(new Date(stats.worstDay.date), 'd MMMM')}
              </p>
              <p className="text-sm text-muted-foreground">
                <PersianNumber>{stats.worstDay.count}</PersianNumber> عادت تکمیل شده
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
