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
    <div className="space-y-6">
      {/* Main Stats Card */}
      <Card>
        <CardHeader className={cn(
          "flex flex-row items-center justify-between space-y-0",
          isMobile ? "p-3 pb-2" : isTablet ? "p-4 pb-2" : "p-6 pb-3"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-base" : isTablet ? "text-lg" : "text-xl"
          )}>
            <TrendingUp className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
            نمای کلی امروز
          </CardTitle>
          
          {(isMobile || isTablet) && todayStats.length > (isMobile ? 2 : 3) && (
            <Button
              variant="ghost"
              size={isMobile ? "sm" : "default"}
              onClick={() => setExpandedStats(!expandedStats)}
              className="min-h-[44px] min-w-[44px]"
            >
              {expandedStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          )}
        </CardHeader>
        
        <CardContent className={cn(
          isMobile ? "p-3 pt-0" : isTablet ? "p-4 pt-0" : "p-6 pt-0"
        )}>
          <div className={cn(
            "grid w-full gap-3",
            isMobile ? "grid-cols-1" : 
            isTablet ? "grid-cols-2" : 
            "grid-cols-2 xl:grid-cols-4"
          )}>
            {visibleStats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                 <div 
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors min-h-[60px]"
                >
                  <div className={cn(
                    "flex items-center justify-center rounded-full bg-background shadow-sm flex-shrink-0",
                    isMobile ? "w-10 h-10" : "w-12 h-12"
                  )}>
                    <IconComponent className={cn(stat.color, isMobile ? "w-4 h-4" : "w-5 h-5")} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className={cn(
                        "font-semibold text-foreground",
                        isMobile ? "text-lg" : "text-xl"
                      )}>
                        {stat.value}
                      </span>
                      {stat.total && (
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          از {stat.total}
                        </span>
                      )}
                    </div>
                    
                    <p className={cn(
                      "text-muted-foreground truncate mt-0.5",
                      isMobile ? "text-xs" : "text-sm"
                    )}>
                      {stat.label}
                    </p>
                    
                    {stat.progress > 0 && (
                      <Progress 
                        value={stat.progress} 
                        className="h-1.5 mt-2" 
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities - Only show on tablet and desktop */}
      {!isMobile && (
        <Card>
          <CardHeader className={cn(
            isTablet ? "p-4 pb-2" : "p-6 pb-4"
          )}>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              فعالیت‌های اخیر
            </CardTitle>
          </CardHeader>
          
          <CardContent className={cn(
            isTablet ? "p-4 pt-0" : "p-6 pt-0"
          )}>
            <div className="space-y-3">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.type === 'success' && "bg-green-500",
                      activity.type === 'info' && "bg-blue-500",
                      activity.type === 'warning' && "bg-yellow-500"
                    )} />
                    <span className="text-sm font-medium">{activity.title}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {activity.time}
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">هیچ فعالیت اخیری وجود ندارد</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}