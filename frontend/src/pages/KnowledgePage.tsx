import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { KnowledgeCapture } from '@/components/knowledge/KnowledgeCapture';
import { KnowledgeSearch } from '@/components/knowledge/KnowledgeSearch';
import { KnowledgeGraph } from '@/components/knowledge/KnowledgeGraph';
import { FolderTree } from '@/components/knowledge/FolderTree';
import { DocumentProcessor } from '@/components/knowledge/DocumentProcessor';
import { Brain, Search, Share2, Folder, FileText } from 'lucide-react';
import { SectionHeader } from '@/components/ui/section-header';
import { LuxuryTabs } from '@/components/ui/luxury-tabs';
import { TabsContent } from '@/components/ui/tabs';
import { ModernButton } from '@/components/ui/modern-button';
import { ModernCard } from '@/components/ui/modern-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QuickCaptureModal } from '@/components/knowledge/QuickCaptureModal';
import { useHotkeys } from 'react-hotkeys-hook';
import { seedKnowledgeSamples } from '@/services/knowledgeSampleData';
import { useToast } from '@/hooks/use-toast';
import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';
import type { KnowledgeItem } from '@/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface OutletContext {
  sidebarOpen: boolean;
}

const KnowledgePage = () => {
  const { sidebarOpen } = useOutletContext<OutletContext>();
  const { toast } = useToast();
  const [isSeeding, setIsSeeding] = useState(false);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();

  const loadItems = async () => {
    try {
      const res = await supabaseKnowledgeService.searchKnowledge('', {} as any);
      setItems(res.items || []);
    } catch {
      setItems([]);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const count = await seedKnowledgeSamples();
      toast({ title: 'نمونه‌ها افزوده شد', description: `${count} آیتم نمونه اضافه شد` });
      await loadItems();
    } catch (e) {
      toast({ title: 'خطا', description: 'افزودن نمونه‌ها ناموفق بود', variant: 'destructive' });
    } finally {
      setIsSeeding(false);
    }
  };
  const isMobile = useIsMobile();
  
  return (
    <div className={cn(
      "transition-all duration-300 mx-auto",
      isMobile ? "p-3 space-y-4" : "p-6 md:p-12 space-y-8 md:space-y-12",
      sidebarOpen ? 'max-w-5xl' : 'max-w-7xl'
    )}>
      <SectionHeader
        title="مدیریت دانش"
        subtitle="ذخیره، جستجو و مدیریت دانش شخصی با راحتی کامل"
        icon={<Brain className="h-8 w-8" />}
        gradient
        action={
          <ModernButton 
            variant="secondary" 
            onClick={handleSeed} 
            disabled={isSeeding}
            loading={isSeeding}
            magnetic
          >
            {isSeeding ? 'در حال افزودن...' : 'افزودن نمونه‌ها'}
          </ModernButton>
        }
      />

      <LuxuryTabs
        items={[
          { value: "capture", label: "ذخیره دانش", icon: <Brain className="h-6 w-6" /> },
          { value: "pdf", label: "پردازش PDF", icon: <FileText className="h-6 w-6" /> },
          { value: "search", label: "جستجو", icon: <Search className="h-6 w-6" /> },
          { value: "folders", label: "فولدرها", icon: <Folder className="h-6 w-6" /> },
          { value: "graph", label: "نمودار دانش", icon: <Share2 className="h-6 w-6" /> }
        ]}
        value="capture"
        onValueChange={() => {}}
      >

        <TabsContent value="capture">
          <KnowledgeCapture />
        </TabsContent>

        <TabsContent value="pdf">
          <DocumentProcessor onDocumentProcessed={() => loadItems()} />
        </TabsContent>

        <TabsContent value="search">
          <KnowledgeSearch />
        </TabsContent>

        <TabsContent value="folders">
          <Card className="p-8 border-3 border-primary/20 shadow-2xl rounded-2xl bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
                <Folder className="h-7 w-7" />
                مدیریت فولدرها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FolderTree
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
                onFolderChange={loadItems}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graph">
          {items.length === 0 ? (
            <Card className="p-8 border-3 border-primary/20 shadow-2xl rounded-2xl bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="pb-6">
                <CardTitle className="text-2xl font-bold text-primary flex items-center gap-3">
                  <Brain className="h-7 w-7" />
                  هنوز دانشی ثبت نشده است
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-6">برای مشاهده نمودار دانش، چند نمونه اضافه کنید یا از تب «ذخیره دانش» شروع کنید.</p>
                <Button variant="default" onClick={handleSeed} disabled={isSeeding}>
                  {isSeeding ? 'در حال افزودن...' : 'افزودن نمونه‌ها'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={cn(
              "grid gap-10",
              isMobile ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"
            )}>
              <KnowledgeGraph knowledge={items} />
              <ModernCard
                title="آمار دانش"
                icon={<Brain className="h-8 w-8" />}
                hover
                glow
              >
                <div className="space-y-6">
                  <div className="flex justify-between items-center py-4 border-b border-lux-gold/20 bg-gradient-lux px-4 rounded-lg">
                    <span className="text-lg font-semibold">کل یادداشت‌ها</span>
                    <span className="font-bold text-2xl text-lux-midnight">{items.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-lux-gold/20 bg-gradient-lux px-4 rounded-lg">
                    <span className="text-lg font-semibold">دسته‌بندی‌ها</span>
                    <span className="font-bold text-2xl text-lux-midnight">{Array.from(new Set(items.map(i => i.category))).length}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-lux-gold/20 bg-gradient-lux px-4 rounded-lg">
                    <span className="text-lg font-semibold">لینک‌ها</span>
                    <span className="font-bold text-2xl text-lux-midnight">{items.filter(i => i.type === 'link').length}</span>
                  </div>
                  <div className="flex justify-between items-center py-4 bg-gradient-lux px-4 rounded-lg">
                    <span className="text-lg font-semibold">فایل‌ها</span>
                    <span className="font-bold text-2xl text-lux-midnight">{items.filter(i => i.type !== 'text' && i.type !== 'link').length}</span>
                  </div>
                </div>
              </ModernCard>
            </div>
          )}
        </TabsContent>
      </LuxuryTabs>
    </div>
  );
};

export default KnowledgePage;