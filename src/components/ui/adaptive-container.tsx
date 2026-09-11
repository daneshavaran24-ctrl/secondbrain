import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useAdaptiveLayout } from '@/hooks/useAdaptiveLayout';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

interface AdaptiveContainerProps {
  children: ReactNode;
  className?: string;
  variant?: 'page' | 'section' | 'card' | 'list';
  enableSafeArea?: boolean;
  maxWidth?: boolean;
}

export function AdaptiveContainer({ 
  children, 
  className,
  variant = 'section',
  enableSafeArea,
  maxWidth = true
}: AdaptiveContainerProps) {
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();

  const baseClasses = cn(
    'w-full',
    maxWidth && layout.containerMaxWidth,
    enableSafeArea !== false && layout.enableSafeArea && 'safe-area-padding'
  );

  const variantClasses = {
    page: cn(
      'min-h-screen',
      layout.padding[device.type],
      device.isNative && 'pt-safe pb-safe'
    ),
    section: cn(
      layout.padding[device.type],
      layout.spacing[device.type]
    ),
    card: cn(
      'p-3 md:p-4 lg:p-6',
      'bg-card border border-border rounded-lg',
      'shadow-sm hover:shadow-md transition-shadow'
    ),
    list: cn(
      'space-y-2 md:space-y-3',
      layout.padding[device.type]
    )
  };

  const responsiveClasses = cn(
    baseClasses,
    variantClasses[variant],
    // Platform-specific adjustments
    device.platform === 'ios' && 'ios-scroll-fix',
    device.platform === 'android' && 'android-scroll-fix',
    className
  );

  return (
    <div className={responsiveClasses}>
      {children}
    </div>
  );
}

interface AdaptiveGridProps {
  children: ReactNode;
  className?: string;
  customCols?: { mobile: number; tablet: number; desktop: number };
}

export function AdaptiveGrid({ 
  children, 
  className,
  customCols
}: AdaptiveGridProps) {
  const device = useDeviceDetection();
  const layout = useAdaptiveLayout();
  
  const cols = customCols || layout.columns;
  
  const gridClasses = cn(
    'grid',
    `grid-cols-${cols.mobile}`,
    `md:grid-cols-${cols.tablet}`,
    `lg:grid-cols-${cols.desktop}`,
    layout.spacing[device.type],
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}