import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Brain, FileText, Video } from "lucide-react";
import { PersianNumber } from "@/components/ui/persian-number";
import { getProgressStats, type ProgressStats } from "@/services/progressStatsService";
import type { TooltipProps } from "recharts";

interface ProgressData {
  name: string;
  value: number;
  color: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface PieData {
  name: string;
  value: number;
  fill: string;
  [key: string]: string | number;
}

export function ProgressCharts() {
  const [progressStats, setProgressStats] = useState<ProgressStats>({
    projects: 0,
    tasks: 0,
    ideas: 0,
    meetings: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgressStats = async () => {
      try {
        const stats = await getProgressStats();
        setProgressStats(stats);
      } catch (error) {
        console.error('خطا در دریافت آمار پیشرفت:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressStats();
  }, []);

  const progressData: ProgressData[] = [
    { name: "پروژه‌ها", value: progressStats.projects, color: "hsl(var(--primary))", icon: FileText },
    { name: "وظایف", value: progressStats.tasks, color: "hsl(var(--secondary))", icon: Activity },
    { name: "ایده‌ها", value: progressStats.ideas, color: "hsl(var(--accent))", icon: Brain },
    { name: "جلسات", value: progressStats.meetings, color: "hsl(var(--muted))", icon: Video },
  ];

  const pieData: PieData[] = progressData.map(item => ({
    name: item.name,
    value: item.value,
    fill: item.color
  }));
  // import moved to top level

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as PieData;
      return (
        <div className="glass-card p-3 border-0 shadow-floating">
          <p className="text-foreground font-medium">{data.name}</p>
          <p className="text-primary"><PersianNumber>{`${data.value}% تکمیل شده`}</PersianNumber></p>
        </div>
      );
    }
    return null;
  };

  const isJSDOM = typeof navigator !== 'undefined' && /jsdom/i.test(navigator.userAgent || '');

  return (
    <Card className="glass-card border-0 hover-glow transition-elegant">
      <CardContent className="p-4 lg:p-6 xl:p-8">
        <h2 className="text-sm lg:text-base xl:text-xl font-semibold text-foreground mb-4 lg:mb-6 text-center">
          نمایی کلی از پیشرفت
        </h2>

        {/* Pie Chart */}
        <div className="h-48 lg:h-56 xl:h-64 mb-4 lg:mb-6 xl:mb-8">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs lg:text-sm">
              در حال بارگذاری...
            </div>
          ) : isJSDOM ? (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs lg:text-sm">
              نمودار در محیط تست غیرفعال است
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  innerRadius={30}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      style={{
                        filter: `drop-shadow(0 0 6px ${entry.fill}40)`
                      }}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Progress Rings Grid */}
        <div className="grid grid-cols-2 gap-3 lg:gap-4 xl:gap-6">
          {progressData.map((item, index) => (
            <div key={index} className="glass-card bg-gradient-glow p-2 lg:p-3 xl:p-4 rounded-xl border border-border/50 hover:border-primary/20 hover-lift transition-elegant">
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                <div className="p-1.5 lg:p-2 bg-gradient-primary rounded-lg shadow-elegant">
                  <item.icon className="h-3 w-3 lg:h-4 lg:w-4 text-white" />
                </div>
                <span className="text-xs lg:text-sm font-medium text-foreground truncate">{item.name}</span>
              </div>
              <div className="flex justify-center">
                <ProgressRing
                  progress={item.value}
                  size={40}
                  strokeWidth={4}
                  color={item.color}
                  showText={true}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}