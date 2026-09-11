import { useState, useEffect } from "react";
import { 
  BookOpen, 
  Quote, 
  Heart, 
  Share2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Star,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  dailyContentService, 
  type DailyContent, 
  type QuranVerse, 
  type MotivationalQuote 
} from "@/services/dailyContentService";

interface DailyContentDisplayProps {
  className?: string;
  compact?: boolean;
}

export const DailyContentDisplay = ({ className = "", compact = false }: DailyContentDisplayProps) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [dailyContent, setDailyContent] = useState<DailyContent | null>(null);
  const [favorites, setFavorites] = useState<{ verse: string[], quote: string[] }>({ verse: [], quote: [] });
  const [settings, setSettings] = useState(dailyContentService.getSettings());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDailyContent();
    setFavorites(dailyContentService.getFavorites());
  }, []);

  const loadDailyContent = () => {
    const content = dailyContentService.getDailyContent();
    setDailyContent(content);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // شبیه‌سازی بارگذاری محتوای جدید
    setTimeout(() => {
      const randomVerse = dailyContentService.getRandomVerse();
      const randomQuote = dailyContentService.getRandomQuote();
      
      if (dailyContent) {
        setDailyContent({
          ...dailyContent,
          verse: randomVerse,
          quote: randomQuote
        });
      }
      
      setIsLoading(false);
      toast({
        title: "محتوای جدید",
        description: "آیه و جمله انگیزشی جدید دریافت شد.",
      });
    }, 800);
  };

  const handleFavorite = (type: 'verse' | 'quote', id: string) => {
    const isFav = favorites[type].includes(id);
    
    if (isFav) {
      dailyContentService.removeFavorite(type, id);
    } else {
      dailyContentService.saveFavorite(type, id);
    }
    
    setFavorites(dailyContentService.getFavorites());
    
    toast({
      title: isFav ? "از علاقه‌مندی‌ها حذف شد" : "به علاقه‌مندی‌ها اضافه شد",
      description: isFav ? "محتوا از لیست علاقه‌مندی‌های شما حذف شد." : "محتوا به لیست علاقه‌مندی‌های شما اضافه شد.",
    });
  };

  const handleShare = async (type: 'verse' | 'quote', content: QuranVerse | MotivationalQuote) => {
    const shareText = dailyContentService.shareContent(type, content);
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: type === 'verse' ? 'آیه قرآن' : 'جمله انگیزشی',
          text: shareText,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareText);
      toast({
        title: "کپی شد",
        description: "محتوا در کلیپ‌بورد کپی شد.",
      });
    }
  };

  if (!dailyContent) {
    return (
      <div className="animate-pulse bg-muted/50 rounded-lg h-20 w-full" />
    );
  }

  // حالت فشرده برای موبایل
  if (compact && !isExpanded) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 text-xs hover-scale transition-elegant"
        >
          <BookOpen className="h-3 w-3" />
          <Quote className="h-3 w-3" />
          <span>آیه و جمله روز</span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`daily-content-card glass-card animate-fade-in ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Clock className="h-3 w-3 mr-1" />
              محتوای روز
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="hover-scale transition-elegant"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="hover-scale transition-elegant"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* آیه قرآن */}
          {settings.showVerse && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">آیه روز</span>
              </div>
              
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg p-4 border border-primary/10">
                {/* متن عربی */}
                <p className="text-lg font-semibold text-center mb-3 text-foreground leading-relaxed" 
                   style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
                  {dailyContent.verse.arabic}
                </p>
                
                {/* ترجمه فارسی */}
                <p className="text-base text-muted-foreground text-center mb-3 leading-relaxed">
                  {dailyContent.verse.persian}
                </p>
                
                {/* مرجع */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>سوره {dailyContent.verse.surah}، آیه {dailyContent.verse.verse}</span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFavorite('verse', dailyContent.verse.id)}
                      className={`h-7 w-7 p-0 hover-scale ${
                        favorites.verse.includes(dailyContent.verse.id) 
                          ? 'text-red-500' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {favorites.verse.includes(dailyContent.verse.id) ? (
                        <Heart className="h-3 w-3 fill-current" />
                      ) : (
                        <Heart className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('verse', dailyContent.verse)}
                      className="h-7 w-7 p-0 hover-scale text-muted-foreground"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* تفسیر کوتاه */}
                {dailyContent.verse.tafsir && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {dailyContent.verse.tafsir}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* جداکننده */}
          {settings.showVerse && settings.showQuote && (
            <Separator className="my-4" />
          )}

          {/* جمله انگیزشی */}
          {settings.showQuote && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Quote className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-foreground">جمله انگیزشی</span>
                <Badge variant="outline" className="text-xs">
                  {dailyContent.quote.category === 'success' && 'موفقیت'}
                  {dailyContent.quote.category === 'health' && 'سلامت'}
                  {dailyContent.quote.category === 'knowledge' && 'دانش'}
                  {dailyContent.quote.category === 'leadership' && 'رهبری'}
                  {dailyContent.quote.category === 'spirituality' && 'معنویت'}
                </Badge>
              </div>
              
              <div className="bg-gradient-to-r from-accent/5 to-primary/5 rounded-lg p-4 border border-accent/10">
                {/* متن جمله */}
                <p className="text-base text-foreground leading-relaxed mb-3">
                  "{dailyContent.quote.text}"
                </p>
                
                {/* نویسنده و اکشن‌ها */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground font-medium">
                    — {dailyContent.quote.author}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFavorite('quote', dailyContent.quote.id)}
                      className={`h-7 w-7 p-0 hover-scale ${
                        favorites.quote.includes(dailyContent.quote.id) 
                          ? 'text-red-500' 
                          : 'text-muted-foreground'
                      }`}
                    >
                      {favorites.quote.includes(dailyContent.quote.id) ? (
                        <Star className="h-3 w-3 fill-current" />
                      ) : (
                        <Star className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleShare('quote', dailyContent.quote)}
                      className="h-7 w-7 p-0 hover-scale text-muted-foreground"
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};