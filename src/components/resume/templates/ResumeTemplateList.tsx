import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResumeTemplateCard } from './ResumeTemplateCard';
import { CreateTemplateDialog } from './CreateTemplateDialog';
import { getTemplates, type ResumeTemplate } from '@/services/resumeTemplateService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function ResumeTemplateList() {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const data = await getTemplates(user.id);
      setTemplates(data);
    } catch (error: any) {
      toast({
        title: 'خطا در بارگذاری قالب‌ها',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold">قالب‌های رزومه من</h2>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          ساخت رزومه جدید با AI
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">هنوز رزومه‌ای ساخته نشده</h3>
          <p className="text-muted-foreground mb-4">
            با ساخت قالب‌های مختلف رزومه، برای هر موقعیت شغلی یک رزومه اختصاصی داشته باشید
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            ساخت اولین رزومه
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <ResumeTemplateCard
              key={template.id}
              template={template}
              onUpdate={loadTemplates}
            />
          ))}
        </div>
      )}

      <CreateTemplateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadTemplates}
      />
    </div>
  );
}
