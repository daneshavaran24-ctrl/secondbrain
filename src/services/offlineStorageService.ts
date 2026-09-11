/**
 * Offline Storage Service using IndexedDB
 * Provides persistent storage for offline functionality
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema types
interface MoraDB extends DBSchema {
  tasks: {
    key: string;
    value: {
      id: string;
      title: string;
      description?: string;
      status: 'todo' | 'in_progress' | 'completed';
      priority: 'low' | 'medium' | 'high' | 'urgent';
      dueDate?: string;
      domain: 'personal' | 'professional' | 'organizational';
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-status': string; 'by-sync': string; 'by-domain': string };
  };
  meetings: {
    key: string;
    value: {
      id: string;
      title: string;
      date: string;
      duration: number;
      participants: string[];
      location?: string;
      notes?: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-date': string; 'by-sync': string };
  };
  contacts: {
    key: string;
    value: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      organization?: string;
      role?: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-name': string; 'by-sync': string };
  };
  journals: {
    key: string;
    value: {
      id: string;
      content: string;
      mood?: string;
      tags?: string[];
      createdAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-date': string; 'by-sync': string };
  };
  // NEW: Knowledge items store for offline cultural content
  knowledgeItems: {
    key: string;
    value: {
      id: string;
      title: string;
      content: string;
      category: string;
      source_url?: string;
      tags: string[];
      createdAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
    };
    indexes: { 'by-category': string; 'by-sync': string };
  };
  assistantHistory: {
    key: string;
    value: {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      actions?: Array<{
        type?: string;
        function?: string;
        params: Record<string, unknown>;
        status: 'pending' | 'completed' | 'failed' | 'needs_confirmation' | 'needs_info';
        result?: unknown;
        error?: string;
      }>;
      timestamp: string;
      sessionId: string;
    };
    indexes: { 'by-session': string; 'by-timestamp': string };
  };
  pendingSync: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      entity: 'task' | 'meeting' | 'contact' | 'calendar_event' | 'journal' | 'knowledge_item';
      entityId: string;
      data: Record<string, unknown>;
      createdAt: string;
      retryCount: number;
      lastError?: string;
    };
    indexes: { 'by-type': string; 'by-created': string };
  };
  settings: {
    key: string;
    value: {
      key: string;
      value: unknown;
      updatedAt: string;
    };
  };
}

const DB_NAME = 'mora-offline-db';
const DB_VERSION = 3; // Incremented for new knowledgeItems store

class OfflineStorageService {
  private db: IDBPDatabase<MoraDB> | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<void> {
    try {
      this.db = await openDB<MoraDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion) {
          // Tasks store
          if (!db.objectStoreNames.contains('tasks')) {
            const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
            taskStore.createIndex('by-status', 'status');
            taskStore.createIndex('by-sync', 'syncStatus');
            taskStore.createIndex('by-domain', 'domain');
          }

          // Meetings store
          if (!db.objectStoreNames.contains('meetings')) {
            const meetingStore = db.createObjectStore('meetings', { keyPath: 'id' });
            meetingStore.createIndex('by-date', 'date');
            meetingStore.createIndex('by-sync', 'syncStatus');
          }

          // Contacts store
          if (!db.objectStoreNames.contains('contacts')) {
            const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
            contactStore.createIndex('by-name', 'name');
            contactStore.createIndex('by-sync', 'syncStatus');
          }

          // Journals store
          if (!db.objectStoreNames.contains('journals')) {
            const journalStore = db.createObjectStore('journals', { keyPath: 'id' });
            journalStore.createIndex('by-date', 'createdAt');
            journalStore.createIndex('by-sync', 'syncStatus');
          }

          // Knowledge items store (NEW for cultural content offline)
          if (!db.objectStoreNames.contains('knowledgeItems')) {
            const knowledgeStore = db.createObjectStore('knowledgeItems', { keyPath: 'id' });
            knowledgeStore.createIndex('by-category', 'category');
            knowledgeStore.createIndex('by-sync', 'syncStatus');
          }

          // Assistant history store
          if (!db.objectStoreNames.contains('assistantHistory')) {
            const historyStore = db.createObjectStore('assistantHistory', { keyPath: 'id' });
            historyStore.createIndex('by-session', 'sessionId');
            historyStore.createIndex('by-timestamp', 'timestamp');
          }

          // Pending sync store
          if (!db.objectStoreNames.contains('pendingSync')) {
            const syncStore = db.createObjectStore('pendingSync', { keyPath: 'id' });
            syncStore.createIndex('by-type', 'type');
            syncStore.createIndex('by-created', 'createdAt');
          }

          // Settings store
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'key' });
          }
        },
      });
      console.log('[OfflineStorage] Database initialized successfully');
    } catch (error) {
      console.error('[OfflineStorage] Failed to initialize database:', error);
      throw error;
    }
  }

  private async ensureDB(): Promise<IDBPDatabase<MoraDB>> {
    if (!this.db) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // ============== Tasks ==============
  async saveTask(task: MoraDB['tasks']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('tasks', task);
  }

  async getTask(id: string): Promise<MoraDB['tasks']['value'] | undefined> {
    const db = await this.ensureDB();
    return db.get('tasks', id);
  }

  async getAllTasks(): Promise<MoraDB['tasks']['value'][]> {
    const db = await this.ensureDB();
    return db.getAll('tasks');
  }

  async getTasksByStatus(status: string): Promise<MoraDB['tasks']['value'][]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('tasks', 'by-status', status);
  }

  async getTasksByDomain(domain: string): Promise<MoraDB['tasks']['value'][]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('tasks', 'by-domain', domain);
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('tasks', id);
  }

  // ============== Meetings ==============
  async saveMeeting(meeting: MoraDB['meetings']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('meetings', meeting);
  }

  async getMeeting(id: string): Promise<MoraDB['meetings']['value'] | undefined> {
    const db = await this.ensureDB();
    return db.get('meetings', id);
  }

  async getAllMeetings(): Promise<MoraDB['meetings']['value'][]> {
    const db = await this.ensureDB();
    return db.getAll('meetings');
  }

  async getMeetingsByDate(date: string): Promise<MoraDB['meetings']['value'][]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('meetings', 'by-date', date);
  }

  async deleteMeeting(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('meetings', id);
  }

  // ============== Contacts ==============
  async saveContact(contact: MoraDB['contacts']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('contacts', contact);
  }

  async getContact(id: string): Promise<MoraDB['contacts']['value'] | undefined> {
    const db = await this.ensureDB();
    return db.get('contacts', id);
  }

  async getAllContacts(): Promise<MoraDB['contacts']['value'][]> {
    const db = await this.ensureDB();
    return db.getAll('contacts');
  }

  async searchContacts(query: string): Promise<MoraDB['contacts']['value'][]> {
    const db = await this.ensureDB();
    const allContacts = await db.getAll('contacts');
    const lowerQuery = query.toLowerCase();
    return allContacts.filter(
      c => c.name.toLowerCase().includes(lowerQuery) ||
           c.email?.toLowerCase().includes(lowerQuery) ||
           c.organization?.toLowerCase().includes(lowerQuery)
    );
  }

  async deleteContact(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('contacts', id);
  }

  // ============== Journals (NEW) ==============
  async saveJournal(journal: MoraDB['journals']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('journals', journal);
  }

  async getJournal(id: string): Promise<MoraDB['journals']['value'] | undefined> {
    const db = await this.ensureDB();
    return db.get('journals', id);
  }

  async getAllJournals(): Promise<MoraDB['journals']['value'][]> {
    const db = await this.ensureDB();
    const journals = await db.getAll('journals');
    return journals.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentJournals(limit: number = 10): Promise<MoraDB['journals']['value'][]> {
    const all = await this.getAllJournals();
    return all.slice(0, limit);
  }

  async deleteJournal(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('journals', id);
  }

  // ============== Knowledge Items (for Cultural Content) ==============
  async saveKnowledgeItem(item: MoraDB['knowledgeItems']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('knowledgeItems', item);
  }

  async getKnowledgeItem(id: string): Promise<MoraDB['knowledgeItems']['value'] | undefined> {
    const db = await this.ensureDB();
    return db.get('knowledgeItems', id);
  }

  async getAllKnowledgeItems(): Promise<MoraDB['knowledgeItems']['value'][]> {
    const db = await this.ensureDB();
    const items = await db.getAll('knowledgeItems');
    return items.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getKnowledgeItemsByCategory(category: string): Promise<MoraDB['knowledgeItems']['value'][]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('knowledgeItems', 'by-category', category);
  }

  async searchKnowledgeItems(query: string): Promise<MoraDB['knowledgeItems']['value'][]> {
    const db = await this.ensureDB();
    const allItems = await db.getAll('knowledgeItems');
    const lowerQuery = query.toLowerCase();
    return allItems.filter(
      item => item.title.toLowerCase().includes(lowerQuery) ||
             item.content.toLowerCase().includes(lowerQuery) ||
             item.tags.some(t => t.toLowerCase().includes(lowerQuery))
    );
  }

  async deleteKnowledgeItem(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('knowledgeItems', id);
  }

  async syncKnowledgeItems(items: MoraDB['knowledgeItems']['value'][]): Promise<void> {
    const db = await this.ensureDB();
    const tx = db.transaction('knowledgeItems', 'readwrite');
    for (const item of items) {
      await tx.store.put({ ...item, syncStatus: 'synced' });
    }
    await tx.done;
  }
  async saveMessage(message: MoraDB['assistantHistory']['value']): Promise<void> {
    const db = await this.ensureDB();
    await db.put('assistantHistory', message);
  }

  async getSessionHistory(sessionId: string): Promise<MoraDB['assistantHistory']['value'][]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('assistantHistory', 'by-session', sessionId);
  }

  async getRecentHistory(limit: number = 50): Promise<MoraDB['assistantHistory']['value'][]> {
    const db = await this.ensureDB();
    const all = await db.getAll('assistantHistory');
    return all
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  async clearSessionHistory(sessionId: string): Promise<void> {
    const db = await this.ensureDB();
    const messages = await this.getSessionHistory(sessionId);
    const tx = db.transaction('assistantHistory', 'readwrite');
    await Promise.all(messages.map(m => tx.store.delete(m.id)));
    await tx.done;
  }

  // ============== Pending Sync ==============
  async addPendingAction(action: Omit<MoraDB['pendingSync']['value'], 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
    const db = await this.ensureDB();
    const id = crypto.randomUUID();
    await db.put('pendingSync', {
      ...action,
      id,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    });
    return id;
  }

  async getPendingActions(): Promise<MoraDB['pendingSync']['value'][]> {
    const db = await this.ensureDB();
    return db.getAll('pendingSync');
  }

  async getPendingActionCount(): Promise<number> {
    const db = await this.ensureDB();
    return db.count('pendingSync');
  }

  async removePendingAction(id: string): Promise<void> {
    const db = await this.ensureDB();
    await db.delete('pendingSync', id);
  }

  async updatePendingAction(id: string, updates: Partial<MoraDB['pendingSync']['value']>): Promise<void> {
    const db = await this.ensureDB();
    const existing = await db.get('pendingSync', id);
    if (existing) {
      await db.put('pendingSync', { ...existing, ...updates });
    }
  }

  // ============== Settings ==============
  async setSetting(key: string, value: unknown): Promise<void> {
    const db = await this.ensureDB();
    await db.put('settings', {
      key,
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const db = await this.ensureDB();
    const setting = await db.get('settings', key);
    return setting?.value as T | undefined;
  }

  // ============== Utility ==============
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    await Promise.all([
      db.clear('tasks'),
      db.clear('meetings'),
      db.clear('contacts'),
      db.clear('journals'),
      db.clear('knowledgeItems'),
      db.clear('assistantHistory'),
      db.clear('pendingSync'),
      db.clear('settings'),
    ]);
    console.log('[OfflineStorage] All data cleared');
  }

  async getStorageStats(): Promise<{
    tasks: number;
    meetings: number;
    contacts: number;
    journals: number;
    knowledgeItems: number;
    pendingActions: number;
  }> {
    const db = await this.ensureDB();
    return {
      tasks: await db.count('tasks'),
      meetings: await db.count('meetings'),
      contacts: await db.count('contacts'),
      journals: await db.count('journals'),
      knowledgeItems: await db.count('knowledgeItems'),
      pendingActions: await db.count('pendingSync'),
    };
  }
}

export const offlineStorage = new OfflineStorageService();
