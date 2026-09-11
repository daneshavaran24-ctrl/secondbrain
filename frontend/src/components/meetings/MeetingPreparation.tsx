import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Lightbulb, RefreshCw, ExternalLink, Copy, Clock, Calendar,
  Newspaper, BookOpen, TrendingUp, Globe, BarChart3, Users,
  MessageSquare, Sparkles, Loader2, Search, ArrowLeft, Share2
} from 'lucide-react';
import type { Meeting } from '@/types';

interface NewsItem {
  title: string;
  summary: string;
  source: string;
  url?: string;
  relevance_score?: number;
  credibility?: 'high' | 'medium' | 'low';
  date?: string;
}

interface ArticleItem {
  title: string;
  summary: string;
  authors?: string;
  source: string;
  url?: string;
  relevance_score?: number;
}

interface PreparationData {
  domestic_news?: NewsItem[];
  international_news?: NewsItem[];
  trending_topics?: Array<{
    topic: string;
    description: string;
    trend_score?: number;
    hashtags?: string[];
  }>;
  research_articles?: ArticleItem[];
  key_statistics?: Array<{
    statistic: string;
    value: string;
    source: string;
    context?: string;
  }>;
  expert_opinions?: Array<{
    expert: string;
    opinion: string;
    credibility?: 'high' | 'medium' | 'low';
  }>;
  sentiment_analysis?: {
    overall_sentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
    confidence: number;
    key_themes?: string[];
  };
  key_points?: string[];
  suggested_questions?: string[];
  generated_at?: string;
}

type DetailItem =
  | { kind: 'news'; item: NewsItem; sectionTitle: string }
  | { kind: 'article'; item: ArticleItem; sectionTitle: string }
  | { kind: 'trend'; item: NonNullable<PreparationData['trending_topics']>[0] }
  | { kind: 'opinion'; item: NonNullable<PreparationData['expert_opinions']>[0] };

