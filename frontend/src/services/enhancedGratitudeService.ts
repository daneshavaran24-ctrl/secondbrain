/**
 * Enhanced Gratitude Service with Media Support
 * خدمات پیشرفته شکرگذاری با پشتیبانی از رسانه
 */

import { supabase } from "@/integrations/supabase/client";

export interface MediaFile {
  id: string;
  url: string;
  type: 'image' | 'video';
  filename: string;
  size?: number;
}

export interface GratitudeLink {
  id: string;
  url: string;
  title?: string;
  description?: string;
}

export interface EnhancedGratitudeEntry {
  id: string;
  user_id: string;
  date: string;
  content: string;
  mood?: string;
  tags?: string[];
  media_urls?: MediaFile[];
  links?: GratitudeLink[];
  created_at: string;
  updated_at?: string;
}

export interface LocalGratitudeEntry {
  id: string;
  date: string;
  content: string;
  mood?: string;
  tags?: string[];
  media_urls?: MediaFile[];
  links?: GratitudeLink[];
  created_at: string;
  updated_at?: string;
}

const STORAGE_KEY = 'enhanced_gratitude_entries';
const BUCKET_NAME = 'media';

export class EnhancedGratitudeService {
  /**
   * Upload media file to Supabase storage
   */
  async uploadMedia(file: File, userId: string): Promise<MediaFile> {
    const fileName = `gratitude/${userId}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      id: crypto.randomUUID(),
      url: publicUrl,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      filename: file.name,
      size: file.size
    };
  }

  /**
   * Get all entries (authenticated users from Supabase)
   */
  async getAllEntries(userId: string): Promise<EnhancedGratitudeEntry[]> {
    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;

    return data?.map(entry => ({
      ...entry,
      media_urls: Array.isArray(entry.media_urls) ? (entry.media_urls as unknown as MediaFile[]) : [],
      links: Array.isArray(entry.links) ? (entry.links as unknown as GratitudeLink[]) : []
    })) || [];
  }

  /**
   * Save/Update entry with media support
   */
  async saveEntry(
    date: string,
    content: string,
    mood?: string,
    tags: string[] = [],
    mediaFiles: MediaFile[] = [],
    links: GratitudeLink[] = [],
    userId?: string,
    existingEntryId?: string
  ): Promise<void> {
    const entryData = {
      date,
      content,
      mood: mood || null,
      tags,
      media_urls: JSON.parse(JSON.stringify(mediaFiles)) as any,
      user_id: userId
    };

    if (existingEntryId) {
      // Update existing entry
      const { error } = await supabase
        .from('gratitude_entries')
        .update(entryData)
        .eq('id', existingEntryId);

      if (error) throw error;
    } else {
      // Create new entry
      const { error } = await supabase
        .from('gratitude_entries')
        .insert(entryData);

      if (error) throw error;
    }
  }

  /**
   * Get entry for specific date
   */
  async getEntryForDate(date: string, userId: string): Promise<EnhancedGratitudeEntry | null> {
    const { data, error } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (error) throw error;

    return data ? {
      ...data,
      media_urls: Array.isArray(data.media_urls) ? (data.media_urls as unknown as MediaFile[]) : [],
      links: Array.isArray((data as any).links) ? ((data as any).links as unknown as GratitudeLink[]) : []
    } : null;
  }

  /**
   * Delete media file from storage
   */
  async deleteMedia(url: string): Promise<void> {
    // Extract file path from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `gratitude/${fileName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.warn('Failed to delete media file:', error);
      // Don't throw error as the database entry should still be updated
    }
  }

  /**
   * Cleanup all entries and media for a user
   */
  async cleanup(userId: string): Promise<void> {
    // Get all entries to find media files
    const entries = await this.getAllEntries(userId);
    
    // Delete all media files
    for (const entry of entries) {
      if (entry.media_urls && entry.media_urls.length > 0) {
        for (const media of entry.media_urls) {
          await this.deleteMedia(media.url);
        }
      }
    }

    // Delete all database entries
    const { error } = await supabase
      .from('gratitude_entries')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}

// Local storage service for non-authenticated users
export const gratitudeLocalService = {
  getAll(): LocalGratitudeEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  save(entries: LocalGratitudeEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },

  upsertForDate(
    date: string, 
    content: string,
    mood?: string,
    tags: string[] = [],
    mediaFiles: MediaFile[] = [],
    links: GratitudeLink[] = []
  ): LocalGratitudeEntry {
    const entries = this.getAll();
    const existingIndex = entries.findIndex(entry => entry.date === date);
    
    const entryData: LocalGratitudeEntry = {
      id: existingIndex >= 0 ? entries[existingIndex].id : crypto.randomUUID(),
      date,
      content,
      mood,
      tags,
      media_urls: mediaFiles,
      links: links,
      created_at: existingIndex >= 0 ? entries[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      entries[existingIndex] = entryData;
    } else {
      entries.unshift(entryData);
    }

    this.save(entries);
    return entryData;
  },

  getForDate(date: string): LocalGratitudeEntry | null {
    const entries = this.getAll();
    return entries.find(entry => entry.date === date) || null;
  },

  cleanup(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  }
};

export const enhancedGratitudeService = new EnhancedGratitudeService();