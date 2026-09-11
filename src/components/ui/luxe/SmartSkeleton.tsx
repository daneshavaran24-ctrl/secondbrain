import React from 'react';
import { cn } from '@/lib/utils';

interface SmartSkeletonProps {
  variant?: 'dashboard' | 'list' | 'card' | 'page';
  className?: string;
}

const Shimmer: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl bg-muted/40 backdrop-blur-md',
      'before:absolute before:inset-0 before:-translate-x-full',
      'before:bg-gradient-to-r before:from-transparent before:via-foreground/5 before:to-transparent',
      'motion-safe:before:animate-[shimmer_2s_infinite]',
      className
    )}
  />
);

/**
 * Page-level smart skeleton with shimmer that matches the luxe aesthetic.
 */
export const SmartSkeleton: React.FC<SmartSkeletonProps> = ({
  variant = 'page',
  className,
}) => {
  if (variant === 'dashboard') {
    return (
      <div className={cn('p-6 space-y-6', className)}>
        <Shimmer className="h-28 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Shimmer className="h-28" />
              <Shimmer className="h-28" />
              <Shimmer className="h-28" />
              <Shimmer className="h-28" />
            </div>
            <Shimmer className="h-64" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Shimmer className="h-40" />
            <Shimmer className="h-40" />
          </div>
        </div>
      </div>
    );
  }
  if (variant === 'list') {
    return (
      <div className={cn('p-6 space-y-3', className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Shimmer key={i} className="h-16" />
        ))}
      </div>
    );
  }
  if (variant === 'card') {
    return <Shimmer className={cn('h-48', className)} />;
  }
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <Shimmer className="h-12 w-1/3" />
      <Shimmer className="h-64" />
      <Shimmer className="h-32" />
    </div>
  );
};

export default SmartSkeleton;