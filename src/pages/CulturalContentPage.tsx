import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight, Plus, Search, Filter, Book, Film, Headphones, AudioLines, FileText, Play, ExternalLink, Trash2, Edit, Grid, List, Sparkles, Settings, Drama, Tag, RefreshCw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { AppIcon } from '@/components/ui/app-icon';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';
import { TabsListScrollable } from '@/components/ui/tabs-list-scrollable';
import { MobileSheetFilter } from '@/components/ui/mobile-sheet-filter';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from '@/hooks/use-toast';
import { AddItemModal } from '@/components/modals/AddItemModal';
import { AIPreferencesDialog } from '@/components/ai/AIPreferencesDialog';
import { AISummaryDrawer } from '@/components/ai/AISummaryDrawer';
import { AIMindmapDrawer } from '@/components/ai/AIMindmapDrawer';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { useHotkeys } from 'react-hotkeys-hook';
import { SectionHeader } from '@/components/ui/section-header';
import { EmptyState } from '@/components/ui/empty-state';
import { ModernCard } from '@/components/ui/modern-card';
import { ModernButton } from '@/components/ui/modern-button';
import { LuxuryTabs } from '@/components/ui/luxury-tabs';
import { LuxuryToolbar } from '@/components/ui/luxury-toolbar';
import { categoryService } from '@/services/categoryService';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage } from '@/services/offlineStorageService';

export interface ContentItem {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  link?: string;
  pdfFile?: string;  // Added for PDF uploads
  pdfUrl?: string;   // Added for PDF links
  type: 'book' | 'movie' | 'series' | 'youtube' | 'podcast' | 'audiobook' | 'article' | 'theater';
  status: 'planning' | 'in-progress' | 'completed' | 'archived';
  category?: string; // Added for categorization
  tags?: string[];
  rating?: number;
  progress?: number;
  aiSummary?: any;
  mindmap?: any;
  createdAt: string;
  updatedAt: string;
}

type TabType = 'books' | 'movies' | 'podcasts' | 'audiobooks' | 'articles' | 'theater';

const CulturalContentPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [movieTypeFilter, setMovieTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAiPrefsOpen, setIsAiPrefsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isSummaryDrawerOpen, setIsSummaryDrawerOpen] = useState(false);
  const [isMindmapDrawerOpen, setIsMindmapDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  // NEW: Track counts for all tabs to show on initial load
  const [tabCounts, setTabCounts] = useState<Record<TabType, number>>({
    books: 0, movies: 0, podcasts: 0, audiobooks: 0, articles: 0, theater: 0
  });
  const isMobile = useIsMobile();

  // Map content_type to tab for counting
  const mapContentTypeToTab = useCallback((contentType: string): TabType => {
    switch (contentType) {
      case 'book': return 'books';
      case 'movie': case 'series': case 'youtube': return 'movies';
      case 'podcast': return 'podcasts';
      case 'audiobook': return 'audiobooks';
      case 'article': return 'articles';
      case 'theater': return 'theater';
      default: return 'books';
    }
  }, []);

  // Load all tab counts on mount
  useEffect(() => {
    const loadAllCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('cultural_content')
          .select('content_type');
        
        if (error) {
          console.error('[CulturalContent] Count fetch error:', error);
          return;
        }
        
        if (data) {
          const counts: Record<TabType, number> = {
            books: 0, movies: 0, podcasts: 0, audiobooks: 0, articles: 0, theater: 0
          };
          
          data.forEach(item => {
            const tab = mapContentTypeToTab(item.content_type);
            counts[tab] = (counts[tab] || 0) + 1;
          });
          
          setTabCounts(counts);
        }
      } catch (e) {
        console.error('[CulturalContent] Failed to load counts:', e);
      }
    };
    
    loadAllCounts();
  }, [mapContentTypeToTab]);

  // Command palette shortcut
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setIsCommandPaletteOpen(true);
  });

  // Map activeTab to content_type for Supabase query
  const getContentTypeForTab = useCallback((tab: TabType): string[] => {
    switch (tab) {
      case 'books': return ['book'];
      case 'movies': return ['movie', 'series', 'youtube'];
      case 'podcasts': return ['podcast'];
      case 'audiobooks': return ['audiobook'];
      case 'articles': return ['article'];
      case 'theater': return ['theater'];
      default: return ['book'];
    }
  }, []);

  // Load items from Supabase AND IndexedDB (for offline support)
  const loadItems = useCallback(async () => {
    setIsLoading(true);
    categoryService.initializeDefaultCategories('cultural');
    setCategories(categoryService.getCustomCategories('cultural'));

    const contentTypes = getContentTypeForTab(activeTab);
    
    // 1. First load from IndexedDB (for offline/instant display)
    try {
      const localItems = await offlineStorage.getAllKnowledgeItems();
      const filteredLocal = localItems.filter(item => 
        contentTypes.includes(item.category)
      );
      if (filteredLocal.length > 0) {
        setItems(filteredLocal.map(item => ({
          id: item.id,
          title: item.title,
          description: item.content,
          type: item.category as ContentItem['type'],
          status: 'planning' as const,
          tags: item.tags,
          link: item.source_url,
          createdAt: item.createdAt,
          updatedAt: item.createdAt
        })));
      }
    } catch (e) {
      console.log('[CulturalContent] IndexedDB not available:', e);
    }

    // 2. Then load from Supabase (fresh data)
    try {
      const { data, error } = await supabase
        .from('cultural_content')
        .select('*')
        .in('content_type', contentTypes)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[CulturalContent] Supabase error:', error);
        // Fall back to localStorage if Supabase fails
        const storageKey = `cw_${activeTab}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          setItems(JSON.parse(stored));
        }
      } else if (data && data.length > 0) {
        const mappedItems: ContentItem[] = data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.content,
          type: item.content_type as ContentItem['type'],
          status: 'planning' as const,
          tags: item.tags || [],
          link: item.reference,
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.created_at || new Date().toISOString()
        }));
        setItems(mappedItems);
        
        // Save to IndexedDB for offline access
        try {
          await offlineStorage.syncKnowledgeItems(data.map(item => ({
            id: item.id,
            title: item.title,
            content: item.content,
            category: item.content_type,
            source_url: item.reference || undefined,
            tags: item.tags || [],
            createdAt: item.created_at || new Date().toISOString(),
            syncStatus: 'synced' as const
          })));
        } catch (e) {
          console.log('[CulturalContent] IndexedDB sync skipped:', e);
        }
      } else {
        // No data in Supabase, try localStorage as fallback
        const storageKey = `cw_${activeTab}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          try {
            setItems(JSON.parse(stored));
          } catch {
            setItems([]);
          }
        } else {
          setItems([]);
        }
      }
    } catch (e) {
      console.error('[CulturalContent] Failed to load:', e);
    }
    
    setIsLoading(false);
  }, [activeTab, getContentTypeForTab]);

  // Initialize and load items
  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Save items to localStorage
  const saveItems = (newItems: ContentItem[]) => {
    const storageKey = `cw_${activeTab}`;
    localStorage.setItem(storageKey, JSON.stringify(newItems));
    setItems(newItems);
  };

  // Generate YouTube thumbnail URL
  const getYouTubeThumbnail = (url: string): string => {
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (videoIdMatch) {
      return `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
    }
    return '/placeholder.svg';
  };

  // Get effective cover image
  const getEffectiveCoverImage = (item: ContentItem): string => {
    if (item.coverImage) return item.coverImage;
    if (item.type === 'youtube' && item.link) {
      return getYouTubeThumbnail(item.link);
    }
    return '/placeholder.svg';
  };

  // Handle add item
  const handleAddItem = (itemData: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ContentItem = {
      ...itemData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const newItems = [...items, newItem];
    saveItems(newItems);
    toast({
      title: "آیتم اضافه شد",
      description: `${newItem.title} با موفقیت اضافه شد.`,
    });
  };

  // Handle delete item
  const handleDeleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    saveItems(newItems);
    toast({
      title: "آیتم حذف شد",
      description: "آیتم با موفقیت حذف شد.",
    });
  };

  // Handle update item (for AI summaries/mindmaps)
  const handleUpdateItem = (id: string, updates: Partial<ContentItem>) => {
    const newItems = items.map(item =>
      item.id === id
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    );
    saveItems(newItems);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesMovieType = activeTab !== 'movies' || movieTypeFilter === 'all' || item.type === movieTypeFilter;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesMovieType;
  });

  // Get tab content type
  const getTabContentType = (tab: TabType): ContentItem['type'][] => {
    switch (tab) {
      case 'books': return ['book'];
      case 'movies': return ['movie', 'series', 'youtube'];
      case 'podcasts': return ['podcast'];
      case 'audiobooks': return ['audiobook'];
      case 'articles': return ['article'];
      case 'theater': return ['theater'];
      default: return ['book'];
    }
  };

  // Handle AI Summary
  const handleAISummary = (item: ContentItem) => {
    setSelectedItem(item);
    setIsSummaryDrawerOpen(true);
  };

  // Handle AI Mindmap
  const handleAIMindmap = (item: ContentItem) => {
    setSelectedItem(item);
    setIsMindmapDrawerOpen(true);
  };

  // Handle external link click
  const handleExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Get status label in Persian based on content type
  const getStatusLabel = (status: ContentItem['status'], type?: ContentItem['type']): string => {
    const isWatchableContent = type && ['movie', 'series', 'youtube', 'theater'].includes(type);
    const isListenableContent = type && ['podcast', 'audiobook'].includes(type);
    const isReadableContent = type && ['book', 'article'].includes(type);
    
    switch (status) {
      case 'planning':
        if (isWatchableContent) return 'در صف تماشا';
        if (isListenableContent) return 'در صف شنیدن';
        if (isReadableContent) return 'در صف مطالعه';
        return 'در صف';
      case 'in-progress':
        if (isWatchableContent) return 'در حال تماشا';
        if (isListenableContent) return 'در حال شنیدن';
        if (isReadableContent) return 'در حال خواندن';
        return 'در جریان';
      case 'completed':
        if (isWatchableContent) return 'دیده شده';
        if (isListenableContent) return 'شنیده شده';
        if (isReadableContent) return 'خوانده شده';
        return 'تمام شده';
      case 'archived': return 'بایگانی';
      default: return status;
    }
  };

  return (
    <div className={cn(
      "container mx-auto animate-fade-in",
      isMobile ? "p-4 space-y-6" : "p-6 space-y-8"
    )} dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <ModernButton 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/'}
          icon={<ArrowRight className="h-4 w-4" />}
          iconPosition="right"
        >
          بازگشت به صفحه اصلی
        </ModernButton>
        <span>/</span>
        <span>مدیریت محتوای فرهنگی</span>
      </div>

      {/* Luxury Header */}
      <SectionHeader
        title="مدیریت محتوای فرهنگی"
        subtitle="مدیریت کتاب‌ها، مقالات، فیلم‌ها، پادکست‌ها و کتاب‌های صوتی با کمک هوش مصنوعی"
        icon={<Sparkles className="h-6 w-6" />}
        gradient
        action={
          <>
            <ModernButton 
              onClick={() => setIsAiPrefsOpen(true)} 
              variant="outline"
              icon={<Settings className="h-4 w-4" />}
              magnetic
            >
              تنظیمات AI
            </ModernButton>
            <ModernButton 
              onClick={() => setIsAddModalOpen(true)}
              icon={<Plus className="h-4 w-4" />}
              magnetic
              glow
              className="bg-gradient-luxury-gold hover:bg-gradient-luxury-ember"
            >
              افزودن آیتم
            </ModernButton>
          </>
        }
      />

      {/* Search and Filters Toolbar - Mobile Responsive */}
      <LuxuryToolbar className={cn(
        isMobile ? "flex-col gap-4" : "flex-row gap-4"
      )}>
        <div className="relative flex-1">
          <AppIcon size="sm" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            <Search />
          </AppIcon>
          <Input
            placeholder="جستجو در عنوان یا توضیحات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pr-10 text-body border-2 focus:ring-2 focus:ring-lux-gold/20 w-full",
              isMobile ? "h-11" : "h-12"
            )}
          />
        </div>
        
        {isMobile ? (
          <MobileSheetFilter title="فیلترهای محتوا">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="planning">در صف</SelectItem>
                <SelectItem value="in-progress">در جریان</SelectItem>
                <SelectItem value="completed">تمام شده</SelectItem>
                <SelectItem value="archived">بایگانی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-12">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex bg-lux-pearl rounded-xl p-1 w-full">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex-1"
              >
                <AppIcon size="xs">
                  <Grid />
                </AppIcon>
                شبکه
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="flex-1"
              >
                <AppIcon size="xs">
                  <List />
                </AppIcon>
                لیست
              </Button>
            </div>
          </MobileSheetFilter>
        ) : (
          <div className="flex gap-3 items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 h-12">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="planning">در صف</SelectItem>
                <SelectItem value="in-progress">در جریان</SelectItem>
                <SelectItem value="completed">تمام شده</SelectItem>
                <SelectItem value="archived">بایگانی</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48 h-12">
                <SelectValue placeholder="دسته‌بندی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌بندی‌ها</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex bg-lux-pearl rounded-xl p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-3"
              >
                <AppIcon size="xs">
                  <Grid />
                </AppIcon>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-3"
              >
                <AppIcon size="xs">
                  <List />
                </AppIcon>
              </Button>
            </div>
          </div>
        )}
      </LuxuryToolbar>

      {/* Luxury Tabs */}
      <LuxuryTabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabType)}
        items={[
          { 
            value: 'books', 
            label: isMobile ? 'کتاب' : 'کتاب‌ها', 
            icon: <AppIcon size="xs"><Book /></AppIcon>,
            count: items.filter(item => item.type === 'book').length
          },
          { 
            value: 'articles', 
            label: isMobile ? 'مقاله' : 'مقالات', 
            icon: <AppIcon size="xs"><FileText /></AppIcon>,
            count: items.filter(item => item.type === 'article').length
          },
          { 
            value: 'movies', 
            label: isMobile ? 'فیلم' : 'فیلم‌ها', 
            icon: <AppIcon size="xs"><Film /></AppIcon>,
            count: items.filter(item => ['movie', 'series', 'youtube'].includes(item.type)).length
          },
          { 
            value: 'podcasts', 
            label: isMobile ? 'پادکست' : 'پادکست‌ها', 
            icon: <AppIcon size="xs"><Headphones /></AppIcon>,
            count: items.filter(item => item.type === 'podcast').length
          },
          { 
            value: 'audiobooks', 
            label: isMobile ? 'صوتی' : 'کتاب‌های صوتی', 
            icon: <AppIcon size="xs"><AudioLines /></AppIcon>,
            count: items.filter(item => item.type === 'audiobook').length
          },
          { 
            value: 'theater', 
            label: isMobile ? 'تئاتر' : 'تئاتر', 
            icon: <AppIcon size="xs"><Drama /></AppIcon>,
            count: items.filter(item => item.type === 'theater').length
          }
        ]}
      >

        <TabsContent value="books" className="space-y-6">
          {/* Books specific content */}
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Book className="h-16 w-16" />}
              title="هیچ کتابی یافت نشد"
              description="کتاب اول خود را اضافه کنید و شروع به ساختن کتابخانه دیجیتال خود کنید"
              action={{
                label: "افزودن کتاب",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <ResponsiveGrid
              cols={viewMode === 'grid' ? {
                default: 1,
                sm: 2,
                md: isMobile ? 2 : 3,
                lg: isMobile ? 3 : 4,
                xl: 5
              } : { default: 1 }}
              gap="md"
              className={viewMode === 'list' ? 'flex flex-col space-y-4' : ''}
            >
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4">
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 3/4}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 h-8 w-8 p-0"
                        onClick={() => handleExternalLink(item.link!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                   <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                     <div className="flex items-center justify-between flex-wrap gap-2">
                       <div className="flex flex-wrap gap-1">
                         <Badge 
                           variant="outline" 
                           className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                         >
                           {getStatusLabel(item.status, item.type)}
                         </Badge>
                         {item.category && (
                           <Badge 
                             variant="secondary" 
                             className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary text-xs"
                           >
                             <Tag className="h-3 w-3 ml-1" />
                             {item.category}
                           </Badge>
                         )}
                       </div>
                       {item.rating && (
                         <div className="text-xs sm:text-sm text-lux-gold font-medium">
                           ⭐ {item.rating}/5
                         </div>
                       )}
                     </div>
                    
                     <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAISummary(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         خلاصه‌سازی
                       </ModernButton>
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAIMindmap(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         مایندمپ
                       </ModernButton>
                       {(item.pdfFile || item.pdfUrl) && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleExternalLink(item.pdfFile || item.pdfUrl!)}
                           className="text-primary hover:bg-primary/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                         >
                           <FileText className="h-3 w-3" />
                         </Button>
                       )}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDeleteItem(item.id)}
                         className="text-destructive hover:bg-destructive/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                  </div>
                </ModernCard>
              ))}
            </ResponsiveGrid>
          )}
        </TabsContent>

        <TabsContent value="movies" className="space-y-4">
          {/* Movies specific filters */}
          <div className="flex justify-end">
            <Select value={movieTypeFilter} onValueChange={setMovieTypeFilter}>
              <SelectTrigger className="w-32 sm:w-40">
                <SelectValue placeholder="نوع محتوا" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                <SelectItem value="movie">فیلم</SelectItem>
                <SelectItem value="series">سریال</SelectItem>
                <SelectItem value="youtube">یوتیوب</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Movies grid */}
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Film className="h-16 w-16" />}
              title="هیچ فیلمی یافت نشد"
              description="اولین فیلم یا سریال خود را اضافه کنید"
              action={{
                label: "افزودن فیلم",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <div className={`gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                : 'flex flex-col space-y-4'
            }`}>
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4 cursor-pointer" onClick={() => item.link && handleExternalLink(item.link)}>
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 2/3}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                        <Play className="h-8 w-8 text-white" />
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2 text-xs" variant="secondary">
                      {item.type === 'movie' ? 'فیلم' : item.type === 'series' ? 'سریال' : 'یوتیوب'}
                    </Badge>
                  </div>
                  
                   <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                     <div className="flex items-center justify-between flex-wrap gap-2">
                       <div className="flex flex-wrap gap-1">
                         <Badge 
                           variant="outline" 
                           className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                         >
                           {getStatusLabel(item.status, item.type)}
                         </Badge>
                         {item.category && (
                           <Badge 
                             variant="secondary" 
                             className="bg-gradient-to-r from-primary/10 to-primary/20 text-primary text-xs"
                           >
                             <Tag className="h-3 w-3 ml-1" />
                             {item.category}
                           </Badge>
                         )}
                       </div>
                       {item.rating && (
                         <div className="text-xs sm:text-sm text-lux-gold font-medium">
                           ⭐ {item.rating}/5
                         </div>
                       )}
                     </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="podcasts" className="space-y-6">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Headphones className="h-16 w-16" />}
              title="هیچ پادکستی یافت نشد"
              description="اولین پادکست خود را اضافه کنید"
              action={{
                label: "افزودن پادکست",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <div className={`gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                : 'flex flex-col space-y-4'
            }`}>
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4">
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 1}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 h-8 w-8 p-0"
                        onClick={() => handleExternalLink(item.link!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                      >
                        {getStatusLabel(item.status, item.type)}
                      </Badge>
                      {item.rating && (
                        <div className="text-xs sm:text-sm text-lux-gold font-medium">
                          ⭐ {item.rating}/5
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audiobooks" className="space-y-6">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<AudioLines className="h-16 w-16" />}
              title="هیچ کتاب صوتی یافت نشد"
              description="اولین کتاب صوتی خود را اضافه کنید"
              action={{
                label: "افزودن کتاب صوتی",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <div className={`gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                : 'flex flex-col space-y-4'
            }`}>
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4">
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 3/4}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 h-8 w-8 p-0"
                        onClick={() => handleExternalLink(item.link!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                      >
                        {getStatusLabel(item.status, item.type)}
                      </Badge>
                      {item.rating && (
                        <div className="text-xs sm:text-sm text-lux-gold font-medium">
                          ⭐ {item.rating}/5
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex-1 text-xs sm:text-sm h-8 sm:h-9 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="articles" className="space-y-6">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-16 w-16" />}
              title="هیچ مقاله‌ای یافت نشد"
              description="اولین مقاله خود را اضافه کنید و شروع به جمع‌آوری منابع علمی خود کنید"
              action={{
                label: "افزودن مقاله",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <div className={`gap-4 sm:gap-6 ${
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                : 'flex flex-col space-y-4'
            }`}>
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4">
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 4/3}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 h-8 w-8 p-0"
                        onClick={() => handleExternalLink(item.link!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                      >
                        {getStatusLabel(item.status, item.type)}
                      </Badge>
                      {item.rating && (
                        <div className="text-xs sm:text-sm text-lux-gold font-medium">
                          ⭐ {item.rating}/5
                        </div>
                      )}
                    </div>
                    
                     <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAISummary(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         خلاصه‌سازی
                       </ModernButton>
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAIMindmap(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         مایندمپ
                       </ModernButton>
                       {(item.pdfFile || item.pdfUrl) && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleExternalLink(item.pdfFile || item.pdfUrl!)}
                           className="text-primary hover:bg-primary/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                         >
                           <FileText className="h-3 w-3" />
                         </Button>
                       )}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDeleteItem(item.id)}
                         className="text-destructive hover:bg-destructive/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                  </div>
                </ModernCard>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="theater" className="space-y-6">
          {filteredItems.length === 0 ? (
            <EmptyState
              icon={<Drama className="h-16 w-16" />}
              title="هیچ تئاتری یافت نشد"
              description="اولین تئاتر خود را اضافه کنید و شروع به ثبت تجربیات فرهنگی خود کنید"
              action={{
                label: "افزودن تئاتر",
                onClick: () => setIsAddModalOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
            />
          ) : (
            <ResponsiveGrid
              cols={viewMode === 'grid' ? {
                default: 1,
                sm: 2,
                md: isMobile ? 2 : 3,
                lg: isMobile ? 3 : 4,
                xl: 5
              } : { default: 1 }}
              gap="md"
              className={viewMode === 'list' ? 'flex flex-col space-y-4' : ''}
            >
              {filteredItems.map((item) => (
                <ModernCard 
                  key={item.id} 
                  title={item.title}
                  subtitle={item.description}
                  hover
                  glow
                  className="overflow-hidden h-full flex flex-col"
                >
                  <div className="relative mb-3 sm:mb-4">
                    <AspectRatio ratio={viewMode === 'list' ? 16/9 : 3/4}>
                      <img
                        src={getEffectiveCoverImage(item)}
                        alt={item.title}
                        className="object-cover w-full h-full rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </AspectRatio>
                    {item.link && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 left-2 h-8 w-8 p-0"
                        onClick={() => handleExternalLink(item.link!)}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="space-y-3 sm:space-y-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <Badge 
                        variant="outline" 
                        className="bg-gradient-luxury-platinum text-lux-midnight text-xs"
                      >
                        {getStatusLabel(item.status, item.type)}
                      </Badge>
                      {item.rating && (
                        <div className="text-xs sm:text-sm text-lux-gold font-medium">
                          ⭐ {item.rating}/5
                        </div>
                      )}
                    </div>
                    
                     <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAISummary(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         خلاصه‌سازی
                       </ModernButton>
                       <ModernButton
                         variant="outline"
                         size="sm"
                         onClick={() => handleAIMindmap(item)}
                         className="flex-1 text-xs sm:text-sm h-8 sm:h-9"
                         magnetic
                       >
                         مایندمپ
                       </ModernButton>
                       {(item.pdfFile || item.pdfUrl) && (
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleExternalLink(item.pdfFile || item.pdfUrl!)}
                           className="text-primary hover:bg-primary/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                         >
                           <FileText className="h-3 w-3" />
                         </Button>
                       )}
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleDeleteItem(item.id)}
                         className="text-destructive hover:bg-destructive/10 h-8 sm:h-9 w-8 sm:w-9 p-0"
                       >
                         <Trash2 className="h-3 w-3" />
                       </Button>
                     </div>
                  </div>
                </ModernCard>
              ))}
            </ResponsiveGrid>
          )}
        </TabsContent>
      </LuxuryTabs>

      {/* Modals and Drawers */}
      <AddItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddItem}
        contentTypes={getTabContentType(activeTab)}
      />

      <AIPreferencesDialog
        isOpen={isAiPrefsOpen}
        onClose={() => setIsAiPrefsOpen(false)}
      />

      {selectedItem && (
        <>
          <AISummaryDrawer
            isOpen={isSummaryDrawerOpen}
            onClose={() => setIsSummaryDrawerOpen(false)}
            item={selectedItem}
            onUpdateItem={handleUpdateItem}
          />
          
          <AIMindmapDrawer
            isOpen={isMindmapDrawerOpen}
            onClose={() => setIsMindmapDrawerOpen(false)}
            item={selectedItem}
            onUpdateItem={handleUpdateItem}
          />
        </>
      )}

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onAddItem={() => setIsAddModalOpen(true)}
      />
    </div>
  );
};

export default CulturalContentPage;