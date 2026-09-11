import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
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
      hue: '217',
    },
    {
      title: 'برنامه‌ریزی سازمانی',
      icon: UserCheck,
      route: '/organizational-planning',
      hue: '152',
    },
    {
      title: 'مدیریت پروژه‌ها',
      icon: CheckSquare,
      route: '/project-management',
      hue: '189',
    },
    {
      title: 'ایده‌ها',
      icon: Lightbulb,
      route: '/ideas',
      hue: '48',
    },
    {
      title: 'مسائل حقوقی',
      icon: Scale,
      route: '/legal',
      hue: '270',
    },
    {
      title: 'دانش‌بنیان',
      icon: BookOpen,
      route: '/knowledge',
      hue: '238',
    },
    {
      title: 'گفتگوی هوشمند',
      icon: MessageCircle,
      route: '/ai-chat',
      hue: '142',
    },
    {
      title: 'تقویم',
      icon: Calendar,
      route: '/calendar',
      hue: '0',
    }
  ];

  const getVisibleActions = () => {
    if (isMobile) return quickActions.slice(0, 4);
    if (isTablet) return quickActions.slice(0, 6);
    return quickActions;
  };

  const visibleActions = getVisibleActions();

  return (
    <div className="space-y-5">
      {/* Quick Actions */}
      <div className="card-premium bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
        <div className={cn(isMobile ? "p-4 pb-3" : "p-5 pb-3")}>
          <div className={cn(
            "flex items-center gap-2 font-semibold",
            isMobile ? "text-base" : "text-lg"
          )}>
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            دسترسی سریع
          </div>
        </div>

        <div className={cn(isMobile ? "p-4 pt-0" : "p-5 pt-0")}>
          <div className={cn(
            "grid w-full gap-2.5 stagger-children",
            isMobile ? "grid-cols-2" :
            isTablet ? "grid-cols-1" :
            "grid-cols-1 xl:grid-cols-2"
          )}>
            {visibleActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => navigate(action.route)}
                  className={cn(
                    "flex items-center gap-3 w-full text-right rounded-xl transition-all duration-200",
                    "hover:shadow-sm hover:-translate-y-0.5 active:scale-95",
                    "border border-transparent hover:border-border/50",
                    isMobile ? "p-2.5 min-h-[52px]" : "p-3 min-h-[52px]"
                  )}
                  style={{
                    background: `hsl(${action.hue} 70% 50% / 0.07)`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = `hsl(${action.hue} 70% 50% / 0.12)`)}
                  onMouseLeave={e => (e.currentTarget.style.background = `hsl(${action.hue} 70% 50% / 0.07)`)}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg flex-shrink-0",
                      isMobile ? "w-8 h-8" : "w-9 h-9"
                    )}
                    style={{ background: `hsl(${action.hue} 70% 50% / 0.15)` }}
                  >
                    <IconComponent
                      className={isMobile ? "w-4 h-4" : "w-4 h-4"}
                      style={{ color: `hsl(${action.hue} 65% 45%)` }}
                    />
                  </div>

                  <span className={cn(
                    "font-medium truncate",
                    isMobile ? "text-xs leading-tight" : "text-sm"
                  )}>
                    {action.title}
                  </span>
                </button>
              );
            })}
          </div>

          {isMobile && quickActions.length > 4 && (
            <button className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 rounded-lg hover:bg-muted/30">
              نمایش بیشتر
            </button>
          )}
        </div>
      </div>

      {/* Today's Focus - Only on tablet and desktop */}
      {!isMobile && (
        <div className="card-premium bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl overflow-hidden">
          <div className={cn(isTablet ? "p-4 pb-2" : "p-5 pb-3")}>
            <div className="flex items-center gap-2 font-semibold text-base">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <UserCheck className="w-4 h-4 text-primary" />
              </div>
              تمرکز امروز
            </div>
          </div>

          <div className={cn(isTablet ? "p-4 pt-0" : "p-5 pt-0")}>
            <div className="space-y-1">
              {todaysFocus.length > 0 ? todaysFocus.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/40 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    item.status === 'completed' ? 'bg-emerald-500' :
                    item.status === 'in_progress' ? 'bg-amber-500' : 'bg-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{item.title}</span>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                    )}
                  </div>
                  {item.time && (
                    <span className="text-xs text-muted-foreground flex-shrink-0">{item.time}</span>
                  )}
                </div>
              )) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-sm">هیچ وظیفه‌ای برای امروز تعریف نشده</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}