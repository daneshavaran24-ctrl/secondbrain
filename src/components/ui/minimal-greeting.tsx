import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { getTehranHour } from '@/lib/date-utils';
import { Card } from './card';
import { Sun, Moon, Cloud, Sunset } from 'lucide-react';

export function MinimalGreeting() {
  const { isMobile } = useResponsiveBreakpoints();
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  const getCurrentGreeting = () => {
    const hour = getTehranHour();
    
    // صبح: ۶ تا ۱۲
    if (hour >= 6 && hour < 12) {
      return {
        text: 'صبح بخیر',
        icon: Sun,
        gradient: 'from-amber-400/20 to-orange-500/20'
      };
    } 
    // ظهر: ۱۲ تا ۱۶
    else if (hour >= 12 && hour < 16) {
      return {
        text: 'ظهر بخیر',
        icon: Cloud,
        gradient: 'from-blue-400/20 to-cyan-500/20'
      };
    } 
    // عصر: ۱۶ تا ۲۰
    else if (hour >= 16 && hour < 20) {
      return {
        text: 'عصر بخیر',
        icon: Sunset,
        gradient: 'from-orange-400/20 to-pink-500/20'
      };
    } 
    // شب: ۲۰ تا ۶
    else {
      return {
        text: 'شب بخیر',
        icon: Moon,
        gradient: 'from-indigo-400/20 to-purple-500/20'
      };
    }
  };

  const greeting = getCurrentGreeting();
  const IconComponent = greeting.icon;

  return (
    <Card className={cn(
      "border-0 bg-gradient-to-r backdrop-blur-sm",
      greeting.gradient,
      "transition-all duration-500"
    )}>
      <div className={cn(
        "flex items-center justify-between",
        isMobile ? "p-4" : "p-6"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center justify-center rounded-full bg-background/50",
            isMobile ? "w-10 h-10" : "w-12 h-12"
          )}>
            <IconComponent className={cn(
              "text-foreground/80",
              isMobile ? "w-5 h-5" : "w-6 h-6"
            )} />
          </div>
          
          <div>
            <h1 className={cn(
              "font-bold text-foreground",
              isMobile ? "text-lg" : "text-2xl"
            )}>
              {greeting.text}
            </h1>
            <p className={cn(
              "text-muted-foreground",
              isMobile ? "text-sm" : "text-base"
            )}>
              خوش آمدید به مورا
            </p>
          </div>
        </div>

        {/* Status indicator - hidden on mobile */}
        {!isMobile && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">آنلاین</span>
          </div>
        )}
      </div>
    </Card>
  );
}