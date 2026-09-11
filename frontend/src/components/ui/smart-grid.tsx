import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';

interface SmartGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  autoFlow?: 'row' | 'col' | 'dense';
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  justifyItems?: 'start' | 'center' | 'end' | 'stretch';
}

export function SmartGrid({
  children,
  className,
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = { xs: 'gap-3', sm: 'gap-4', md: 'gap-4', lg: 'gap-6', xl: 'gap-6', '2xl': 'gap-8' },
  autoFlow = 'row',
  alignItems = 'stretch',
  justifyItems = 'stretch'
}: SmartGridProps) {
  const { screenSize } = useResponsiveBreakpoints();

  const getCurrentCols = () => {
    return cols[screenSize] || cols.xs || 1;
  };

  const getCurrentGap = () => {
    return gap[screenSize] || gap.xs || 'gap-3';
  };

  const gridClasses = cn(
    'grid',
    `grid-cols-${getCurrentCols()}`,
    getCurrentGap(),
    autoFlow === 'col' && 'grid-flow-col',
    autoFlow === 'dense' && 'grid-flow-row-dense',
    alignItems !== 'stretch' && `items-${alignItems}`,
    justifyItems !== 'stretch' && `justify-items-${justifyItems}`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

interface ResponsiveColumnsProps {
  children: ReactNode;
  className?: string;
  minWidth?: string;
  maxCols?: number;
  gap?: string;
}

export function ResponsiveColumns({
  children,
  className,
  minWidth = '280px',
  maxCols = 4,
  gap = 'gap-4'
}: ResponsiveColumnsProps) {
  const gridClasses = cn(
    'grid',
    gap,
    `grid-cols-[repeat(auto-fit,minmax(${minWidth},1fr))]`,
    `max-w-[repeat(${maxCols},1fr)]`,
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}

interface FlexibleGridProps {
  children: ReactNode;
  className?: string;
  minItemWidth: number;
  maxCols?: number;
  gap?: number;
  centered?: boolean;
}

export function FlexibleGrid({
  children,
  className,
  minItemWidth,
  maxCols = 6,
  gap = 16,
  centered = false
}: FlexibleGridProps) {
  const { width } = useResponsiveBreakpoints();
  
  const calculateCols = () => {
    const availableWidth = width - (gap * 2); // Account for container padding
    const itemsPerRow = Math.floor(availableWidth / (minItemWidth + gap));
    return Math.min(Math.max(1, itemsPerRow), maxCols);
  };

  const cols = calculateCols();

  const gridClasses = cn(
    'grid',
    `grid-cols-${cols}`,
    `gap-${gap / 4}`, // Convert px to rem equivalent
    centered && 'justify-items-center',
    className
  );

  return (
    <div className={gridClasses}>
      {children}
    </div>
  );
}