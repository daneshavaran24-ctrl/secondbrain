import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTemplate } from '@/services/resumeTemplateService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateTemplateDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTemplateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    template_name: '',
    job_title: '',
    company_name: '',
    job_description: '',
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('کاربر وارد نشده است');

      await createTemplate({
        user_id: user.id,
        ...formData,
        sections_config: {
          personal_info: true,
          education: true,
          work_experience: true,
          skills: true,
          certificates: true,
          awards: true,
          affiliations: false,
          publications: false,
          media_interviews: false,
          interests: false,
        },
      });

      toast({
        title: 'قالب ساخته شد',
        description: 'قالب رزومه جدید با موفقیت ساخته شد',
      });

      setFormData({
        template_name: '',
        job_title: '',
        company_name: '',
        job_description: '',
      });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'خطا در ساخت قالب',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIOptimize = () => {
    toast({
      title: 'قابلیت AI',
      description: 'بهینه‌سازی با AI به زودی فعال می‌شود',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>ساخت رزومه جدید</DialogTitle>
            <DialogDescription>
              برای موقعیت شغلی خاص یک رزومه اختصاصی بسازید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="template_name">نام قالب *</Label>
              <Input
                id="template_name"
                placeholder="مثلاً: رزومه برای شرکت گوگل"
                value={formData.template_name}
                onChange={(e) =>
                  setFormData({ ...formData, template_name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_title">عنوان شغلی هدف</Label>
              <Input
                id="job_title"
                placeholder="مثلاً: Senior Frontend Developer"
                value={formData.job_title}
                onChange={(e) =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">نام شرکت</Label>
              <Input
                id="company_name"
                placeholder="مثلاً: Google"
                value={formData.company_name}
                onChange={(e) =>
                  setFormData({ ...formData, company_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="job_description">شرح موقعیت شغلی (Job Description)</Label>
              <Textarea
                id="job_description"
                placeholder="شرح موقعیت شغلی را اینجا وارد کنید تا AI بهترین رزومه را برای شما بسازد..."
                value={formData.job_description}
                onChange={(e) =>
                  setFormData({ ...formData, job_description: e.target.value })
                }
                rows={6}
              />
            </div>

            {formData.job_description && (
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleAIOptimize}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                تحلیل هوشمند با AI
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ساخت...' : 'ساخت قالب'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
