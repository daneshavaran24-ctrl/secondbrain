import { supabase } from '@/integrations/supabase/client';
import { KnowledgeItem, SearchFilters, SearchResult } from '@/types';
import { knowledgeService as localService } from './knowledgeService';

// Unified service: uses Supabase if user is authenticated, otherwise falls back to local storage
class SupabaseKnowledgeService {
  private async isAuthenticated(): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      return !!data.session?.user?.id;
    } catch {
      return false;
    }
  }

  private extractTitle(content: string): string {
    const firstLine = content.split('\n')[0].trim();
    return firstLine.slice(0, 80) || 'یادداشت جدید';
  }

  private categorizeContent(content: string): KnowledgeItem['category'] {
    const text = content.toLowerCase();
    if (/(project|پروژه|task|وظیفه)/i.test(text)) return 'Projects';
    if (/(area|حوزه|تمرکز|role|نقش)/i.test(text)) return 'Areas';
    if (/(resource|منبع|یادگیری|آموزش|راهنما)/i.test(text)) return 'Resources';
    return 'Archives';
  }

  async storeKnowledge(
    content: string,
    type: KnowledgeItem['type'],
    metadata?: Partial<KnowledgeItem>
  ): Promise<KnowledgeItem> {
    const useSupabase = await this.isAuthenticated();

    // Normalize type (avoid non-enum values like 'document')
    const normalizedType: KnowledgeItem['type'] = (['text','link','image','audio','pdf','video'] as const).includes(
      (type as any)
    ) ? type : 'text';

    if (!useSupabase) {
      return localService.storeKnowledge(content, normalizedType, metadata);
    }

    const userId = (await supabase.auth.getUser()).data.user?.id as string;

    const title = metadata?.title || this.extractTitle(content);
    const category = metadata?.category || this.categorizeContent(content);
    const tags = metadata?.tags || [];

    // Save to knowledge_items. We keep tags inside metadata.tags for simplicity
    const insertPayload: any = {
      user_id: userId,
      title,
      type: normalizedType,
      category,
      content: normalizedType === 'link' ? null : content,
      url: normalizedType === 'link' ? content : null,
      metadata: { ...(metadata?.metadata || {}), tags },
      folder_id: metadata?.folder_id,
    };

    const { data, error } = await (supabase as any).from('knowledge_base').insert({
      author_id: userId,
      title,
      content: normalizedType === 'link' ? null : content,
      category,
      tags: tags || [],
      folder_id: metadata?.folder_id,
    }).select('*').single();

    if (error || !data) {
      // Fallback to local if RLS prevents insert
      return localService.storeKnowledge(content, normalizedType, metadata);
    }

    const item: KnowledgeItem = {
      id: data.id,
      title: data.title,
      content: data.content || '',
      url: normalizedType === 'link' ? content : undefined,
      type: normalizedType,
      category: data.category,
      tags: (data.tags as string[]) || [],
      created_at: data.created_at,
      updated_at: data.updated_at,
      organization: undefined,
      related_items: [],
      embedding: undefined,
    } as any;

    return item;
  }

  async searchKnowledge(query: string, filters?: SearchFilters): Promise<SearchResult> {
    const useSupabase = await this.isAuthenticated();
    if (!useSupabase) {
      return localService.searchKnowledge(query, filters);
    }

    // Get the current user to filter by author_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return localService.searchKnowledge(query, filters);
    }

    let q = (supabase as any).from('knowledge_base')
      .select('*')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    const trimmed = query?.trim();
    if (trimmed) {
      // Use full-text search on the indexed tsvector column for faster and better results
      // Cast to any to avoid TS friction with tsvector column type
      q = (q as any).textSearch('search_vector', trimmed, { type: 'websearch', config: 'simple' });
    }

    if (filters?.categories?.length) {
      q = q.in('category', filters.categories as any);
    }

    if (filters?.type?.length) {
      q = q.in('type', filters.type as any);
    }

    // Optional tags filter: requires the metadata JSON to contain the provided tags (superset match)
    if ((filters as any)?.tags?.length) {
      q = q.contains('metadata', { tags: (filters as any).tags });
    }

    // Organization filter: only apply if provided values look like UUIDs
    if (filters?.organizations?.length) {
      const uuidRegex = /^[0-9a-fA-F-]{36}$/;
      const orgs = (filters.organizations as any[]).filter(v => typeof v === 'string' && uuidRegex.test(v));
      if (orgs.length) {
        q = q.in('organization_id', orgs as any);
      }
      // If values are not UUIDs (e.g., names), we skip applying this filter here.
    }

    // Folder filter
    if (filters?.folder_id) {
      if (filters.include_subfolders) {
        const subFolderIds = await this.getAllSubFolderIds(filters.folder_id);
        q = q.in('folder_id', [filters.folder_id, ...subFolderIds] as any);
      } else {
        q = q.eq('folder_id', filters.folder_id);
      }
    }

    const { data, error } = await q;

    if (error || !data) {
      console.warn('Supabase search failed, falling back to local storage', error);
      return localService.searchKnowledge(query, filters);
    }

    const items: KnowledgeItem[] = data.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content || '',
      url: undefined,
      type: 'text' as any,
      category: row.category,
      tags: (row.tags as string[]) || [],
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: undefined,
      related_items: [],
      embedding: undefined,
    }));

    // Simple suggestions: top tags + original query, de-duplicated
    const topTags = Array.from(new Set(items.flatMap(i => i.tags))).slice(0, 6);
    const suggestions = Array.from(new Set([trimmed, ...topTags].filter(Boolean))) as string[];

    return {
      items,
      total: items.length,
      suggestions,
      related: [],
    } as any;
  }

  async loadFromStorage(): Promise<void> {
    const useSupabase = await this.isAuthenticated();
    if (!useSupabase) {
      return localService.loadFromStorage();
    }
    // No-op for Supabase; data is fetched on demand
    return;
  }

  private async getAllSubFolderIds(folderId: string): Promise<string[]> {
    const { folderService } = await import('./folderService');
    const folders = await folderService.getFolders();
    const result: string[] = [];

    const traverse = (id: string) => {
      const children = folders.filter(f => f.parent_id === id);
      children.forEach(child => {
        result.push(child.id);
        traverse(child.id);
      });
    };

    traverse(folderId);
    return result;
  }
}

export const supabaseKnowledgeService = new SupabaseKnowledgeService();