export const MeetingPreparation: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [preparationData, setPreparationData] = useState<Record<string, PreparationData>>({});
  const [customTopic, setCustomTopic] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customPreparation, setCustomPreparation] = useState<PreparationData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadMeetings();
    loadPreparationData();
  }, []);

  const loadMeetings = () => {
    const stored = localStorage.getItem('meetings');
    if (stored) {
      const allMeetings: Meeting[] = JSON.parse(stored);
      const upcoming = allMeetings
        .filter(m => new Date(m.date) > new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setMeetings(upcoming);
    }
    setLoading(false);
  };

  const loadPreparationData = () => {
    const stored = localStorage.getItem('meeting_preparation_data');
    if (stored) setPreparationData(JSON.parse(stored));
  };

  const savePreparationData = (meetingId: string, data: PreparationData) => {
    const updated = { ...preparationData, [meetingId]: data };
    setPreparationData(updated);
    localStorage.setItem('meeting_preparation_data', JSON.stringify(updated));
  };

  // Try perplexity-proxy first (real web search), then fallback to meeting-preparation
  const fetchPreparationData = async (title: string, description: string): Promise<PreparationData> => {
    // ── Attempt 1: perplexity-proxy ──────────────────────────────────────────
    try {
      const source = `موضوع جلسه: "${title}"
${description ? `زمینه: ${description}\n` : ''}
وب را جستجو کن و جامع‌ترین اطلاعات به‌روز را پیدا کن:
- آخرین اخبار و رویدادها
- آمار و داده‌های کلیدی
- نظرات متخصصان و صاحب‌نظران
- ترندها و موضوعات داغ
- پیشنهاداتی برای مذاکره در جلسه`;

      const { data: proxData, error: proxError } = await supabase.functions.invoke('perplexity-proxy', {
        body: {
          action: 'summarize',
          title: `آماده‌سازی جلسه: ${title}`,
          source,
          detailLevel: 'long',
          language: 'persian',
        }
      });

      // proxData may contain body even on HTTP error — check both
      if (!proxError && proxData?.success && proxData?.data) {
        const d = proxData.data;

        const expertOpinions = (d.quotes || []).map((q: string) => {
          const parts = q.split(' — ');
          return {
            expert: parts.length > 1 ? parts[parts.length - 1].trim() : 'متخصص',
            opinion: parts[0].trim(),
            credibility: 'high' as const,
          };
        });

        const trendingTopics = (d.tags || []).slice(0, 5).map((tag: string) => ({
          topic: tag,
          description: `موضوع مرتبط با ${title} که در حال حاضر مورد توجه است`,
          trend_score: 0.8,
          hashtags: [tag.replace(/\s+/g, '')],
        }));

        const keyPoints: string[] = [];
        const newsItems: NonNullable<PreparationData['international_news']> = [];

        for (const point of (d.key_points || [])) {
          if (point.includes('📰') || point.includes('🔗')) {
            const cleaned = point.replace(/^[📰🔗]\s*/, '');
            newsItems.push({
              title: cleaned.split('|')[0]?.split('—')[0]?.trim() || cleaned,
              summary: cleaned.split('|')[1]?.trim() || cleaned,
              source: cleaned.split('—')[1]?.split('|')[0]?.trim() || 'منبع بین‌المللی',
              relevance_score: 0.85,
              credibility: 'medium' as const,
            });
          } else {
            keyPoints.push(point);
          }
        }

        return {
          key_points: keyPoints.length > 0 ? keyPoints : (d.key_points || []),
          suggested_questions: d.actions || [],
          expert_opinions: expertOpinions,
          trending_topics: trendingTopics,
          international_news: newsItems,
          domestic_news: [],
          research_articles: [],
          key_statistics: [],
          sentiment_analysis: {
            overall_sentiment: 'neutral',
            confidence: 0.75,
            key_themes: (d.tags || []).slice(0, 4),
          },
          generated_at: new Date().toISOString(),
        };
      }

      // Log but don't throw — fall through to attempt 2
      console.warn('perplexity-proxy failed:', proxError?.message || proxData?.error || 'unknown');
    } catch (e) {
      console.warn('perplexity-proxy exception:', e);
    }

    // ── Attempt 2: meeting-preparation edge function ─────────────────────────
    const { data, error } = await supabase.functions.invoke('meeting-preparation', {
      body: { meetingTitle: title, meetingDescription: description || '' }
    });

    if (error) {
      // Extract meaningful message
      const bodyError = (data as { error?: string } | null)?.error;
      throw new Error(bodyError || error.message || 'خطا در برقراری ارتباط با سرور تحلیل');
    }

    if (!data || (data.key_points?.length === 0 && data.domestic_news?.length === 0)) {
      throw new Error('پاسخ سرور خالی بود. لطفاً دوباره تلاش کنید.');
    }

    return data as PreparationData;
  };

  const analyzeCustomTopic = async () => {
    if (!customTopic.trim()) {
      toast({ title: "خطا", description: "لطفاً موضوع جلسه را وارد کنید", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await fetchPreparationData(customTopic, customDescription);
      setCustomPreparation(result);
      toast({ title: "✅ تحلیل کامل شد", description: "اطلاعات از اینترنت جمع‌آوری شد" });
      setTimeout(() => {
        document.getElementById('custom-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطا در تحلیل موضوع';
      console.error('Error analyzing topic:', error);
      toast({ title: "خطا", description: msg, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreparation = async (meeting: Meeting) => {
    setGeneratingFor(meeting.id);
    try {
      const result = await fetchPreparationData(meeting.title, meeting.summary || '');
      savePreparationData(meeting.id, result);
      toast({ title: "✅ تحلیل کامل شد", description: "اطلاعات از اینترنت جمع‌آوری شد" });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'خطا در تولید مطالب آمادگی';
      console.error('Error generating preparation:', error);
      toast({ title: "خطا", description: msg, variant: "destructive" });
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = (prep: PreparationData) => {
    const text = [
      'نکات کلیدی:',
      ...(prep.key_points?.map(p => `• ${p}`) || []),
      '',
      'سوالات پیشنهادی:',
      ...(prep.suggested_questions?.map((q, i) => `${i + 1}. ${q}`) || []),
    ].join('\n');
    navigator.clipboard.writeText(text);
    toast({ title: "کپی شد", description: "متن در کلیپبورد کپی شد" });
  };

  const getTimeAgo = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} روز`;
    if (hours > 0) return `${hours} ساعت`;
    return 'چند دقیقه';
  };

  const getSentimentColor = (s: string) =>
    s === 'positive' ? 'text-green-500' : s === 'negative' ? 'text-red-500' : s === 'mixed' ? 'text-yellow-500' : 'text-muted-foreground';

  const getSentimentLabel = (s: string) =>
    s === 'positive' ? 'مثبت' : s === 'negative' ? 'منفی' : s === 'mixed' ? 'متفاوت' : 'خنثی';

  const getCredibilityBadge = (credibility?: string) => {
    if (credibility === 'high') return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">اعتبار بالا</Badge>;
    if (credibility === 'medium') return <Badge variant="secondary">اعتبار متوسط</Badge>;
    if (credibility === 'low') return <Badge variant="outline">اعتبار پایین</Badge>;
    return null;
  };

  // ─── Detail Sheet ─────────────────────────────────────────────────────────
  const renderDetailSheet = () => {
    if (!detailItem) return null;

    let title = '';
    let body = '';
    let meta: React.ReactNode = null;
    let url: string | undefined;

    if (detailItem.kind === 'news') {
      const { item, sectionTitle } = detailItem;
      title = item.title;
      body = item.summary;
      url = item.url;
      meta = (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">📰 {item.source}</Badge>
          {item.date && <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString('fa-IR')}</span>}
          {getCredibilityBadge(item.credibility)}
          <Badge variant="secondary" className="text-xs">{sectionTitle}</Badge>
        </div>
      );
    } else if (detailItem.kind === 'article') {
      const { item, sectionTitle } = detailItem;
      title = item.title;
      body = item.summary;
      url = item.url;
      meta = (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <Badge variant="outline" className="text-xs">📚 {item.source}</Badge>
          {item.authors && <span className="text-xs text-muted-foreground">👤 {item.authors}</span>}
          <Badge variant="secondary" className="text-xs">{sectionTitle}</Badge>
        </div>
      );
    } else if (detailItem.kind === 'trend') {
      const { item } = detailItem;
      title = item.topic;
      body = item.description;
      meta = (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {item.trend_score && (
            <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
              🔥 {Math.round(item.trend_score * 100)}% ترند
            </Badge>
          )}
          {item.hashtags?.map((tag, i) => (
            <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
          ))}
        </div>
      );
    } else if (detailItem.kind === 'opinion') {
      const { item } = detailItem;
      title = item.expert;
      body = item.opinion;
      meta = (
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {getCredibilityBadge(item.credibility)}
        </div>
      );
    }

    return (
      <Sheet open={!!detailItem} onOpenChange={(open) => !open && setDetailItem(null)}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
          <SheetHeader className="text-right mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDetailItem(null)}
                className="p-1 h-8 w-8"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <SheetTitle className="text-right flex-1 leading-relaxed">{title}</SheetTitle>
            </div>
            {meta}
          </SheetHeader>

          <SheetDescription asChild>
            <div className="text-right">
              <p className="text-sm leading-8 text-foreground whitespace-pre-line">{body}</p>

              {url && (
                <div className="mt-6 flex gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button className="w-full gap-2">
                      <ExternalLink className="w-4 h-4" />
                      مطالعه منبع اصلی
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(url!);
                      toast({ title: "لینک کپی شد" });
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </SheetDescription>
        </SheetContent>
      </Sheet>
    );
  };

  // ─── News Card ────────────────────────────────────────────────────────────
  const renderNewsCard = (item: NewsItem, idx: number, sectionTitle: string) => (
    <div
      key={idx}
      className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => setDetailItem({ kind: 'news', item, sectionTitle })}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm flex-1 leading-relaxed">{item.title}</h4>
        <div className="flex items-center gap-1 shrink-0">
          {getCredibilityBadge(item.credibility)}
        </div>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <Badge variant="outline" className="text-xs">📰 {item.source}</Badge>
        {item.date && (
          <span className="text-xs text-muted-foreground">
            {new Date(item.date).toLocaleDateString('fa-IR')}
          </span>
        )}
        {item.url && (
          <span className="text-xs text-primary flex items-center gap-1 mr-auto">
            <ExternalLink className="w-3 h-3" />
            کلیک برای خواندن
          </span>
        )}
      </div>
    </div>
  );

  // ─── Article Card ─────────────────────────────────────────────────────────
  const renderArticleCard = (item: ArticleItem, idx: number, sectionTitle: string) => (
    <div
      key={idx}
      className="p-4 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-all cursor-pointer active:scale-[0.98]"
      onClick={() => setDetailItem({ kind: 'article', item, sectionTitle })}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm flex-1 leading-relaxed">{item.title}</h4>
        {item.relevance_score && (
          <Badge variant="secondary" className="text-xs shrink-0">
            {Math.round(item.relevance_score * 100)}%
          </Badge>
        )}
      </div>
      {item.authors && <p className="text-xs text-muted-foreground mb-1">👤 {item.authors}</p>}
      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.summary}</p>
      <div className="flex items-center gap-2 mt-3">
        <Badge variant="outline" className="text-xs">📚 {item.source}</Badge>
        {item.url && (
          <span className="text-xs text-primary flex items-center gap-1 mr-auto">
            <ExternalLink className="w-3 h-3" />
            مشاهده مقاله
          </span>
        )}
      </div>
    </div>
  );

  // ─── Full preparation content ─────────────────────────────────────────────
  const renderPreparationContent = (prep: PreparationData) => (
    <CardContent className="space-y-6">
      <div className="flex items-center justify-between text-sm pb-4 border-b">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            {prep.generated_at ? getTimeAgo(prep.generated_at) : 'همین الان'} پیش
          </span>
          {prep.sentiment_analysis && (
            <span className={`flex items-center gap-2 font-medium ${getSentimentColor(prep.sentiment_analysis.overall_sentiment)}`}>
              <TrendingUp className="w-4 h-4" />
              {getSentimentLabel(prep.sentiment_analysis.overall_sentiment)}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(prep)}>
          <Copy className="w-4 h-4 ml-2" />
          کپی
        </Button>
      </div>

      {prep.trending_topics && prep.trending_topics.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            ترندهای روز
          </h3>
          <div className="space-y-2">
            {prep.trending_topics.map((trend, idx) => (
              <div
                key={idx}
                className="bg-background/50 p-3 rounded-lg cursor-pointer hover:bg-background/80 transition-colors active:scale-[0.98]"
                onClick={() => setDetailItem({ kind: 'trend', item: trend })}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-sm">{trend.topic}</h4>
                  {trend.trend_score && (
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs">
                      🔥 {Math.round(trend.trend_score * 100)}%
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{trend.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {prep.key_points && prep.key_points.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            نکات کلیدی
          </h3>
          <ul className="space-y-2">
            {prep.key_points.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm p-3 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                <span className="text-yellow-500 mt-0.5 font-bold shrink-0">•</span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {prep.domestic_news && prep.domestic_news.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Newspaper className="w-5 h-5 text-blue-500" />
            اخبار داخلی ایران
            <span className="text-xs text-muted-foreground font-normal">— کلیک کنید تا بخوانید</span>
          </h3>
          <div className="space-y-3">
            {prep.domestic_news.map((item, idx) => renderNewsCard(item, idx, 'اخبار داخلی'))}
          </div>
        </div>
      )}

      {prep.international_news && prep.international_news.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-500" />
            اخبار بین‌المللی
            <span className="text-xs text-muted-foreground font-normal">— کلیک کنید تا بخوانید</span>
          </h3>
          <div className="space-y-3">
            {prep.international_news.map((item, idx) => renderNewsCard(item, idx, 'اخبار بین‌المللی'))}
          </div>
        </div>
      )}

      {prep.research_articles && prep.research_articles.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            مقالات و تحقیقات
            <span className="text-xs text-muted-foreground font-normal">— کلیک کنید تا بخوانید</span>
          </h3>
          <div className="space-y-3">
            {prep.research_articles.map((item, idx) => renderArticleCard(item, idx, 'مقالات'))}
          </div>
        </div>
      )}

      {prep.key_statistics && prep.key_statistics.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            آمار کلیدی
          </h3>
          <div className="grid gap-3">
            {prep.key_statistics.map((stat, idx) => (
              <div key={idx} className="p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{stat.statistic}</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stat.value}</p>
                    {stat.context && <p className="text-xs text-muted-foreground">{stat.context}</p>}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">📊 {stat.source}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prep.expert_opinions && prep.expert_opinions.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-cyan-500" />
            نظرات متخصصان
            <span className="text-xs text-muted-foreground font-normal">— کلیک برای جزئیات</span>
          </h3>
          <div className="space-y-3">
            {prep.expert_opinions.map((opinion, idx) => (
              <div
                key={idx}
                className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg cursor-pointer hover:bg-cyan-500/10 transition-colors active:scale-[0.98]"
                onClick={() => setDetailItem({ kind: 'opinion', item: opinion })}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm">👤 {opinion.expert}</h4>
                  {getCredibilityBadge(opinion.credibility)}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed italic line-clamp-2">
                  "{opinion.opinion}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {prep.suggested_questions && prep.suggested_questions.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            سوالات پیشنهادی
          </h3>
          <ol className="space-y-2">
            {prep.suggested_questions.map((question, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm p-3 bg-pink-500/5 rounded-lg border border-pink-500/20">
                <span className="font-bold text-pink-500 shrink-0">{idx + 1}.</span>
                <span className="leading-relaxed">{question}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </CardContent>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderDetailSheet()}

      {/* Custom Topic Analysis Form */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            تحلیل موضوع جلسه
          </CardTitle>
          <CardDescription>
            موضوع جلسه را وارد کنید تا اخبار واقعی، مقالات، آمار و ترندهای مرتبط از اینترنت جمع‌آوری شود
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-sm font-medium">
              موضوع جلسه <span className="text-destructive">*</span>
            </Label>
            <Input
              id="topic"
              placeholder="مثال: هوش مصنوعی در صنعت بانکداری"
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && analyzeCustomTopic()}
              disabled={isAnalyzing}
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <TextInputWithVoice
              id="description"
              value={customDescription}
              onChange={setCustomDescription}
              type="textarea"
              placeholder="جزئیات بیشتر درباره موضوع جلسه، اهداف یا نکات مهم..."
              rows={3}
              enableVoice={true}
              label="توضیحات اضافی (اختیاری)"
              disabled={isAnalyzing}
              className="text-base resize-none"
            />
          </div>

          <Button
            onClick={analyzeCustomTopic}
            disabled={isAnalyzing || !customTopic.trim()}
            size="lg"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 ml-2 animate-spin" />
                در حال جستجو در اینترنت...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 ml-2" />
                🔍 جستجو و تحلیل هوشمند
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Custom Analysis Results */}
      {customPreparation && (
        <Card id="custom-results" className="border-2 border-primary/30 animate-fade-in">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-blue-500/10">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-xl mb-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  نتایج تحلیل: {customTopic}
                </CardTitle>
                <CardDescription>
                  اطلاعات جمع‌آوری‌شده از اینترنت — روی هر مورد کلیک کنید تا کامل بخوانید
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomPreparation(null);
                  setCustomTopic('');
                  setCustomDescription('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <RefreshCw className="h-4 w-4 ml-2" />
                تحلیل جدید
              </Button>
            </div>
          </CardHeader>
          {renderPreparationContent(customPreparation)}
        </Card>
      )}

      {/* Upcoming Meetings Section */}
      {meetings.length > 0 && (
        <>
          <div className="flex items-center justify-between pt-8 border-t">
            <div>
              <h2 className="text-2xl font-bold">جلسات آینده</h2>
              <p className="text-muted-foreground mt-1">تحلیل خودکار برای جلسات برنامه‌ریزی شده</p>
            </div>
          </div>

          {meetings.map(meeting => {
            const prep = preparationData[meeting.id];
            const isGenerating = generatingFor === meeting.id;

            return (
              <Card key={meeting.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-xl mb-2">
                        <Calendar className="w-5 h-5" />
                        {meeting.title}
                      </CardTitle>
                      <CardDescription>
                        {new Date(meeting.date).toLocaleDateString('fa-IR', {
                          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                        })}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => generatePreparation(meeting)}
                      disabled={isGenerating}
                      variant={prep ? "outline" : "default"}
                      size="sm"
                    >
                      {isGenerating ? (
                        <><Loader2 className="h-4 w-4 ml-2 animate-spin" />در حال جستجو...</>
                      ) : prep ? (
                        <><RefreshCw className="h-4 w-4 ml-2" />بروزرسانی</>
                      ) : (
                        <><Sparkles className="h-4 w-4 ml-2" />تحلیل هوشمند</>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {prep && renderPreparationContent(prep)}
              </Card>
            );
          })}
        </>
      )}
    </div>
  );
};
