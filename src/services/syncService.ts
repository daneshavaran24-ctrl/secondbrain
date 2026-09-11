/**
 * Sync Service - Handles online/offline synchronization
 * Manages pending actions queue and conflict resolution
 */

import { offlineStorage } from './offlineStorageService';
import { supabase } from '@/integrations/supabase/client';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private onlineListeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
    }

    // Listen for service worker sync messages
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'SYNC_PENDING_ACTIONS') {
          this.syncPendingActions();
        }
      });
    }
  }

  // ============== Online Status ==============
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  onOnlineChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineListeners.add(callback);
    return () => this.onlineListeners.delete(callback);
  }

  private notifyOnlineChange(isOnline: boolean): void {
    this.onlineListeners.forEach(listener => listener(isOnline));
  }

  private handleOnline(): void {
    console.log('[Sync] Back online');
    this.notifyOnlineChange(true);
    this.syncPendingActions();
  }

  private handleOffline(): void {
    console.log('[Sync] Went offline');
    this.notifyOnlineChange(false);
  }

  // ============== Sync Status ==============
  onSyncStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(callback);
    return () => this.syncListeners.delete(callback);
  }

  private notifySyncStatus(status: SyncStatus): void {
    this.syncListeners.forEach(listener => listener(status));
  }

  // ============== Queue Actions ==============
  async queueAction(
    type: 'create' | 'update' | 'delete',
    entity: 'task' | 'meeting' | 'contact' | 'calendar_event' | 'knowledge_item',
    entityId: string,
    data: Record<string, unknown>
  ): Promise<string> {
    const actionId = await offlineStorage.addPendingAction({
      type,
      entity,
      entityId,
      data,
    });

    console.log(`[Sync] Queued ${type} action for ${entity}:${entityId}`);

    // Try to sync immediately if online
    if (this.isOnline()) {
      this.syncPendingActions();
    } else {
      // Register for background sync
      this.registerBackgroundSync();
    }

    return actionId;
  }

  // ============== Background Sync ==============
  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-pending-actions');
        console.log('[Sync] Background sync registered');
      } catch (error) {
        console.log('[Sync] Background sync not supported:', error);
      }
    }
  }

  // ============== Sync Pending Actions ==============
  async syncPendingActions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log('[Sync] Already syncing...');
      return { success: true, synced: 0, failed: 0, errors: [] };
    }

    if (!this.isOnline()) {
      console.log('[Sync] Cannot sync - offline');
      return { success: false, synced: 0, failed: 0, errors: ['آفلاین هستید'] };
    }

    this.isSyncing = true;
    this.notifySyncStatus({ isSyncing: true, progress: 0 });

    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    };

    try {
      const pendingActions = await offlineStorage.getPendingActions();
      const total = pendingActions.length;

      console.log(`[Sync] Starting sync of ${total} pending actions`);

      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];
        
        try {
          await this.executeSyncAction(action);
          await offlineStorage.removePendingAction(action.id);
          result.synced++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'خطای ناشناخته';
          result.errors.push(`${action.entity}:${action.entityId} - ${errorMessage}`);
          result.failed++;

          // Update retry count
          await offlineStorage.updatePendingAction(action.id, {
            retryCount: action.retryCount + 1,
            lastError: errorMessage,
          });

          // Remove if too many retries
          if (action.retryCount >= 5) {
            console.log(`[Sync] Removing action after 5 retries: ${action.id}`);
            await offlineStorage.removePendingAction(action.id);
          }
        }

        this.notifySyncStatus({
          isSyncing: true,
          progress: Math.round(((i + 1) / total) * 100),
        });
      }

      result.success = result.failed === 0;
      console.log(`[Sync] Completed: ${result.synced} synced, ${result.failed} failed`);

    } finally {
      this.isSyncing = false;
      this.notifySyncStatus({ isSyncing: false, progress: 100 });
    }

    return result;
  }

  private async executeSyncAction(action: {
    type: 'create' | 'update' | 'delete';
    entity: string;
    entityId: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const { type, entity, entityId, data } = action;

    // Execute based on entity type - using direct API calls
    // This avoids TypeScript generic issues with dynamic table names
    switch (entity) {
      case 'task':
        await this.syncTask(type, entityId, data);
        break;
      case 'meeting':
        await this.syncMeeting(type, entityId, data);
        break;
      case 'contact':
        await this.syncContact(type, entityId, data);
        break;
      case 'calendar_event':
        await this.syncCalendarEvent(type, entityId, data);
        break;
      case 'knowledge_item':
        await this.syncKnowledgeItem(type, entityId, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private async syncTask(type: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'create':
        const { error: createError } = await supabase.from('company_tasks').insert({ id: entityId, ...data } as any);
        if (createError) throw createError;
        break;
      case 'update':
        const { error: updateError } = await supabase.from('company_tasks').update(data as any).eq('id', entityId);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase.from('company_tasks').delete().eq('id', entityId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncMeeting(type: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'create':
        const { error: createError } = await supabase.from('meetings').insert({ id: entityId, ...data } as any);
        if (createError) throw createError;
        break;
      case 'update':
        const { error: updateError } = await supabase.from('meetings').update(data as any).eq('id', entityId);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase.from('meetings').delete().eq('id', entityId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncContact(type: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'create':
        const { error: createError } = await supabase.from('company_contacts').insert({ id: entityId, ...data } as any);
        if (createError) throw createError;
        break;
      case 'update':
        const { error: updateError } = await supabase.from('company_contacts').update(data as any).eq('id', entityId);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase.from('company_contacts').delete().eq('id', entityId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncCalendarEvent(type: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'create':
        const { error: createError } = await supabase.from('calendar_events').insert({ id: entityId, ...data } as any);
        if (createError) throw createError;
        break;
      case 'update':
        const { error: updateError } = await supabase.from('calendar_events').update(data as any).eq('id', entityId);
        if (updateError) throw updateError;
        break;
      case 'delete':
        const { error: deleteError } = await supabase.from('calendar_events').delete().eq('id', entityId);
        if (deleteError) throw deleteError;
        break;
    }
  }

  private async syncKnowledgeItem(type: string, entityId: string, data: Record<string, unknown>): Promise<void> {
    switch (type) {
      case 'create':
        // Save to both knowledge_items and cultural_content
        const { error: createKnowledgeError } = await supabase.from('knowledge_items').insert({ id: entityId, ...data } as any);
        if (createKnowledgeError) console.error('[Sync] knowledge_items error:', createKnowledgeError);
        
        const { error: createCulturalError } = await supabase.from('cultural_content').insert({
          id: entityId,
          title: data.title,
          content: data.content || '',
          content_type: data.category || 'book',
          reference: data.source_url,
          tags: data.tags,
          language: 'fa'
        } as any);
        if (createCulturalError) console.error('[Sync] cultural_content error:', createCulturalError);
        break;
      case 'update':
        const { error: updateError } = await supabase.from('knowledge_items').update(data as any).eq('id', entityId);
        if (updateError) throw updateError;
        break;
      case 'delete':
        await supabase.from('knowledge_items').delete().eq('id', entityId);
        await supabase.from('cultural_content').delete().eq('id', entityId);
        break;
    }
  }

  // ============== Conflict Resolution ==============
  async resolveConflict(
    entityId: string,
    localData: Record<string, unknown>,
    serverData: Record<string, unknown>,
    strategy: 'local' | 'server' | 'merge'
  ): Promise<Record<string, unknown>> {
    switch (strategy) {
      case 'local':
        return localData;
      case 'server':
        return serverData;
      case 'merge':
        // Simple merge - server takes priority, but preserve local changes to unset fields
        return { ...localData, ...serverData };
      default:
        return serverData;
    }
  }

  // ============== Utility ==============
  async getPendingCount(): Promise<number> {
    return offlineStorage.getPendingActionCount();
  }

  async clearPendingActions(): Promise<void> {
    const actions = await offlineStorage.getPendingActions();
    for (const action of actions) {
      await offlineStorage.removePendingAction(action.id);
    }
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  progress: number;
}

export const syncService = new SyncService();
