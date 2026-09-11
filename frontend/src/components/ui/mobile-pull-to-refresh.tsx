import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className,
  threshold = 80,
  disabled = false
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef(0);
  const scrollableRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const scrollTop = scrollableRef.current?.scrollTop || 0;
    if (scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [disabled, isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [disabled, isPulling, pullDistance, threshold, onRefresh]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);
  const showRefreshIndicator = pullDistance > 0 || isRefreshing;

  return (
    <div 
      ref={scrollableRef}
      className={cn("relative overflow-auto", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: isPulling ? `translateY(${Math.min(pullDistance * 0.5, 40)}px)` : undefined,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      {showRefreshIndicator && (
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 z-10",
            "flex items-center justify-center",
            "bg-background/80 backdrop-blur-sm border-b border-border/50",
            "transition-all duration-200 ease-out"
          )}
          style={{
            height: `${Math.max(pullDistance * 0.8, isRefreshing ? 60 : 0)}px`,
            opacity: refreshProgress
          }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <RefreshCw 
              className={cn(
                "w-5 h-5 transition-transform duration-200",
                isRefreshing ? "animate-spin" : "",
                refreshProgress >= 1 ? "text-primary" : ""
              )}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`
              }}
            />
            <span className="text-sm font-medium">
              {isRefreshing 
                ? 'در حال به‌روزرسانی...' 
                : refreshProgress >= 1 
                  ? 'رها کنید تا به‌روزرسانی شود'
                  : 'برای به‌روزرسانی بکشید'
              }
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div 
        className={cn(
          "transition-all duration-200 ease-out",
          showRefreshIndicator && "pt-2"
        )}
      >
        {children}
      </div>
    </div>
  );
}