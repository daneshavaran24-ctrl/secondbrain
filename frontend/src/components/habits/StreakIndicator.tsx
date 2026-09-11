import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PersianNumber } from '@/components/ui/persian-number';

interface StreakIndicatorProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
  streak,
  size = 'md',
  showLabel = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const getStreakColor = (count: number): string => {
    if (count === 0) return 'text-muted-foreground';
    if (count < 7) return 'text-orange-400';
    if (count < 30) return 'text-orange-500';
    if (count < 100) return 'text-orange-600';
    return 'text-orange-700';
  };

  const getStreakAnimation = (count: number): string => {
    if (count === 0) return '';
    if (count < 7) return 'animate-pulse';
    return 'animate-bounce';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        sizeClasses[size],
        getStreakColor(streak),
        className
      )}
    >
      <Flame
        className={cn(
          iconSizes[size],
          streak > 0 && getStreakAnimation(streak)
        )}
      />
      <span className="font-bold">
        <PersianNumber>{streak}</PersianNumber>
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          روز
        </span>
      )}
    </div>
  );
};
