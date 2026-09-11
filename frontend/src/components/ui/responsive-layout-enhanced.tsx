import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';

interface ResponsiveLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'dashboard' | 'page' | 'section' | 'modal' | 'sidebar';
  sidebarOpen?: boolean;
  maxWidth?: 'full' | 'screen-2xl' | 'screen-xl' | 'screen-lg' | 'screen-md' | 'screen-sm';
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'tight' | 'normal' | 'relaxed' | 'loose';
  centered?: boolean;
}

export function ResponsiveLayoutEnhanced({
  children,
  className,
  variant = 'page',
  sidebarOpen = false,
  maxWidth = 'screen-2xl',
  padding = 'md',
  spacing = 'normal',
  centered = false
}: ResponsiveLayoutProps) {
  const { 
    isXs, isSm, isMd, isLg, isXl, is2Xl, 
    isMobile, isTablet, isDesktop,
    orientation, aspectRatio 
  } = useResponsiveBreakpoints();

  // Dynamic padding based on screen size and variant
  const getPaddingClasses = () => {
    const basePadding = {
      none: '',
      xs: isXs ? 'p-2' : isSm ? 'p-3' : 'p-4',
      sm: isXs ? 'p-3' : isSm ? 'p-4' : isMd ? 'p-5' : 'p-6',
      md: isXs ? 'p-4' : isSm ? 'p-5' : isMd ? 'p-6' : isLg ? 'p-8' : 'p-10',
      lg: isXs ? 'p-5' : isSm ? 'p-6' : isMd ? 'p-8' : isLg ? 'p-10' : 'p-12',
      xl: isXs ? 'p-6' : isSm ? 'p-8' : isMd ? 'p-10' : isLg ? 'p-12' : 'p-16'
    };

    return basePadding[padding];
  };

  // Dynamic spacing between elements
  const getSpacingClasses = () => {
    const baseSpacing = {
      tight: isXs ? 'space-y-2' : isSm ? 'space-y-3' : 'space-y-4',
      normal: isXs ? 'space-y-4' : isSm ? 'space-y-5' : isMd ? 'space-y-6' : 'space-y-8',
      relaxed: isXs ? 'space-y-5' : isSm ? 'space-y-6' : isMd ? 'space-y-8' : 'space-y-10',
      loose: isXs ? 'space-y-6' : isSm ? 'space-y-8' : isMd ? 'space-y-10' : 'space-y-12'
    };

    return baseSpacing[spacing];
  };

  // Sidebar-aware margins - removed to prevent double margins
  const getSidebarMargins = () => {
    // Margins are now handled at the main container level in Index.tsx
    return '';
  };

  // Container max width
  const getMaxWidthClasses = () => {
    const widthMap = {
      full: 'max-w-full',
      'screen-2xl': 'max-w-screen-2xl',
      'screen-xl': 'max-w-screen-xl',
      'screen-lg': 'max-w-screen-lg',
      'screen-md': 'max-w-screen-md',
      'screen-sm': 'max-w-screen-sm'
    };

    return widthMap[maxWidth];
  };

  // Variant-specific styles
  const getVariantClasses = () => {
    switch (variant) {
      case 'dashboard':
        return cn(
          'w-full bg-gradient-subtle',
          // Responsive height handling
          isXs ? 'min-h-[calc(100vh-6rem)]' : 
          isSm ? 'min-h-[calc(100vh-7rem)]' : 
          'min-h-screen',
          // Mobile navigation adjustments
          isMobile && 'pb-safe pt-safe',
          // Prevent horizontal scroll
          'overflow-x-hidden'
        );
      case 'page':
        return 'min-h-screen';
      case 'section':
        return 'w-full';
      case 'modal':
        return cn(
          'bg-background rounded-lg shadow-luxury',
          isMobile ? 'mx-4 my-8' : 'mx-auto my-16'
        );
      case 'sidebar':
        return cn(
          'h-full',
          isMobile && 'w-full',
          !isMobile && 'w-64 lg:w-72 xl:w-80'
        );
      default:
        return '';
    }
  };

  // Handle landscape mobile differently
  const getLandscapeAdjustments = () => {
    if (isMobile && orientation === 'landscape') {
      return 'px-safe-x';
    }
    return '';
  };

  const containerClasses = cn(
    getVariantClasses(),
    getPaddingClasses(),
    getSpacingClasses(),
    getSidebarMargins(),
    getMaxWidthClasses(),
    getLandscapeAdjustments(),
    centered && 'mx-auto',
    // Enhanced responsiveness
    'w-full max-w-full',
    // Prevent layout shifts
    'box-border',
    // Smooth transitions
    'transition-all duration-300 ease-in-out',
    className
  );

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
}

interface ResponsiveGridLayoutProps {
  children: ReactNode;
  className?: string;
  areas?: {
    mobile: string[];
    tablet?: string[];
    desktop?: string[];
  };
  columns?: {
    mobile: string;
    tablet?: string;
    desktop?: string;
  };
  rows?: {
    mobile: string;
    tablet?: string;
    desktop?: string;
  };
  gap?: string;
}

export function ResponsiveGridLayout({
  children,
  className,
  areas,
  columns,
  rows,
  gap = 'gap-4 md:gap-6 lg:gap-8'
}: ResponsiveGridLayoutProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();

  const getCurrentLayout = () => {
    if (isDesktop && areas?.desktop) return areas.desktop;
    if (isTablet && areas?.tablet) return areas.tablet;
    return areas?.mobile || [];
  };

  const getCurrentColumns = () => {
    if (isDesktop && columns?.desktop) return columns.desktop;
    if (isTablet && columns?.tablet) return columns.tablet;
    return columns?.mobile || 'repeat(1, 1fr)';
  };

  const getCurrentRows = () => {
    if (isDesktop && rows?.desktop) return rows.desktop;
    if (isTablet && rows?.tablet) return rows.tablet;
    return rows?.mobile || 'auto';
  };

  const gridStyle = {
    gridTemplateAreas: getCurrentLayout().map(row => `"${row}"`).join(' '),
    gridTemplateColumns: getCurrentColumns(),
    gridTemplateRows: getCurrentRows()
  };

  return (
    <div 
      className={cn('grid', gap, className)}
      style={gridStyle}
    >
      {children}
    </div>
  );
}

interface ResponsiveStackProps {
  children: ReactNode;
  className?: string;
  direction?: {
    mobile: 'vertical' | 'horizontal';
    tablet?: 'vertical' | 'horizontal';
    desktop?: 'vertical' | 'horizontal';
  };
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  spacing?: string;
  wrap?: boolean;
}

export function ResponsiveStack({
  children,
  className,
  direction = { mobile: 'vertical' },
  align = 'stretch',
  justify = 'start',
  spacing = 'gap-4',
  wrap = false
}: ResponsiveStackProps) {
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints();

  const getCurrentDirection = () => {
    if (isDesktop && direction.desktop) return direction.desktop;
    if (isTablet && direction.tablet) return direction.tablet;
    return direction.mobile;
  };

  const directionClasses = getCurrentDirection() === 'vertical' ? 'flex-col' : 'flex-row';
  const alignClasses = `items-${align}`;
  const justifyClasses = `justify-${justify}`;

  return (
    <div className={cn(
      'flex',
      directionClasses,
      alignClasses,
      justifyClasses,
      spacing,
      wrap && 'flex-wrap',
      className
    )}>
      {children}
    </div>
  );
}