import { useState } from 'react';
import { Edit, Download, Trash2, Star, StarOff, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteTemplate, setDefaultTemplate, type ResumeTemplate } from '@/services/resumeTemplateService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ResumeTemplateCardProps {
  template: ResumeTemplate;
  onUpdate: () => void;
}

export function ResumeTemplateCard({ template, onUpdate }: ResumeTemplateCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTemplate(template.id);
      toast({
        title: 'قالب حذف شد',
        description: 'قالب رزومه با موفقیت حذف شد',
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطا در حذف قالب',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleToggleDefault = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (!template.is_default) {
        await setDefaultTemplate(user.id, template.id);
        toast({
          title: 'قالب پیش‌فرض تنظیم شد',
        });
      }
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'خطا در تنظیم قالب پیش‌فرض',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    toast({
      title: 'در حال آماده‌سازی...',
      description: 'دانلود PDF به زودی فعال می‌شود',
    });
  };

  return (
    <>
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-lg">{template.template_name}</h3>
                {template.job_title && (
                  <p className="text-sm text-muted-foreground">{template.job_title}</p>
                )}
                {template.company_name && (
                  <p className="text-xs text-muted-foreground">{template.company_name}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleDefault}
              disabled={loading}
            >
              {template.is_default ? (
                <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
              ) : (
                <StarOff className="w-4 h-4 text-muted-foreground" />
              )}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {template.ai_optimized && (
              <Badge variant="secondary">بهینه‌شده با AI</Badge>
            )}
            {template.is_default && (
              <Badge variant="default">پیش‌فرض</Badge>
            )}
            <Badge variant="outline">{template.layout_style}</Badge>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              ویرایش
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف قالب رزومه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این قالب را حذف کنید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={loading}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
