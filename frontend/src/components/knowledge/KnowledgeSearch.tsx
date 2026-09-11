import React, { useState, useEffect } from 'react';
import { Search, Filter, Tag, Calendar, Folder, Brain } from 'lucide-react';
import { FolderTree } from './FolderTree';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';
import { aiClassificationService } from '@/services/aiClassificationService';
import { KnowledgeItem, SearchFilters } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { seedKnowledgeSamples } from '@/services/knowledgeSampleData';
import { useToast } from '@/hooks/use-toast';

interface KnowledgeSearchProps {
  onResultsChange?: (results: KnowledgeItem[]) => void;
}

export const KnowledgeSearch: React.FC<KnowledgeSearchProps> = ({ onResultsChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeItem[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);
  const { toast } = useToast();

  const handleSeedClick = async () => {
    try {
      setIsSeeding(true);
      const count = await seedKnowledgeSamples();
      toast({ title: 'نمونه‌ها افزوده شد', description: `${count} آیتم نمونه اضافه شد` });
      await handleSearch();
    } catch (e) {
      toast({ title: 'خطا', description: 'افزودن نمونه‌ها ناموفق بود', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };
  useEffect(() => {
    const loadData = async () => {
      await supabaseKnowledgeService.loadFromStorage();
    };
    loadData();
  }, []);

  const handleSearch = async () => {
    if (!query.trim() && Object.keys(filters).length === 0) {
      setResults([]);
      onResultsChange?.([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResult = await supabaseKnowledgeService.searchKnowledge(query, filters);
      setResults(searchResult.items);
      setSuggestions(searchResult.suggestions);
      onResultsChange?.(searchResult.items);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length > 2) {
        handleSearch();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filters]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Projects': return '📋';
      case 'Areas': return '🎯';
      case 'Resources': return '📚';
      case 'Archives': return '📦';
      default: return '📄';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'link': return '🔗';
      case 'image': return '🖼️';
      case 'audio': return '🎵';
      case 'pdf': return '📄';
      case 'video': return '🎥';
      default: return '📄';
    }
  };

  return (
    <Card className="p-10 border-4 border-primary/20 shadow-2xl rounded-3xl bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-10">
        <CardTitle className="text-4xl font-bold text-primary flex items-center gap-4">
          <Search className="h-12 w-12" />
          جستجوی دانش
        </CardTitle>
        <p className="text-xl text-muted-foreground font-medium mt-6">
          در میان دانش ذخیره شده خود به راحتی جستجو کنید
        </p>
      </CardHeader>
      
      <CardContent className="space-y-10 pt-0">
        {/* Search Input */}
        <div className="flex gap-6">
          <div className="relative flex-1">
            <Search className="absolute right-6 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground" />
            <Input
              placeholder="جستجو در دانش شخصی..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-20 text-2xl pl-6 pr-20 border-4 border-border rounded-2xl font-medium focus:border-primary focus:shadow-2xl bg-background"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="h-20 px-10 text-xl font-bold border-4 rounded-2xl hover:shadow-2xl bg-background hover:bg-muted"
          >
            <Filter className="h-8 w-8 ml-3" />
            <span>فیلتر</span>
          </Button>
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4 bg-muted/20 rounded-lg border border-border/30">
            <span className="text-readable font-medium text-muted-foreground block mb-3">پیشنهادات:</span>
            <div className="flex gap-3 flex-wrap">
              {suggestions.map((suggestion, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10 transition-elegant text-sm px-3 py-1"
                  onClick={() => setQuery(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="card-spacious border-2 border-border/50 shadow-medical">
                <div className="pb-6 border-b border-border/30">
                  <h3 className="text-large-readable text-primary flex items-center gap-3">
                    <Filter className="h-6 w-6" />
                    فیلترهای پیشرفته
                  </h3>
                </div>
              
                <div className="space-y-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Category Filter */}
                    <div className="space-y-3">
                      <label className="text-readable font-semibold text-foreground">دسته‌بندی PARA</label>
                      <Select 
                        value={filters.categories?.[0] || ''} 
                        onValueChange={(value) => 
                          handleFilterChange('categories', value ? [value] : undefined)
                        }
                      >
                        <SelectTrigger className="input-readable">
                          <SelectValue placeholder="انتخاب دسته" />
                        </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Projects">📋 پروژه‌ها</SelectItem>
                        <SelectItem value="Areas">🎯 حوزه‌ها</SelectItem>
                        <SelectItem value="Resources">📚 منابع</SelectItem>
                        <SelectItem value="Archives">📦 آرشیو</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Organization Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">سازمان</label>
                    <Select 
                      value={filters.organizations?.[0] || ''} 
                      onValueChange={(value) => 
                        handleFilterChange('organizations', value ? [value] : undefined)
                      }
                    >
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder="انتخاب سازمان" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Varid">ورید هلث</SelectItem>
                        <SelectItem value="Frangaran">فرانگران نوین</SelectItem>
                        <SelectItem value="Association">انجمن تولیدکنندگان</SelectItem>
                        <SelectItem value="Chamber">اتاق بازرگانی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                   {/* Type Filter */}
                   <div>
                     <label className="text-sm font-medium mb-2 block">نوع محتوا</label>
                     <Select 
                       value={filters.type?.[0] || ''} 
                       onValueChange={(value) => 
                         handleFilterChange('type', value ? [value] : undefined)
                       }
                     >
                       <SelectTrigger className="bg-background/50">
                         <SelectValue placeholder="انتخاب نوع" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="text">📝 متن</SelectItem>
                         <SelectItem value="link">🔗 لینک</SelectItem>
                         <SelectItem value="image">🖼️ تصویر</SelectItem>
                         <SelectItem value="audio">🎵 صوت</SelectItem>
                         <SelectItem value="pdf">📄 PDF</SelectItem>
                         <SelectItem value="video">🎥 ویدئو</SelectItem>
                       </SelectContent>
                     </Select>
                   </div>
                   </div>

                   {/* Folder Filter */}
                   <div className="space-y-3 pt-6 border-t border-border/30">
                     <label className="text-readable font-semibold text-foreground flex items-center gap-2">
                       <Folder className="h-4 w-4" />
                       فیلتر بر اساس فولدر
                     </label>
                     <div className="border border-border/30 rounded-lg p-3 bg-muted/20 max-h-64 overflow-y-auto">
                       <FolderTree
                         selectedFolderId={filters.folder_id}
                         onFolderSelect={(id) => handleFilterChange('folder_id', id)}
                         compact
                       />
                     </div>
                     <div className="flex items-center gap-2">
                       <input
                         type="checkbox"
                         id="include-subfolders"
                         checked={filters.include_subfolders || false}
                         onChange={(e) =>
                           handleFilterChange('include_subfolders', e.target.checked)
                         }
                         className="h-4 w-4"
                       />
                       <label htmlFor="include-subfolders" className="text-sm text-muted-foreground">
                         جستجو در زیرفولدرها
                       </label>
                     </div>
                   </div>

                  <div className="flex gap-4 pt-4 border-t border-border/30">
                    <Button variant="outline" onClick={clearFilters} className="btn-professional">
                      <span className="text-button-large">پاک کردن فیلترها</span>
                    </Button>
                    <Button onClick={handleSearch} className="btn-professional">
                      <span className="text-button-large">اعمال فیلتر</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}

        {isLoading ? (
          <div className="card-spacious border-2 border-border/50 shadow-medical text-center">
            <div className="animate-pulse text-large-readable text-primary">در حال جستجو...</div>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            <p className="text-readable font-medium text-foreground">
              {results.length} نتیجه یافت شد
            </p>
            
            {results.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="card-spacious border-2 border-border/50 hover:border-primary/30 hover:shadow-medical transition-elegant cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{getTypeIcon(item.type)}</span>
                        <span className="text-xl">{getCategoryIcon(item.category)}</span>
                        <h3 className="text-large-readable font-semibold text-foreground">{item.title}</h3>
                      </div>
                      
                      <Badge variant="outline" className="text-sm px-3 py-1 border-primary/30 text-primary">
                        {item.category}
                      </Badge>
                    </div>
                    
                    <p className="text-readable text-muted-foreground mb-4 line-clamp-2">
                      {item.content}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {item.tags.map((tag, tagIndex) => (
                          <Badge key={tagIndex} variant="secondary" className="text-sm px-2 py-1">
                            <Tag className="h-3 w-3 ml-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      
                      <span className="text-readable text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : query.length > 2 ? (
          <div className="card-spacious border-2 border-border/50 shadow-medical text-center">
            <p className="text-large-readable text-muted-foreground">نتیجه‌ای یافت نشد</p>
            <p className="text-readable text-muted-foreground mt-3">
              کلمات کلیدی مختلفی امتحان کنید یا فیلترها را تغییر دهید
            </p>
          </div>
        ) : (
          <div className="card-spacious border-2 border-border/50 shadow-medical text-center">
            <p className="text-large-readable text-muted-foreground">برای شروع جستجو یک کلیدواژه وارد کنید</p>
            <div className="mt-4">
              <Button onClick={handleSeedClick} disabled={isSeeding} variant="secondary">
                {isSeeding ? 'در حال افزودن نمونه‌ها...' : 'افزودن نمونه‌های دانش'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};