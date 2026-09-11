// Local storage service for gratitude entries
import { MediaFile, GratitudeLink } from './enhancedGratitudeService';

export interface LocalGratitudeEntry {
  id: string;
  date: string;
  gratitude_item_1: string;
  gratitude_item_2?: string;
  gratitude_item_3?: string;
  media_urls?: MediaFile[];
  links?: GratitudeLink[];
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = 'gratitude_entries';

export const gratitudeLocalService = {
  // Get all entries from localStorage
  getAll(): LocalGratitudeEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  // Save all entries to localStorage
  save(entries: LocalGratitudeEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  // Insert or update entry for a specific date
  upsertForDate(
    date: string, 
    payload: {
      gratitude_item_1: string;
      gratitude_item_2?: string;
      gratitude_item_3?: string;
    },
    mediaFiles: MediaFile[] = [],
    links: GratitudeLink[] = []
  ): LocalGratitudeEntry {
    const entries = this.getAll();
    const existingIndex = entries.findIndex(entry => entry.date === date);
    
    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing entry
      entries[existingIndex] = {
        ...entries[existingIndex],
        ...payload,
        media_urls: mediaFiles,
        links: links,
        updated_at: now
      };
      this.save(entries);
      return entries[existingIndex];
    } else {
      // Create new entry
      const newEntry: LocalGratitudeEntry = {
        id: `local-${Date.now()}`,
        date,
        ...payload,
        media_urls: mediaFiles,
        links: links,
        created_at: now
      };
      entries.push(newEntry);
      entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      this.save(entries);
      return newEntry;
    }
  },

  // Get entry for specific date
  getForDate(date: string): LocalGratitudeEntry | null {
    const entries = this.getAll();
    return entries.find(entry => entry.date === date) || null;
  }
};