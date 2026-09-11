import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Copy, Save, FileText, ExternalLink } from 'lucide-react';
import { summarizeContent } from '@/lib/ai';
import type { ContentItem } from '@/pages/CulturalContentPage';

interface AISummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem;
  onUpdateItem: (id: string, updates: Partial<ContentItem>) => void;
}

interface SummaryResult {
  summary: string;
  key_points: string[];
  quotes?: string[];
  actions?: string[];
  tags?: string[];
}

export const AISummaryDrawer: React.FC<AISummaryDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateItem
}) => {
  const [sourceUrl, setSourceUrl] = useState(item.link || '');
  const [sourceText, setSourceText] = useState('');
  const [detailLevel, setDetailLevel] = useState<'short' | 'medium' | 'long'>('medium');
  const [outputLanguage, setOutputLanguage] = useState('persian');
  const [isGenerating, setIsGenerating] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(item.aiSummary || null);

  const handleGenerate = async () => {
    if (!sourceUrl.trim() && !sourceText.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً منبع (لینک یا متن) را وارد کنید.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setSummaryResult(null);

    try {
      const source = sourceText.trim() || sourceUrl.trim();
      const result = await summarizeContent(
        source,
        item.title,
        detailLevel,
        outputLanguage
      );

      setSummaryResult(result);
      toast({
        title: "خلاصه تولید شد",
        description: "خلاصه با موفقیت تولید شد.",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        title: "خطا در تولید خلاصه",
        description: error instanceof Error ? error.message : "خطا در تولید خلاصه",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: "متن در کلیپ‌بورد کپی شد.",
    });
  };

  const handleSave = () => {
    if (summaryResult) {
      onUpdateItem(item.id, { aiSummary: summaryResult });
      toast({
        title: "ذخیره شد",
        description: "خلاصه در آیتم ذخیره شد.",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:w-[600px] lg:w-[800px] overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            خلاصه‌سازی هوشمند
          </SheetTitle>
          <SheetDescription>
            تولید خلاصه ساختاریافته برای: {item.title}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">منبع اطلاعات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">لینک منبع</Label>
                <div className="flex gap-2">
                  <Input
                    id="sourceUrl"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/book-review"
                    className="flex-1"
                  />
                  {sourceUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(sourceUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                یا
              </div>

              <div className="space-y-2">
                <Label htmlFor="sourceText">متن منبع</Label>
                <Textarea
                  id="sourceText"
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="متن کتاب یا منبع اطلاعات را اینجا وارد کنید..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>میزان جزئیات</Label>
                  <Select value={detailLevel} onValueChange={(value: any) => setDetailLevel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short">کوتاه</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="long">بلند</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>زبان خروجی</Label>
                  <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="persian">فارسی</SelectItem>
                      <SelectItem value="english">انگلیسی</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!sourceUrl.trim() && !sourceText.trim())}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال تولید خلاصه...
                  </>
                ) : (
                  'تولید خلاصه'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Result */}
          {summaryResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">نتیجه خلاصه‌سازی</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(JSON.stringify(summaryResult, null, 2))}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      کپی
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSave}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      ذخیره
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="space-y-2">
                  <h4 className="font-medium">خلاصه</h4>
                  <div className="p-3 bg-muted rounded-lg text-sm leading-relaxed">
                    {summaryResult.summary}
                  </div>
                </div>

                {/* Key Points */}
                {summaryResult.key_points && summaryResult.key_points.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">نکات کلیدی</h4>
                    <div className="space-y-2">
                      {summaryResult.key_points.map((point, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quotes */}
                {summaryResult.quotes && summaryResult.quotes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">نقل‌قول‌های مهم</h4>
                    <div className="space-y-2">
                      {summaryResult.quotes.map((quote, index) => (
                        <blockquote key={index} className="border-r-4 border-primary pr-3 text-sm italic">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {summaryResult.actions && summaryResult.actions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">اقدامات پیشنهادی</h4>
                    <div className="space-y-2">
                      {summaryResult.actions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {summaryResult.tags && summaryResult.tags.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">برچسب‌های پیشنهادی</h4>
                    <div className="flex flex-wrap gap-2">
                      {summaryResult.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
