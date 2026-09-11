import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Lightbulb, RefreshCw, ExternalLink, Copy, Clock, Calendar,
  Newspaper, BookOpen, TrendingUp, Globe, BarChart3, Users, 
  MessageSquare, Sparkles, Loader2, Search
} from 'lucide-react';
import type { Meeting } from '@/types';

interface PreparationData {
  domestic_news?: Array<{
    title: string;
    summary: string;
    source: string;
    url?: string;
    relevance_score?: number;
    credibility?: 'high' | 'medium' | 'low';
    date?: string;
  }>;
  international_news?: Array<{
    title: string;
    summary: string;
    source: string;
    url?: string;
    relevance_score?: number;
    credibility?: 'high' | 'medium' | 'low';
    date?: string;
  }>;
  trending_topics?: Array<{
    topic: string;
    description: string;
    trend_score?: number;
    hashtags?: string[];
  }>;
  research_articles?: Array<{
    title: string;
    summary: string;
    authors?: string;
    source: string;
    url?: string;
    relevance_score?: number;
  }>;
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

export const MeetingPreparation: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [preparationData, setPreparationData] = useState<Record<string, PreparationData>>({});
  const [customTopic, setCustomTopic] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customPreparation, setCustomPreparation] = useState<PreparationData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadMeetings();
    loadPreparationData();
  }, []);

  const loadMeetings = () => {
    const stored = localStorage.getItem('meetings');
    if (stored) {
      const allMeetings: Meeting[] = JSON.parse(stored);
      const upcoming = allMeetings.filter(m => 
        new Date(m.date) > new Date()
      ).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      setMeetings(upcoming);
    }
    setLoading(false);
  };

  const loadPreparationData = () => {
    const stored = localStorage.getItem('meeting_preparation_data');
    if (stored) {
      setPreparationData(JSON.parse(stored));
    }
  };

  const savePreparationData = (meetingId: string, data: PreparationData) => {
    const updated = { ...preparationData, [meetingId]: data };
    setPreparationData(updated);
    localStorage.setItem('meeting_preparation_data', JSON.stringify(updated));
  };

  const analyzeCustomTopic = async () => {
    if (!customTopic.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً موضوع جلسه را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('meeting-preparation', {
        body: {
          meetingTitle: customTopic,
          meetingDescription: customDescription || ''
        }
      });

      if (error) throw error;

      setCustomPreparation(data);
      
      toast({
        title: "✅ تحلیل کامل شد",
        description: "مطالب آمادگی جلسه با موفقیت تولید شد",
      });

      // Auto scroll to results
      setTimeout(() => {
        document.getElementById('custom-results')?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    } catch (error: any) {
      console.error('Error analyzing topic:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در تحلیل موضوع",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreparation = async (meeting: Meeting) => {
    setGeneratingFor(meeting.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('meeting-preparation', {
        body: {
          meetingTitle: meeting.title,
          meetingDescription: meeting.summary || ''
        }
      });

      if (error) throw error;

      savePreparationData(meeting.id, data);
      
      toast({
        title: "✅ تحلیل کامل شد",
        description: "مطالب آمادگی جلسه با موفقیت تولید شد",
      });
    } catch (error: any) {
      console.error('Error generating preparation:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در تولید مطالب آمادگی",
        variant: "destructive"
      });
    } finally {
      setGeneratingFor(null);
    }
  };

  const copyToClipboard = (prep: PreparationData) => {
    const text = `
نکات کلیدی:
${prep.key_points?.map(p => `• ${p}`).join('\n') || ''}

سوالات پیشنهادی:
${prep.suggested_questions?.map((q, i) => `${i + 1}. ${q}`).join('\n') || ''}
    `.trim();
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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      case 'mixed': return 'text-yellow-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'مثبت';
      case 'negative': return 'منفی';
      case 'mixed': return 'متفاوت';
      default: return 'خنثی';
    }
  };

  const getCredibilityBadge = (credibility?: string) => {
    switch (credibility) {
      case 'high': return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">اعتبار بالا</Badge>;
      case 'medium': return <Badge variant="secondary">اعتبار متوسط</Badge>;
      case 'low': return <Badge variant="outline">اعتبار پایین</Badge>;
      default: return null;
    }
  };

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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => copyToClipboard(prep)}
        >
          <Copy className="w-4 h-4 ml-2" />
          کپی
        </Button>
      </div>

      {prep.trending_topics && prep.trending_topics.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg border border-purple-500/20">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            ترندهای روز (LinkedIn, Twitter, Telegram)
          </h3>
          <div className="space-y-3">
            {prep.trending_topics.map((trend, idx) => (
              <div key={idx} className="bg-background/50 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{trend.topic}</h4>
                  {trend.trend_score && (
                    <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300">
                      🔥 {Math.round(trend.trend_score * 100)}%
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{trend.description}</p>
                {trend.hashtags && trend.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {trend.hashtags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
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
                <span className="text-yellow-500 mt-1 font-bold">•</span>
                <span>{point}</span>
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
          </h3>
          <div className="space-y-3">
            {prep.domestic_news.map((item, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm flex-1">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    {getCredibilityBadge(item.credibility)}
                    {item.relevance_score && (
                      <Badge variant="secondary">
                        {Math.round(item.relevance_score * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    📰 {item.source}
                  </Badge>
                  {item.date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('fa-IR')}
                    </span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mr-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      مشاهده منبع
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prep.international_news && prep.international_news.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Globe className="w-5 h-5 text-green-500" />
            اخبار بین‌المللی
          </h3>
          <div className="space-y-3">
            {prep.international_news.map((item, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm flex-1">{item.title}</h4>
                  <div className="flex items-center gap-2">
                    {getCredibilityBadge(item.credibility)}
                    {item.relevance_score && (
                      <Badge variant="secondary">
                        {Math.round(item.relevance_score * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    🌍 {item.source}
                  </Badge>
                  {item.date && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('fa-IR')}
                    </span>
                  )}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mr-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      مشاهده منبع
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {prep.research_articles && prep.research_articles.length > 0 && (
        <div>
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            مقالات تحقیقاتی (ایرانی و بین‌المللی)
          </h3>
          <div className="space-y-3">
            {prep.research_articles.map((item, idx) => (
              <div key={idx} className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm flex-1">{item.title}</h4>
                  {item.relevance_score && (
                    <Badge variant="secondary">
                      {Math.round(item.relevance_score * 100)}%
                    </Badge>
                  )}
                </div>
                {item.authors && (
                  <p className="text-xs text-muted-foreground mb-2">
                    👤 {item.authors}
                  </p>
                )}
                <p className="text-sm text-muted-foreground leading-relaxed">{item.summary}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Badge variant="outline" className="text-xs">
                    📚 {item.source}
                  </Badge>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mr-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      مشاهده مقاله
                    </a>
                  )}
                </div>
              </div>
            ))}
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
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                      {stat.value}
                    </p>
                    {stat.context && (
                      <p className="text-xs text-muted-foreground">{stat.context}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">
                    📊 {stat.source}
                  </Badge>
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
          </h3>
          <div className="space-y-3">
            {prep.expert_opinions.map((opinion, idx) => (
              <div key={idx} className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-lg">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-medium text-sm">👤 {opinion.expert}</h4>
                  {getCredibilityBadge(opinion.credibility)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">
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
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </CardContent>
  );

  if (loading) {
    return <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Custom Topic Analysis Form */}
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6 text-primary" />
            تحلیل موضوع سفارشی
          </CardTitle>
          <CardDescription>
            موضوع جلسه خود را وارد کنید تا تحلیل جامع اخبار، مقالات، کتاب‌ها و ترندهای مرتبط را دریافت کنید
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
              rows={4}
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
                در حال تحلیل هوشمند...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 ml-2" />
                🔍 تحلیل جامع با AI
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
                  تحلیل جامع شامل اخبار، مقالات، کتاب‌ها و ترندهای مرتبط
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
              <p className="text-muted-foreground mt-1">
                تحلیل خودکار برای جلسات برنامه‌ریزی شده
              </p>
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
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
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
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          در حال تحلیل...
                        </>
                      ) : prep ? (
                        <>
                          <RefreshCw className="h-4 w-4 ml-2" />
                          بروزرسانی
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 ml-2" />
                          تحلیل هوشمند
                        </>
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