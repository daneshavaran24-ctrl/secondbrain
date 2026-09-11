import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChartData } from '@/services/organizationStatsService';
import { TrendingUp, Calendar } from 'lucide-react';

interface OrganizationChartsProps {
  projectsData: ChartData[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

// Sample data for additional charts
const monthlyActivityData = [
  { name: 'فروردین', value: 65 },
  { name: 'اردیبهشت', value: 75 },
  { name: 'خرداد', value: 85 },
  { name: 'تیر', value: 90 },
  { name: 'مرداد', value: 78 },
  { name: 'شهریور', value: 95 },
];

const teamPerformanceData = [
  { name: 'تیم A', tasks: 45, completed: 38 },
  { name: 'تیم B', tasks: 52, completed: 45 },
  { name: 'تیم C', tasks: 38, completed: 32 },
  { name: 'تیم D', tasks: 61, completed: 55 },
];

export function OrganizationCharts({ projectsData }: OrganizationChartsProps) {
  const hasData = projectsData && projectsData.length > 0;

  return (
    <div className="space-y-6 mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          تحلیل‌ها و نمودارها
        </h2>
        <Tabs defaultValue="week" className="w-auto">
          <TabsList>
            <TabsTrigger value="day">روز</TabsTrigger>
            <TabsTrigger value="week">هفته</TabsTrigger>
            <TabsTrigger value="month">ماه</TabsTrigger>
            <TabsTrigger value="year">سال</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full" />
                توزیع پروژه‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {hasData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectsData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {projectsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  داده‌ای برای نمایش وجود ندارد
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Monthly Activity Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-accent/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-emerald-500/50 rounded-full" />
                روند فعالیت ماهانه
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyActivityData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)"
                    animationBegin={0}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="overflow-hidden hover:shadow-lg transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-500/5 to-transparent">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-purple-500/50 rounded-full" />
                عملکرد تیم‌ها
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={teamPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="tasks" 
                    fill="#8b5cf6" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    name="کل وظایف"
                  />
                  <Bar 
                    dataKey="completed" 
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]}
                    animationBegin={200}
                    animationDuration={800}
                    name="تکمیل شده"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
