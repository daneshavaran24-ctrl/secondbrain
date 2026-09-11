// Knowledge Management Service
import { KnowledgeItem, SearchFilters, SearchResult } from '@/types';

class KnowledgeService {
  private items: KnowledgeItem[] = [];
  
  // PARA Method Implementation
  async storeKnowledge(content: string, type: KnowledgeItem['type'], metadata?: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const item: KnowledgeItem = {
      id: crypto.randomUUID(),
      title: this.extractTitle(content),
      content,
      type,
      category: this.categorizeContent(content),
      tags: this.extractTags(content),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...metadata
    };
    
    // Auto-categorization using PARA method
    item.category = await this.smartCategorize(content);
    
    this.items.push(item);
    await this.saveToStorage(item);
    
    return item;
  }
  
  async searchKnowledge(query: string, filters?: SearchFilters): Promise<SearchResult> {
    let results = this.items;
    
    // Apply filters
    if (filters?.categories) {
      results = results.filter(item => filters.categories!.includes(item.category));
    }
    
    if (filters?.organizations) {
      results = results.filter(item => 
        item.organization && filters.organizations!.includes(item.organization)
      );
    }
    
    if (filters?.tags) {
      results = results.filter(item => 
        item.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    
    // Semantic search implementation
    const semanticResults = await this.semanticSearch(query, results);
    
    return {
      items: semanticResults,
      total: semanticResults.length,
      suggestions: this.generateSuggestions(query),
      related_searches: this.getRelatedSearches(query)
    };
  }
  
  private extractTitle(content: string): string {
    // Extract title from first line or first sentence
    const lines = content.split('\n');
    if (lines[0].length < 100) {
      return lines[0];
    }
    
    const sentences = content.split('.');
    return sentences[0].substring(0, 80) + '...';
  }
  
  private categorizeContent(content: string): KnowledgeItem['category'] {
    // Simple rule-based categorization
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('پروژه') || lowerContent.includes('project')) {
      return 'Projects';
    }
    
    if (lowerContent.includes('مسئولیت') || lowerContent.includes('وظیفه')) {
      return 'Areas';
    }
    
    if (lowerContent.includes('مقاله') || lowerContent.includes('منبع')) {
      return 'Resources';
    }
    
    return 'Archives';
  }
  
  private extractTags(content: string): string[] {
    const tags: string[] = [];
    
    // Extract Persian keywords
    const persianKeywords = [
      'ورید', 'فرانگران', 'انجمن', 'تولیدکنندگان', 'تجهیزات پزشکی',
      'خراسان رضوی', 'اتاق بازرگانی', 'صادرات', 'سلامت دیجیتال'
    ];
    
    persianKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        tags.push(keyword);
      }
    });
    
    return tags;
  }
  
  private async smartCategorize(content: string): Promise<KnowledgeItem['category']> {
    // This would use AI for better categorization
    // For now, using rule-based approach
    return this.categorizeContent(content);
  }
  
  private async semanticSearch(query: string, items: KnowledgeItem[]): Promise<KnowledgeItem[]> {
    // Simple text matching for now
    // In production, this would use embeddings
    return items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.content.toLowerCase().includes(query.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    );
  }
  
  private generateSuggestions(query: string): string[] {
    const suggestions = [
      'جلسات ورید',
      'فعالیت‌های فرانگران',
      'صادرات تجهیزات پزشکی',
      'پروژه‌های سلامت دیجیتال'
    ];
    
    return suggestions.filter(s => s !== query).slice(0, 3);
  }
  
  private getRelatedSearches(query: string): string[] {
    return [
      'مقالات مرتبط',
      'جلسات اخیر',
      'پروژه‌های فعال'
    ];
  }
  
  private async saveToStorage(item: KnowledgeItem): Promise<void> {
    // Save to IndexedDB for offline access
    const stored = localStorage.getItem('knowledgeItems') || '[]';
    const items = JSON.parse(stored);
    items.push(item);
    localStorage.setItem('knowledgeItems', JSON.stringify(items));
  }
  
  async loadFromStorage(): Promise<void> {
    const stored = localStorage.getItem('knowledgeItems') || '[]';
    this.items = JSON.parse(stored);
  }
}

export const knowledgeService = new KnowledgeService();