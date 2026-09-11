import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { getTehranHour } from '@/lib/date-utils';
import { useAuth } from '@/contexts/AuthContext';
import { Sun, Moon, Cloud, Sunset, Sparkles } from 'lucide-react';

export function MinimalGreeting() {
  const { isMobile } = useResponsiveBreakpoints();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const getCurrentGreeting = () => {
    const hour = getTehranHour();
    if (hour >= 6 && hour < 12) return { text: 'صبح بخیر', icon: Sun, color: 'text-amber-400', orb1: 'hsl(38 92% 50% / 0.15)', orb2: 'hsl(24 95% 53% / 0.10)' };
    if (hour >= 12 && hour < 16) return { text: 'ظهر بخیر', icon: Cloud, color: 'text-sky-400', orb1: 'hsl(199 89% 48% / 0.15)', orb2: 'hsl(187 85% 43% / 0.10)' };
    if (hour >= 16 && hour < 20) return { text: 'عصر بخیر', icon: Sunset, color: 'text-orange-400', orb1: 'hsl(27 96% 61% / 0.15)', orb2: 'hsl(336 80% 58% / 0.10)' };
    return { text: 'شب بخیر', icon: Moon, color: 'text-indigo-400', orb1: 'hsl(238 84% 67% / 0.15)', orb2: 'hsl(270 68% 60% / 0.10)' };
  };

  const greeting = getCurrentGreeting();
  const IconComponent = greeting.icon;

  const userName = user?.display_name || user?.first_name || '';

  const timeStr = currentTime.toLocaleTimeString('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl border border-border/40",
      "bg-background/80 backdrop-blur-xl",
      "transition-all duration-500 page-enter",
      isMobile ? "p-4" : "p-6"
    )}>
      {/* Decorative orbs */}
      <div
        className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-2xl pointer-events-none"
        style={{ background: greeting.orb1 }}
      />
      <div
        className="absolute -bottom-4 -left-4 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: greeting.orb2 }}
      />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Icon bubble */}
          <div className={cn(
            "flex items-center justify-center rounded-2xl",
            "bg-background/60 backdrop-blur-sm",
            "border border-border/50 shadow-sm",
            "flex-shrink-0",
            isMobile ? "w-12 h-12" : "w-14 h-14"
          )}>
            <IconComponent className={cn(greeting.color, isMobile ? "w-6 h-6" : "w-7 h-7")} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className={cn(
                "font-bold text-foreground",
                isMobile ? "text-xl" : "text-2xl"
              )}>
                {greeting.text}{userName ? `، ${userName}` : ''}
              </h1>
              <Sparkles className="w-4 h-4 text-primary/60 flex-shrink-0" />
            </div>
            <p className={cn(
              "text-muted-foreground mt-0.5",
              isMobile ? "text-xs" : "text-sm"
            )}>
              خوش آمدید به مورا
            </p>
          </div>
        </div>

        {/* Time + online indicator */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className={cn(
            "font-mono font-semibold text-foreground/80 tabular-nums",
            isMobile ? "text-base" : "text-lg"
          )}>
            {timeStr}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">آنلاین</span>
          </div>
        </div>
      </div>
    </div>
  );
}
