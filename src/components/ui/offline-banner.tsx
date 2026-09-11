/**
 * Offline Banner Component
 * Shows offline status and pending sync actions
 */

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Cloud, CloudOff, RefreshCw, CheckCircle } from 'lucide-react';
import { useOffline, useServiceWorker } from '@/hooks/useOffline';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { isOnline, pendingActions, isSyncing, syncProgress } = useOffline();
  const { updateAvailable, updateServiceWorker } = useServiceWorker();

  // Don't show if online with no pending actions and no updates
  if (isOnline && pendingActions === 0 && !updateAvailable && !isSyncing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-[100] px-4 py-2',
          'glass-header',
          className
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Status */}
          <div className="flex items-center gap-3">
            {!isOnline ? (
            <>
                <div className="flex items-center gap-2 text-warning">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-medium">آفلاین هستید</span>
                </div>
                {pendingActions > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <CloudOff className="h-3.5 w-3.5" />
                    <span>{pendingActions} اقدام در انتظار همگام‌سازی</span>
                  </div>
                )}
              </>
            ) : isSyncing ? (
              <div className="flex items-center gap-2 text-primary">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">در حال همگام‌سازی... {syncProgress}%</span>
                <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${syncProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            ) : pendingActions > 0 ? (
              <div className="flex items-center gap-2 text-primary">
                <Cloud className="h-4 w-4" />
                <span className="text-sm font-medium">{pendingActions} اقدام در حال همگام‌سازی</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">همه تغییرات همگام شد</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {updateAvailable && (
              <Button
                size="sm"
                variant="outline"
                onClick={updateServiceWorker}
                className="text-xs h-7"
              >
                به‌روزرسانی موجود
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating offline indicator for mobile
export function OfflineIndicator() {
  const { isOnline, pendingActions } = useOffline();

  if (isOnline && pendingActions === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        'fixed bottom-24 left-4 z-50',
        'flex items-center gap-2 px-3 py-2 rounded-full',
        'glass-card shadow-lg',
        !isOnline ? 'text-warning' : 'text-primary'
      )}
    >
      {!isOnline ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <Cloud className="h-4 w-4" />
      )}
      {pendingActions > 0 && (
        <span className="text-xs font-medium">{pendingActions}</span>
      )}
    </motion.div>
  );
}
