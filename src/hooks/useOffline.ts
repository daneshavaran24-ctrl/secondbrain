/**
 * useOffline Hook - Manages offline state and pending actions
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncStatus } from '@/services/syncService';
import { offlineStorage } from '@/services/offlineStorageService';

export interface OfflineState {
  isOnline: boolean;
  pendingActions: number;
  isSyncing: boolean;
  syncProgress: number;
  lastSyncTime: Date | null;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingActions: 0,
    isSyncing: false,
    syncProgress: 0,
    lastSyncTime: null,
  });

  // Load initial pending count
  useEffect(() => {
    const loadPendingCount = async () => {
      const count = await offlineStorage.getPendingActionCount();
      setState(prev => ({ ...prev, pendingActions: count }));
    };
    loadPendingCount();
  }, []);

  // Listen for online/offline changes
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Listen for sync status changes
  useEffect(() => {
    const unsubscribe = syncService.onSyncStatusChange((status: SyncStatus) => {
      setState(prev => ({
        ...prev,
        isSyncing: status.isSyncing,
        syncProgress: status.progress,
        lastSyncTime: !status.isSyncing && status.progress === 100 ? new Date() : prev.lastSyncTime,
      }));

      // Update pending count after sync
      if (!status.isSyncing) {
        offlineStorage.getPendingActionCount().then(count => {
          setState(prev => ({ ...prev, pendingActions: count }));
        });
      }
    });

    return unsubscribe;
  }, []);

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    if (!state.isOnline) {
      console.log('[useOffline] Cannot sync - offline');
      return { success: false, message: 'آفلاین هستید' };
    }

    const result = await syncService.syncPendingActions();
    return {
      success: result.success,
      message: result.success 
        ? `${result.synced} مورد همگام‌سازی شد`
        : `${result.failed} مورد با خطا مواجه شد`,
    };
  }, [state.isOnline]);

  // Queue an action for offline sync
  const queueAction = useCallback(async (
    type: 'create' | 'update' | 'delete',
    entity: 'task' | 'meeting' | 'contact' | 'calendar_event',
    entityId: string,
    data: Record<string, unknown>
  ) => {
    await syncService.queueAction(type, entity, entityId, data);
    const count = await offlineStorage.getPendingActionCount();
    setState(prev => ({ ...prev, pendingActions: count }));
  }, []);

  return {
    ...state,
    triggerSync,
    queueAction,
  };
}

// Register service worker hook
export function useServiceWorker() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service worker registered');
          setRegistration(reg);
          setIsRegistered(true);

          // Check for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    }
  }, []);

  const updateServiceWorker = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  return {
    isRegistered,
    updateAvailable,
    updateServiceWorker,
  };
}
