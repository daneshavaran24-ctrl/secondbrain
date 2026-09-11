import React from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileOptimizedNav } from './mobile-optimized-nav';

interface ResponsiveNavigationProps {
  children: React.ReactNode;
  className?: string;
}

export function ResponsiveNavigation({ children, className }: ResponsiveNavigationProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn("relative", className)}>
      {children}
      
      {/* Mobile bottom navigation */}
      {isMobile && (
        <MobileOptimizedNav />
      )}
      
      {/* Add bottom padding on mobile to account for bottom nav */}
      {isMobile && (
        <div className="h-20" /> // Spacer for bottom navigation
      )}
    </div>
  );
}