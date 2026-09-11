import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingDown, Target } from 'lucide-react';
import { BurndownData } from '@/services/sprintService';

interface BurndownChartProps {
  data: BurndownData[];
  sprintName?: string;
  metric?: 'storyPoints' | 'estimatedHours' | 'count';
  className?: string;
}

export function BurndownChart({ data, sprintName, metric = 'storyPoints', className }: BurndownChartProps) {
  const getMetricLabel = () => {
    switch (metric) {
      case 'storyPoints': return 'امتیاز داستان';
      case 'estimatedHours': return 'ساعت تخمینی';
      case 'count': return 'تعداد وظیفه';
      default: return 'امتیاز';
    }
  };

  const formatTooltip = (value: any, name: string, props: any) => {
    const label = name === 'ideal' ? 'خط ایده‌آل' : 'خط واقعی';
    return [`${value} ${getMetricLabel()}`, label];
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            نمودار Burndown
            {sprintName && <span className="text-sm text-muted-foreground">- {sprintName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Target className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>داده‌ای برای نمایش موجود نیست</p>
              <p className="text-xs mt-1">ابتدا یک اسپرینت فعال داشته باشید</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          نمودار Burndown
          {sprintName && <span className="text-sm text-muted-foreground">- {sprintName}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxisLabel}
                className="text-xs"
              />
              <YAxis 
                label={{ 
                  value: getMetricLabel(), 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle' }
                }}
                className="text-xs"
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => `تاریخ: ${formatXAxisLabel(label)}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  direction: 'rtl'
                }}
              />
              <Legend 
                wrapperStyle={{ direction: 'rtl' }}
              />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={2}
                dot={false}
                name="خط ایده‌آل"
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                name="باقی‌مانده واقعی"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Summary */}
        <div className="mt-4 p-3 rounded-lg bg-muted/30">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">کل {getMetricLabel()}</p>
              <p className="text-lg font-semibold text-primary">
                {data.length > 0 ? data[0]?.remaining || 0 : 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">باقی‌مانده</p>
              <p className="text-lg font-semibold text-accent">
                {data.length > 0 ? data[data.length - 1]?.remaining || 0 : 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">پیشرفت</p>
              <p className="text-lg font-semibold text-medical-green">
                {data.length > 0 && data[0]?.remaining > 0 
                  ? Math.round(((data[0].remaining - (data[data.length - 1]?.remaining || 0)) / data[0].remaining) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}