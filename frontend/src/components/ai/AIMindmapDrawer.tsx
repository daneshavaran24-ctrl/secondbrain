import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Copy, Save, Download, GitBranch, ExternalLink } from 'lucide-react';
import { generateMindmap } from '@/lib/ai';
import { MindMap } from './MindMap';
import type { ContentItem } from '@/pages/CulturalContentPage';

interface AIMindmapDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  item: ContentItem;
  onUpdateItem: (id: string, updates: Partial<ContentItem>) => void;
}

export interface MindmapNode {
  id: string;
  label: string;
  group?: string;
  level: number;
}

export interface MindmapEdge {
  from: string;
  to: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  title: string;
  description?: string;
}

export const AIMindmapDrawer: React.FC<AIMindmapDrawerProps> = ({
  isOpen,
  onClose,
  item,
  onUpdateItem
}) => {
  const [sourceUrl, setSourceUrl] = useState(item.link || '');
  const [sourceText, setSourceText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mindmapData, setMindmapData] = useState<MindmapData | null>(item.mindmap || null);

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
    setMindmapData(null);

    try {
      const source = sourceText.trim() || sourceUrl.trim();
      const result = await generateMindmap(
        source,
        item.title,
        customPrompt.trim() || undefined
      );

      setMindmapData(result);
      toast({
        title: "مایندمپ تولید شد",
        description: "مایندمپ با موفقیت تولید شد.",
      });
    } catch (error) {
      console.error('Error generating mindmap:', error);
      toast({
        title: "خطا در تولید مایندمپ",
        description: error instanceof Error ? error.message : "خطا در تولید مایندمپ",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyJson = () => {
    if (mindmapData) {
      navigator.clipboard.writeText(JSON.stringify(mindmapData, null, 2));
      toast({
        title: "کپی شد",
        description: "JSON مایندمپ در کلیپ‌بورد کپی شد.",
      });
    }
  };

  const handleDownloadJson = () => {
    if (mindmapData) {
      const blob = new Blob([JSON.stringify(mindmapData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mindmap-${item.title.replace(/[^a-zA-Z0-9-_]/g, '')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "دانلود شد",
        description: "فایل JSON مایندمپ دانلود شد.",
      });
    }
  };

  const handleSave = () => {
    if (mindmapData) {
      onUpdateItem(item.id, { mindmap: mindmapData });
      toast({
        title: "ذخیره شد",
        description: "مایندمپ در آیتم ذخیره شد.",
      });
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-full sm:w-[700px] lg:w-[900px] xl:w-[1100px] overflow-y-auto" dir="rtl">
        <SheetHeader className="text-right">
          <SheetTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            تولید مایندمپ هوشمند
          </SheetTitle>
          <SheetDescription>
            تولید مایندمپ تعاملی برای: {item.title}
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
                    placeholder="https://example.com/book-summary"
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
                  placeholder="خلاصه کتاب یا متن اصلی را اینجا وارد کنید..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customPrompt">درخواست سفارشی (اختیاری)</Label>
                <Textarea
                  id="customPrompt"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="مثلاً: روی مفاهیم فلسفی تمرکز کن یا ساختار کتاب را نمایش بده..."
                  rows={2}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || (!sourceUrl.trim() && !sourceText.trim())}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    در حال تولید مایندمپ...
                  </>
                ) : (
                  'تولید مایندمپ'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Mindmap Result */}
          {mindmapData && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">مایندمپ تولید شده</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyJson}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      کپی JSON
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadJson}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      دانلود JSON
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
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">{mindmapData.title}</h4>
                    {mindmapData.description && (
                      <p className="text-sm text-muted-foreground">{mindmapData.description}</p>
                    )}
                  </div>
                  
                  <div className="border rounded-lg p-4 bg-background">
                    <MindMap data={mindmapData} />
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>تعداد گره‌ها: {mindmapData.nodes.length}</p>
                    <p>تعداد اتصالات: {mindmapData.edges.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
