import React from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { MinimalGreeting } from './minimal-greeting';
import { CompactControlCenter } from './compact-control-center';
import { AdaptiveQuickActions } from './adaptive-quick-actions';
import { ResponsiveLayoutEnhanced } from './responsive-layout-enhanced';
import { SmartGrid } from './smart-grid';
import CleanupCompleteButton from '@/components/debug/CleanupCompleteButton';
import { Building2 } from 'lucide-react';

interface MinimalDashboardProps {
  className?: string;
  sidebarOpen?: boolean;
}

export function MinimalDashboard({ 
  className, 
  sidebarOpen = false 
}: MinimalDashboardProps) {
  const { 
    isXs, isSm, isMd, isLg, isXl, is2Xl,
    isMobile, isTablet, isDesktop, 
    orientation, aspectRatio
  } = useResponsiveBreakpoints();
  
  return (
    <ResponsiveLayoutEnhanced
      variant="dashboard"
      sidebarOpen={sidebarOpen}
      padding={isXs ? "xs" : isSm ? "sm" : isMd ? "md" : "lg"}
      spacing="normal"
      className={cn(className)}
    >
      {/* Subtle background effects - adaptive to screen size */}
      {isDesktop && (
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <div className={cn(
            "absolute bg-primary/5 rounded-full blur-3xl",
            isLg ? "top-1/4 left-1/4 w-48 h-48" : "top-1/6 left-1/6 w-64 h-64"
          )} />
          <div className={cn(
            "absolute bg-accent/5 rounded-full blur-2xl",
            isLg ? "bottom-1/4 right-1/4 w-32 h-32" : "bottom-1/6 right-1/6 w-48 h-48"
          )} />
          {is2Xl && (
            <>
              <div className="absolute top-3/4 left-1/2 w-24 h-24 bg-tech-cyan/5 rounded-full blur-xl" />
              <div className="absolute top-1/2 right-1/6 w-16 h-16 bg-medical-blue/5 rounded-full blur-lg" />
            </>
          )}
        </div>
      )}

      {/* Greeting Section - Responsive sizing */}
      <div className={cn(
        "relative z-10",
        isXs ? "mb-4" : isSm ? "mb-5" : isMd ? "mb-6" : isLg ? "mb-8" : "mb-10"
      )}>
        <MinimalGreeting />
      </div>

      {/* Quick Access Section */}
      <QuickAccessSection />

      {/* Enhanced Main Content Layout */}
      <div className={cn(
        "relative z-10 w-full",
        // Flexible layout for better space utilization
        isMobile ? "space-y-4" : "flex gap-6",
        // Prevent overflow issues
        "overflow-hidden"
      )}>
        {/* Primary Content - Takes more space */}
        <div className={cn(
          "w-full",
          // Responsive spacing
          isXs ? "space-y-3" : isSm ? "space-y-4" : "space-y-6",
          // Flex-based width distribution
          !isMobile && "flex-[2] min-w-0",
          // Prevent content overflow
          "overflow-hidden"
        )}>
          <CompactControlCenter />
        </div>

        {/* Secondary Content - Adaptive sizing */}
        <div className={cn(
          "w-full",
          // Flex-based width distribution
          !isMobile && "flex-[1] min-w-0 max-w-sm",
          // Mobile spacing
          isMobile && "mt-4",
          // Prevent content overflow
          "overflow-hidden"
        )}>
          <AdaptiveQuickActions />
        </div>
      </div>

      {/* Additional content for ultra-wide screens */}
      {is2Xl && (
        <div className="mt-8 p-6 bg-card/50 backdrop-blur-sm rounded-xl border border-border/50">
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary mb-2">98%</div>
              <div className="text-sm text-muted-foreground">کارایی سیستم</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-tech-cyan mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">پشتیبانی</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-medical-blue mb-2">AI</div>
              <div className="text-sm text-muted-foreground">هوش مصنوعی</div>
            </div>
          </div>
        </div>
      )}

      {/* Cleanup Button for Development */}
      {/* <CleanupCompleteButton /> */}
    </ResponsiveLayoutEnhanced>
  );
}

// Quick Access Component
function QuickAccessSection() {
  const getMainCompany = () => {
    try {
      const stored = localStorage.getItem('main_company');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const getMainOrganization = () => {
    try {
      const stored = localStorage.getItem('main_organization');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  };

  const mainCompany = getMainCompany();
  const mainOrg = getMainOrganization();

  if (!mainCompany && !mainOrg) return null;

  return (
    <div className="relative z-10 mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">دسترسی سریع</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mainCompany && (
          <a 
            href="/companies"
            className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
          >
            <div className="p-2 rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mainCompany.company_name}</p>
              <p className="text-xs text-muted-foreground">شرکت اصلی</p>
            </div>
          </a>
        )}
        {mainOrg && (
          <a 
            href="/user-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-card/40 border border-border/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
          >
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950">
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mainOrg.name}</p>
              <p className="text-xs text-muted-foreground">سازمان اصلی</p>
            </div>
          </a>
        )}
      </div>
    </div>
  );
}