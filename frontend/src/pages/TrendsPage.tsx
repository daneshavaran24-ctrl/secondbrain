import React, { useState, useEffect } from 'react';
import { TrendingUp, ExternalLink, Clock, Star, Settings, Search, Bell, Download, Filter, Eye, Bookmark } from 'lucide-react';
import { ResponsiveCard } from '@/components/ui/responsive-card';
import { ResponsiveContainer, ResponsiveSection } from '@/components/ui/responsive-container';
import { ResponsiveLayout, ResponsiveStack } from '@/components/ui/responsive-layout';
import { ResponsiveHeading, ResponsiveText } from '@/components/ui/responsive-typography';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TrendsPage = () => {
  // Iranian Newspapers List
  const iranianNewspapers = [
    'آرمان امروز', 'آرمان ملی', 'آسیا', 'آگاه', 'ابرار', 'ابرار اقتصادی', 'اترک', 'اخبار صنعت',
    'آذربایجان', 'اعتدال', 'اعتماد', 'اسکناس', 'اصفهان امروز', 'افکار', 'اقتصاد آینده',
    'اقتصاد پویا', 'اقتصاد سرآمد', 'اقتصاد کیش', 'اقتصاد مردم', 'اقتصاد ملی', 'امروز', 'باختر',
    'بازار کسب و کار', 'پیام سپیدار', 'پیام عسلویه', 'پیام ما', 'پیشرو', 'تجارت', 'ثروت',
    'جهان اقتصاد', 'جهان صنعت', 'جوان', 'جمله', 'جمهوری اسلامی', 'خوب', 'دنیای اقتصاد',
    'روزگار', 'روزگار معدن', 'رویداد امروز', 'رویش ملت', 'ستاره صبح', 'سپهر ایرانیان',
    'سیاست روز', 'شرق', 'شروع', 'شهرآرا', 'شهروند', 'صبح امروز', 'صبح ساحل', 'صمت',
    'عصر اصفهان', 'عصر ایرانیان', 'عصر توسعه', 'عصر رسانه', 'عصر قانون', 'فوق العاده',
    'قدس', 'کار و کارگر', 'کیهان', 'کیمیای وطن', 'مردم سالاری', 'مواجهه اقتصادی',
    'مهد تمدن', 'نقش اقتصاد', 'نصف جهان', 'هدف و اقتصاد', 'همدان پیام', 'هنرمند',
    'یادگار امروز', 'یاقوت وطن', 'ابرار ورزشی', 'خبر ورزشی', 'شوت', 'فوتبالز'
  ];

  // Domains and Keywords Configuration
  const predefinedDomains = {
    'اقتصاد': ['تورم', 'بورس', 'ارز', 'سرمایه‌گذاری', 'نفت', 'گاز', 'صادرات', 'واردات', 'بانک'],
    'سیاست': ['انتخابات', 'دولت', 'مجلس', 'روابط خارجی', 'دیپلماسی', 'وزیر', 'رئیس‌جمهور'],
    'ورزش': ['فوتبال', 'المپیک', 'تیم ملی', 'لیگ برتر', 'والیبال', 'کشتی', 'شنا'],
    'فرهنگ': ['هنر', 'سینما', 'کتاب', 'موسیقی', 'تئاتر', 'نمایشگاه', 'فستیوال'],
    'جامعه': ['آموزش', 'بهداشت', 'محیط زیست', 'ترافیک', 'آلودگی', 'درمان', 'واکسن'],
    'فناوری': ['هوش مصنوعی', 'بلاکچین', 'اینترنت', 'موبایل', 'نرم‌افزار', 'سایبری', 'دیجیتال']
  };

  // State Management
  const [selectedNewspapers, setSelectedNewspapers] = useState<string[]>([]);
  const [selectedDomains, setSelectedDomains] = useState<string[]>(['اقتصاد']);
  const [customKeywords, setCustomKeywords] = useState<{[key: string]: string[]}>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<any[]>([]);
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Mock News Data with Persian content
  const mockNews = [
    {
      id: 1,
      title: 'افزایش نرخ تورم به ۴۵ درصد در ماه گذشته',
      newspaper: 'اقتصاد ملی',
      content: 'گزارش بانک مرکزی نشان می‌دهد که نرخ تورم در ماه گذشته به ۴۵ درصد رسیده است.',
      domain: 'اقتصاد',
      keywords: ['تورم', 'بانک مرکزی', 'اقتصاد'],
      sentiment: 'منفی',
      date: '1403/09/15',
      frequency: 8,
      trending: 'hot'
    },
    {
      id: 2,
      title: 'صعود تیم ملی فوتبال در رنکینگ فیفا',
      newspaper: 'خبر ورزشی',
      content: 'تیم ملی فوتبال ایران پس از پیروزی‌های اخیر، در رنکینگ فیفا صعود کرد.',
      domain: 'ورزش',
      keywords: ['فوتبال', 'تیم ملی', 'فیفا'],
      sentiment: 'مثبت',
      date: '1403/09/14',
      frequency: 12,
      trending: 'rising'
    },
    {
      id: 3,
      title: 'افتتاح نمایشگاه هنرهای تجسمی در تهران',
      newspaper: 'هنرمند',
      content: 'نمایشگاه بزرگ هنرهای تجسمی با حضور هنرمندان برجسته کشور افتتاح شد.',
      domain: 'فرهنگ',
      keywords: ['هنر', 'نمایشگاه', 'تهران'],
      sentiment: 'مثبت',
      date: '1403/09/13',
      frequency: 6,
      trending: 'stable'
    },
    {
      id: 4,
      title: 'تصویب لایحه بودجه ۱۴۰۴ در مجلس',
      newspaper: 'جمهوری اسلامی',
      content: 'لایحه بودجه سال ۱۴۰۴ با اکثریت آرا در مجلس شورای اسلامی تصویب شد.',
      domain: 'سیاست',
      keywords: ['بودجه', 'مجلس', 'تصویب'],
      sentiment: 'خنثی',
      date: '1403/09/12',
      frequency: 15,
      trending: 'hot'
    },
    {
      id: 5,
      title: 'راه‌اندازی شبکه ۵G در شهرهای بزرگ',
      newspaper: 'دنیای اقتصاد',
      content: 'شبکه نسل پنجم تلفن همراه در شهرهای تهران، مشهد و اصفهان راه‌اندازی شد.',
      domain: 'فناوری',
      keywords: ['۵G', 'فناوری', 'تلفن همراه'],
      sentiment: 'مثبت',
      date: '1403/09/11',
      frequency: 9,
      trending: 'rising'
    }
  ];

  const categories = [
    { name: 'اقتصاد', count: 25, color: 'bg-green-500/10 text-green-500' },
    { name: 'سیاست', count: 18, color: 'bg-blue-500/10 text-blue-500' },
    { name: 'ورزش', count: 12, color: 'bg-purple-500/10 text-purple-500' },
    { name: 'فرهنگ', count: 8, color: 'bg-orange-500/10 text-orange-500' },
    { name: 'جامعه', count: 15, color: 'bg-teal-500/10 text-teal-500' },
    { name: 'فناوری', count: 10, color: 'bg-red-500/10 text-red-500' }
  ];

  // Utility Functions
  const getTrendingIcon = (trend: string) => {
    switch (trend) {
      case 'hot': return '🔥';
      case 'rising': return '📈';
      case 'stable': return '📊';
      default: return '📰';
    }
  };

  const getTrendingBadge = (trend: string) => {
    switch (trend) {
      case 'hot':
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">داغ</Badge>;
      case 'rising':
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">صعودی</Badge>;
      case 'stable':
        return <Badge variant="outline">ثابت</Badge>;
      default:
        return null;
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'مثبت':
        return <Badge className="bg-green-500/10 text-green-500">مثبت</Badge>;
      case 'منفی':
        return <Badge className="bg-red-500/10 text-red-500">منفی</Badge>;
      case 'خنثی':
        return <Badge variant="outline">خنثی</Badge>;
      default:
        return null;
    }
  };

  // Event Handlers
  const handleNewspaperToggle = (newspaper: string) => {
    setSelectedNewspapers(prev => 
      prev.includes(newspaper) 
        ? prev.filter(n => n !== newspaper)
        : [...prev, newspaper]
    );
  };

  const handleDomainToggle = (domain: string) => {
    setSelectedDomains(prev => 
      prev.includes(domain) 
        ? prev.filter(d => d !== domain)
        : [...prev, domain]
    );
  };

  const handleKeywordSearch = () => {
    const filtered = mockNews.filter(news => {
      const matchesDomain = selectedDomains.length === 0 || selectedDomains.includes(news.domain);
      const matchesQuery = searchQuery === '' || 
        news.title.includes(searchQuery) || 
        news.content.includes(searchQuery) ||
        news.keywords.some(k => k.includes(searchQuery));
      
      return matchesDomain && matchesQuery;
    });
    
    setFilteredResults(filtered);
    
    // Alert for high frequency keywords
    const highFrequencyResults = filtered.filter(news => news.frequency >= alertThreshold);
    if (highFrequencyResults.length > 0) {
      toast(`🚨 ${highFrequencyResults.length} خبر با فرکانس بالا یافت شد!`);
    }
  };

  const handleExportResults = () => {
    const dataStr = JSON.stringify(filteredResults, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `newspaper_analysis_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast('✅ گزارش با موفقیت export شد');
  };

  const handleBookmarkNews = (newsId: number) => {
    toast('🔖 خبر به لیست مطالعه اضافه شد');
  };

  // Initialize filtered results
  useEffect(() => {
    setFilteredResults(mockNews);
  }, []);

  // Update results when filters change
  useEffect(() => {
    handleKeywordSearch();
  }, [selectedDomains, searchQuery]);

  return (
    <ResponsiveContainer variant="page">
      <ResponsiveSection spacing="lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary" />
            <div>
              <ResponsiveHeading level={1} className="text-foreground">
                نظارت بر روزنامه‌های ایران
              </ResponsiveHeading>
              <ResponsiveText variant="muted" className="mt-1">
                سیستم هوشمند تحلیل و پایش اخبار روزنامه‌ها
              </ResponsiveText>
            </div>
          </div>
          
          <ResponsiveStack direction="responsive" spacing="sm">
            <Button variant="outline" onClick={handleExportResults} className="w-full md:w-auto">
              <Download className="h-4 w-4 ml-2" />
              خروجی گزارش
            </Button>
            
            <ResponsiveDialog
              open={false}
              onOpenChange={() => {}}
              title="تنظیمات نظارت روزنامه‌ها"
              description="تنظیم منابع خبری، کلیدواژه‌ها و هشدارهای مربوط به نظارت روندها"
              footer={
                <Button variant="outline" className="w-full md:w-auto">
                  <Settings className="h-4 w-4 ml-2" />
                  تنظیمات
                </Button>
              }
            >
              <Tabs defaultValue="newspapers" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="newspapers">انتخاب روزنامه‌ها</TabsTrigger>
                  <TabsTrigger value="domains">حوزه‌ها و کلیدواژه‌ها</TabsTrigger>
                  <TabsTrigger value="alerts">تنظیمات هشدار</TabsTrigger>
                </TabsList>
                
                <TabsContent value="newspapers" className="space-y-4">
                  <ResponsiveLayout cols={{ mobile: 1, tablet: 2, desktop: 3 }} gap="sm">
                    {iranianNewspapers.slice(0, 12).map(newspaper => (
                      <div key={newspaper} className="flex items-center space-x-2">
                        <Checkbox
                          id={newspaper}
                          checked={selectedNewspapers.includes(newspaper)}
                          onCheckedChange={() => handleNewspaperToggle(newspaper)}
                        />
                        <Label htmlFor={newspaper} className="text-sm">{newspaper}</Label>
                      </div>
                    ))}
                  </ResponsiveLayout>
                  <ResponsiveText size="sm" variant="muted">
                    {selectedNewspapers.length} روزنامه انتخاب شده
                  </ResponsiveText>
                </TabsContent>
                
                <TabsContent value="domains" className="space-y-4">
                  <div className="space-y-4">
                    {Object.entries(predefinedDomains).map(([domain, keywords]) => (
                      <div key={domain} className="border border-border rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            checked={selectedDomains.includes(domain)}
                            onCheckedChange={() => handleDomainToggle(domain)}
                          />
                          <Label className="font-medium">{domain}</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {keywords.map(keyword => (
                            <Badge key={keyword} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="alerts" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="threshold">آستانه هشدار (فرکانس کلیدواژه)</Label>
                      <Input
                        id="threshold"
                        type="number"
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(Number(e.target.value))}
                        className="w-32"
                      />
                    </div>
                    <ResponsiveText size="sm" variant="muted">
                      هشدار زمانی نمایش داده می‌شود که فرکانس کلیدواژه از این مقدار بیشتر باشد
                    </ResponsiveText>
                  </div>
                </TabsContent>
              </Tabs>
            </ResponsiveDialog>
          </ResponsiveStack>
        </div>

        {/* Search and Filter */}
        <ResponsiveCard className="bg-glass border-elegant">
          <ResponsiveStack spacing="md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="جستجوی کلیدواژه، عنوان یا محتوا..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
              <Button onClick={handleKeywordSearch} className="w-full md:w-auto">
                <Search className="h-4 w-4 ml-2" />
                جستجو
              </Button>
            </div>
            
            {/* Active Filters */}
            {selectedDomains.length > 0 && (
              <div className="mt-4">
                <ResponsiveText size="sm" variant="muted" className="mb-2">
                  حوزه‌های فعال:
                </ResponsiveText>
                <div className="flex flex-wrap gap-2">
                  {selectedDomains.map(domain => (
                    <Badge key={domain} variant="secondary" className="text-xs">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </ResponsiveStack>
        </ResponsiveCard>

        {/* Domain Categories */}
        <ResponsiveCard title="تحلیل بر اساس حوزه" className="bg-glass border-elegant">
          <ResponsiveLayout 
            cols={{ mobile: 2, tablet: 3, desktop: 6 }}
            gap="sm"
          >
            {categories.map(category => (
              <Button
                key={category.name}
                variant={selectedDomains.includes(category.name) ? "default" : "outline"}
                className={`p-3 md:p-4 h-auto flex flex-col items-center gap-2 ${category.color} hover:scale-105 transition-transform`}
                onClick={() => handleDomainToggle(category.name)}
              >
                <ResponsiveText className="font-medium text-xs md:text-sm">
                  {category.name}
                </ResponsiveText>
                <Badge variant="outline" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </ResponsiveLayout>
        </ResponsiveCard>

        {/* Analysis Results */}
        <ResponsiveLayout 
          cols={{ mobile: 1, tablet: 1, desktop: 2 }}
          gap="md"
        >
          {filteredResults.map(news => (
            <ResponsiveCard 
              key={news.id} 
              className="bg-glass border-elegant hover:border-primary/20 transition-elegant"
            >
              <ResponsiveStack spacing="md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-lg">{getTrendingIcon(news.trending)}</span>
                    {getTrendingBadge(news.trending)}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleBookmarkNews(news.id)}
                      className="h-8 w-8"
                    >
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <ResponsiveHeading level={3} className="mb-2 line-clamp-2">
                    {news.title}
                  </ResponsiveHeading>
                  <ResponsiveText size="sm" variant="muted" className="line-clamp-3 mb-3">
                    {news.content}
                  </ResponsiveText>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {news.newspaper}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {news.domain}
                  </Badge>
                  {getSentimentBadge(news.sentiment)}
                </div>

                <div className="flex flex-wrap gap-1">
                  {news.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>

                <div className="flex justify-between items-center text-sm text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{news.date}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>فرکانس: {news.frequency}</span>
                  </div>
                </div>
              </ResponsiveStack>
            </ResponsiveCard>
          ))}
        </ResponsiveLayout>

        {/* Quick Stats */}
        <ResponsiveCard title="آمار سریع" className="bg-glass border-elegant">
          <ResponsiveLayout 
            cols={{ mobile: 2, tablet: 4, desktop: 4 }}
            gap="sm"
          >
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
              <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold text-primary">
                {filteredResults.length}
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted">کل اخبار</ResponsiveText>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
              <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold text-green-500">
                {filteredResults.filter(n => n.sentiment === 'مثبت').length}
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted">مثبت</ResponsiveText>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
              <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold text-red-500">
                {filteredResults.filter(n => n.sentiment === 'منفی').length}
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted">منفی</ResponsiveText>
            </div>
            <div className="text-center p-3 md:p-4 rounded-lg bg-gradient-lux">
              <ResponsiveHeading level={3} className="text-xl md:text-2xl font-bold text-orange-500">
                {filteredResults.filter(n => n.trending === 'hot').length}
              </ResponsiveHeading>
              <ResponsiveText size="sm" variant="muted">داغ</ResponsiveText>
            </div>
          </ResponsiveLayout>
        </ResponsiveCard>
      </ResponsiveSection>
    </ResponsiveContainer>
  );
};

export default TrendsPage;