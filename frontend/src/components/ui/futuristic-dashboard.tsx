import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { SmartGreeting } from './smart-greeting';
import { ControlCenter } from './control-center';
import { TodaysFocus } from './todays-focus';
import { QuickLaunchPad } from './quick-launch-pad';

interface FuturisticDashboardProps {
  className?: string;
  sidebarOpen?: boolean;
}

export function FuturisticDashboard({ 
  className, 
  sidebarOpen = false 
}: FuturisticDashboardProps) {
  const isMobile = useIsMobile();
  return (
    <div className={cn(
      "min-h-screen bg-gradient-futuristic relative overflow-hidden",
      className
    )}>
      {/* Background Pattern - Hidden on mobile for performance */}
      {!isMobile && (
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-primary rounded-full blur-3xl opacity-20" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-hero rounded-full blur-2xl opacity-15" />
          <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-tech-cyan/10 rounded-full blur-3xl" />
        </div>
      )}

      <div className={cn(
        "relative z-10 transition-all duration-500 ease-in-out w-full",
        !isMobile && sidebarOpen ? "lg:mr-64" : "mr-0"
      )}>
        <div className={cn(
          "container mx-auto max-w-7xl",
          isMobile ? "px-4 py-4" : "px-6 py-6 lg:py-8"
        )}>
          {/* Hero Section */}
          <div className={cn(isMobile ? "mb-6" : "mb-8 lg:mb-12")}>
            <SmartGreeting />
          </div>

          {/* Main Grid */}
          <div className={cn(
            "grid gap-6",
            isMobile 
              ? "grid-cols-1" 
              : "grid-cols-1 lg:grid-cols-12 gap-8"
          )}>
            {/* Left Column - Control Center */}
            <div className={cn(
              "space-y-6",
              !isMobile && "lg:col-span-8 space-y-8"
            )}>
              <ControlCenter />
              <TodaysFocus />
            </div>

            {/* Right Column - Quick Actions */}
            <div className={cn(
              !isMobile && "lg:col-span-4"
            )}>
              <QuickLaunchPad />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements - Hidden on mobile for performance */}
      {!isMobile && (
        <>
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-tech-cyan rounded-full animate-twinkle" />
          <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-primary rounded-full animate-twinkle" 
               style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-accent rounded-full animate-twinkle" 
               style={{ animationDelay: '2s' }} />
        </>
      )}
    </div>
  );
}