import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { getTodaysFocus, type TodaysFocusItem } from '@/services/activityService';
import { 
  Calendar, 
  CheckSquare, 
  Lightbulb, 
  UserCheck, 
  Scale, 
  BookOpen,
  Plus,
  MessageCircle
} from 'lucide-react';

export function AdaptiveQuickActions() {
  const { 
    isXs, isSm, isMd, isLg, isXl, is2Xl,
    isMobile, isTablet, isDesktop 
  } = useResponsiveBreakpoints();
  const navigate = useNavigate();
  const [todaysFocus, setTodaysFocus] = useState<TodaysFocusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTodaysFocus = async () => {
      try {
        const focus = await getTodaysFocus();
        setTodaysFocus(focus);
      } catch (error) {
        console.error('Error fetching today\'s focus:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodaysFocus();
  }, []);

  const quickActions = [
    {
      title: 'برنامه‌ریزی شخصی',
      icon: CheckSquare,
      route: '/personal-planning',
      color: 'text-blue-600',
      bg: 'bg-blue-50 hover:bg-blue-100'
    },
    {
      title: 'برنامه‌ریزی سازمانی',
      icon: UserCheck,
      route: '/organizational-planning',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 hover:bg-emerald-100'
    },
    {
      title: 'مدیریت پروژه‌ها',
      icon: CheckSquare,
      route: '/project-management',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50 hover:bg-cyan-100'
    },
    {
      title: 'ایده‌ها',
      icon: Lightbulb,
      route: '/ideas',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50 hover:bg-yellow-100'
    },
    {
      title: 'مسائل حقوقی',
      icon: Scale,
      route: '/legal',
      color: 'text-purple-600',
      bg: 'bg-purple-50 hover:bg-purple-100'
    },
    {
      title: 'دانش‌بنیان',
      icon: BookOpen,
      route: '/knowledge',
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 hover:bg-indigo-100'
    },
    {
      title: 'گفتگوی هوشمند',
      icon: MessageCircle,
      route: '/ai-chat',
      color: 'text-green-600',
      bg: 'bg-green-50 hover:bg-green-100'
    },
    {
      title: 'تقویم',
      icon: Calendar,
      route: '/calendar',
      color: 'text-red-600',
      bg: 'bg-red-50 hover:bg-red-100'
    }
  ];

  const getVisibleActions = () => {
    if (isMobile) return quickActions.slice(0, 4);
    if (isTablet) return quickActions.slice(0, 6);
    return quickActions;
  };

  const visibleActions = getVisibleActions();

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card>
        <CardHeader className={cn(
          isMobile ? "p-3 pb-2" : isTablet ? "p-4 pb-2" : "p-6 pb-3"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isMobile ? "text-base" : isTablet ? "text-lg" : "text-xl"
          )}>
            <Plus className={cn("text-primary", isMobile ? "w-4 h-4" : "w-5 h-5")} />
            دسترسی سریع
          </CardTitle>
        </CardHeader>
        
        <CardContent className={cn(
          isMobile ? "p-3 pt-0" : isTablet ? "p-4 pt-0" : "p-6 pt-0"
        )}>
          <div className={cn(
            "grid w-full gap-3",
            isMobile ? "grid-cols-2" : 
            isTablet ? "grid-cols-1" : 
            "grid-cols-1 xl:grid-cols-2"
          )}>
            {visibleActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={cn(
                    "h-auto justify-start border-0 transition-all duration-200 min-h-[56px]",
                    action.bg,
                    "hover:shadow-sm hover:-translate-y-0.5",
                    isMobile ? "p-2.5" : "p-3"
                  )}
                  onClick={() => navigate(action.route)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn(
                      "flex items-center justify-center rounded-lg bg-white/90 shadow-sm flex-shrink-0",
                      isMobile ? "w-8 h-8" : "w-10 h-10"
                    )}>
                      <IconComponent className={cn(action.color, isMobile ? "w-4 h-4" : "w-5 h-5")} />
                    </div>
                    
                    <span className={cn(
                      "font-medium text-right truncate",
                      isMobile ? "text-xs leading-tight" : "text-sm"
                    )}>
                      {action.title}
                    </span>
                  </div>
                </Button>
              );
            })}
          </div>

          {/* Show more button on mobile */}
          {isMobile && quickActions.length > 4 && (
            <Button
              variant="ghost"
              className="w-full mt-3 text-sm"
              onClick={() => {/* Handle show more */ }}
            >
              نمایش بیشتر
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Today's Focus - Only on tablet and desktop */}
      {!isMobile && (
        <Card>
          <CardHeader className={cn(
            isTablet ? "p-4 pb-2" : "p-6 pb-4"
          )}>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              تمرکز امروز
            </CardTitle>
          </CardHeader>
          
          <CardContent className={cn(
            isTablet ? "p-4 pt-0" : "p-6 pt-0"
          )}>
            <div className="space-y-3">
              {todaysFocus.length > 0 ? todaysFocus.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full", 
                    item.status === 'completed' ? 'bg-green-500' :
                    item.status === 'in_progress' ? 'bg-yellow-500' : 'bg-primary'
                  )} />
                  <div className="flex-1">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    )}
                    {item.time && (
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">هیچ وظیفه‌ای برای امروز تعریف نشده</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}