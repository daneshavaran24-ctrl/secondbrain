import React from 'react';
import { cn } from '@/lib/utils';
import { Brain, Sparkles, Sun, Moon, Coffee } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function SmartGreeting() {
  const isMobile = useIsMobile();
  
  const getCurrentTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return { text: 'شب بخیر', icon: Moon, color: 'text-tech-violet' };
    if (hour < 12) return { text: 'صبح بخیر', icon: Sun, color: 'text-tech-cyan' };
    if (hour < 17) return { text: 'ظهر بخیر', icon: Coffee, color: 'text-medical-amber' };
    if (hour < 21) return { text: 'عصر بخیر', icon: Sun, color: 'text-primary' };
    return { text: 'شب بخیر', icon: Moon, color: 'text-tech-violet' };
  };

  const { text, icon: TimeIcon, color } = getCurrentTimeGreeting();
  const userName = "کاربر عزیز"; // This could come from auth context

  return (
    <div className="relative">
      {/* Main Greeting */}
      <div className={cn(
        "glass-card backdrop-blur-sm bg-card/40 rounded-2xl border border-border/50 shadow-glass",
        isMobile ? "p-4" : "p-6 lg:p-8"
      )}>
        <div className={cn(
          "flex items-center",
          isMobile ? "gap-3" : "gap-4 lg:gap-6"
        )}>
          <div className={cn(
            "rounded-2xl bg-gradient-glow shadow-glow transition-all duration-300 hover:scale-105",
            isMobile ? "p-2.5" : "p-3 lg:p-4"
          )}>
            <TimeIcon className={cn(
              color,
              isMobile ? "w-6 h-6" : "w-7 h-7 lg:w-8 lg:h-8"
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h1 className={cn(
              "font-bold text-foreground mb-1 animate-fade-in",
              isMobile ? "text-xl" : "text-2xl lg:text-3xl",
              isMobile ? "mb-1" : "mb-2"
            )}>
              {text}، {userName}
            </h1>
            <p className={cn(
              "text-muted-foreground animate-fade-in",
              isMobile ? "text-sm" : "text-base lg:text-lg"
            )} style={{ animationDelay: '200ms' }}>
              مرکز کنترل هوشمند شما آماده است
            </p>
          </div>

          {!isMobile && (
            <div className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-tech-cyan animate-pulse" />
              <Sparkles className="w-5 h-5 text-accent animate-twinkle" />
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className={cn(
          "flex gap-3",
          isMobile ? "mt-4 flex-wrap" : "mt-6 gap-4"
        )}>
          <StatusIndicator 
            label="سیستم آماده" 
            status="active" 
            delay="400ms"
          />
          <StatusIndicator 
            label="AI فعال" 
            status="success" 
            delay="600ms"
          />
          <StatusIndicator 
            label="همگام‌سازی" 
            status="syncing" 
            delay="800ms"
          />
        </div>
      </div>
    </div>
  );
}

interface StatusIndicatorProps {
  label: string;
  status: 'active' | 'success' | 'syncing';
  delay?: string;
}

function StatusIndicator({ label, status, delay = '0ms' }: StatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'bg-primary', pulse: true };
      case 'success':
        return { color: 'bg-medical-green', pulse: false };
      case 'syncing':
        return { color: 'bg-tech-cyan', pulse: true };
      default:
        return { color: 'bg-muted', pulse: false };
    }
  };

  const { color, pulse } = getStatusConfig(status);

  return (
    <div 
      className="flex items-center gap-2 animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className={cn(
        "w-2 h-2 rounded-full",
        color,
        pulse && "animate-pulse"
      )} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}