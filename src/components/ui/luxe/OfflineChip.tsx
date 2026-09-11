import React from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw } from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';
import { cn } from '@/lib/utils';

interface OfflineChipProps {
  className?: string;
  compact?: boolean;
}

/**
 * Compact connectivity + sync queue indicator for header.
 * Hidden when fully online with no queue.
 */
export const OfflineChip: React.FC<OfflineChipProps> = ({ className, compact = false }) => {
  const { isOnline, pendingActions, isSyncing } = useOffline();

  if (isOnline && !isSyncing && pendingActions === 0) return null;

  const tone = !isOnline
    ? 'text-amber-500 border-amber-500/30 bg-amber-500/10'
    : isSyncing
    ? 'text-primary border-primary/30 bg-primary/10'
    : 'text-primary border-primary/30 bg-primary/10';

  const Icon = !isOnline ? WifiOff : isSyncing ? RefreshCw : Cloud;
  const label = !isOnline
    ? 'آفلاین'
    : isSyncing
    ? 'همگام‌سازی...'
    : `${pendingActions} در صف`;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-md text-xs font-medium',
        tone,
        className
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} aria-hidden />
      {!compact && <span>{label}</span>}
      {pendingActions > 0 && isOnline && !isSyncing && (
        <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] tabular-nums">
          {pendingActions}
        </span>
      )}
    </div>
  );
};

export default OfflineChip;