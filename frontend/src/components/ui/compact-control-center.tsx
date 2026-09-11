import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Progress } from './progress';
import { getDashboardStats, type DashboardStats } from '@/services/dashboardService';
import { getRecentActivities, type RecentActivity } from '@/services/activityService';
import { 
  CheckCircle, 
  Clock, 
  Users, 
  Lightbulb, 
  Calendar,
  ChevronDown,
  ChevronUp,
  TrendingUp
} from 'lucide-react';

export function CompactControlCenter() {
  const { 
    isXs, isSm, isMd, isLg, isXl, is2Xl,
    isMobile, isTablet, isDesktop 
  } = useResponsiveBreakpoints();
  const [expandedStats, setExpandedStats] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    todayActivities: 0,
    activeProjects: 0,
    newIdeas: 0,
    weeklyMeetings: 0,
    activeMissions: 0,
    activePolicies: 0,
    totalClaims: 0,
    totalKnowledgeItems: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardStats, activities] = await Promise.all([
          getDashboardStats(),
          getRecentActivities()
        ]);
        setStats(dashboardStats);
        setRecentActivities(activities);
      } catch (error) {
        console.error('خطا در دریافت آمار:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const todayStats = [
    {
      label: 'فعالیت‌های امروز',
      value: stats.todayActivities.toString(),
      total: '',
      icon: CheckCircle,
      color: 'text-green-600',
      progress: 0
    },
    {
      label: 'ماموریت‌های فعال',
      value: stats.activeMissions.toString(),
      total: '',
      icon: TrendingUp,
      color: 'text-emerald-600',
      progress: 0
    },
    {
      label: 'پروژه‌های فعال',
      value: stats.activeProjects.toString(),
      total: '',
      icon: Users,
      color: 'text-purple-600',
      progress: 0
    },
    {
      label: 'سیاست‌های فعال',
      value: stats.activePolicies.toString(),
      total: '',
      icon: CheckCircle,
      color: 'text-blue-600',
      progress: 0
    },
    {
      label: 'ایده‌های جدید',
      value: stats.newIdeas.toString(),
      total: '',
      icon: Lightbulb,
      color: 'text-yellow-600',
      progress: 0
    },
    {
      label: 'آیتم‌های دانش',
      value: stats.totalKnowledgeItems.toString(),
      total: '',
      icon: Users,
      color: 'text-indigo-600',
      progress: 0
    },
    {
      label: 'جلسات این هفته',
      value: stats.weeklyMeetings.toString(),
      total: '',
      icon: Calendar,
      color: 'text-cyan-600',
      progress: 0
    },
    {
      label: 'کل ادعاها',
      value: stats.totalClaims.toString(),
      total: '',
      icon: Clock,
      color: 'text-orange-600',
      progress: 0
    }
  ];

  const getVisibleStats = () => {
    if (isMobile) return expandedStats ? todayStats : todayStats.slice(0, 2);
    if (isTablet) return expandedStats ? todayStats : todayStats.slice(0, 3);
    return todayStats;
  };

  const visibleStats = getVisibleStats();

  return (
    <div className="space-y-5">
      {/* Main Stats Card */}
      <div className="card-premium bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
        <div className={cn(
          "flex flex-row items-center justify-between",
          isMobile ? "p-4 pb-3" : "p-5 pb-3"
        )}>
          <div className={cn(
            "flex items-center gap-2 font-semibold",
            isMobile ? "text-base" : "text-lg"
          )}>
            <div className="p-1.5 rounded-lg bg-primary/10">
              <TrendingUp className={cn("text-primary", isMobile ? "w-4 h-4" : "w-4 h-4")} />
            </div>
            نمای کلی امروز
          </div>

          {(isMobile || isTablet) && todayStats.length > (isMobile ? 2 : 3) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpandedStats(!expandedStats)}
              className="min-h-[36px] min-w-[36px] rounded-lg"
            >
              {expandedStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </div>

        <div className={cn(isMobile ? "p-4 pt-0" : "p-5 pt-0")}>
          <div className={cn(
            "grid w-full gap-3 stagger-children",
            isMobile ? "grid-cols-1" :
            isTablet ? "grid-cols-2" :
            "grid-cols-2 xl:grid-cols-4"
          )}>
            {visibleStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div
                  key={index}
                  className="stat-card flex items-center gap-3 min-h-[64px]"
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-xl flex-shrink-0",
                    "bg-primary/8 border border-primary/10",
                    isMobile ? "w-10 h-10" : "w-11 h-11"
                  )}>
                    <IconComponent className={cn(stat.color, isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className={cn(
                        "font-bold text-foreground tabular-nums",
                        isMobile ? "text-xl" : "text-2xl"
                      )}>
                        {isLoading ? '—' : stat.value}
                      </span>
                    </div>
                    <p className={cn(
                      "text-muted-foreground truncate",
                      isMobile ? "text-xs" : "text-xs mt-0.5"
                    )}>
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Activities - Only show on tablet and desktop */}
      {!isMobile && (
        <div className="card-premium bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
          <div className={cn(isTablet ? "p-4 pb-2" : "p-5 pb-3")}>
            <div className="flex items-center gap-2 font-semibold text-base">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              فعالیت‌های اخیر
            </div>
          </div>

          <div className={cn(isTablet ? "p-4 pt-0" : "p-5 pt-0")}>
            <div className="space-y-1">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      activity.type === 'success' && "bg-emerald-500",
                      activity.type === 'info' && "bg-blue-500",
                      activity.type === 'warning' && "bg-amber-500"
                    )} />
                    <span className="text-sm font-medium">{activity.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">هیچ فعالیت اخیری وجود ندارد</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}