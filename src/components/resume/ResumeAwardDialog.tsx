import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MOCK_USER_ID } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeFileUploader } from './ResumeFileUploader';
import { createAward, updateAward, Award } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';

interface ResumeAwardDialogProps {
  open: boolean;
  onClose: () => void;
  award?: Award;
}

const AWARD_CATEGORIES = ['صنعتی', 'استاندارد', 'کارآفرینی', 'علمی', 'هنری', 'ورزشی', 'اجتماعی'];

export function ResumeAwardDialog({ open, onClose, award }: ResumeAwardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    issuing_organization: '',
    award_date: '',
    description: '',
    certificate_image_url: '',
    video_url: '',
    media_links: {} as Record<string, string>,
  });

  useEffect(() => {
    if (award) {
      setFormData({
        title: award.title || '',
        category: award.category || '',
        issuing_organization: award.issuing_organization || '',
        award_date: award.award_date || '',
        description: award.description || '',
        certificate_image_url: award.certificate_image_url || '',
        video_url: award.video_url || '',
        media_links: award.media_links || {},
      });
    } else {
      setFormData({
        title: '',
        category: '',
        issuing_organization: '',
        award_date: '',
        description: '',
        certificate_image_url: '',
        video_url: '',
        media_links: {},
      });
    }
  }, [award, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (award?.id) {
        await updateAward(award.id, formData);
        toast({ title: 'افتخار با موفقیت به‌روزرسانی شد' });
      } else {
        await createAward({ ...formData, user_id: MOCK_USER_ID });
        toast({ title: 'افتخار با موفقیت ایجاد شد' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving award:', error);
      toast({
        title: 'خطا در ذخیره افتخار',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {award ? 'ویرایش افتخار' : 'افزودن افتخار جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>عنوان افتخار *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>دسته‌بندی</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  {AWARD_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاریخ دریافت *</Label>
              <Input
                type="date"
                value={formData.award_date}
                onChange={(e) => setFormData({ ...formData, award_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <Label>سازمان اهداکننده *</Label>
            <Input
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>توضیحات</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <>
            <div>
              <Label>آپلود تصویر لوح تقدیر</Label>
              <ResumeFileUploader
                userId={MOCK_USER_ID}
                  category="awards"
                  onUploadComplete={(url) => setFormData({ ...formData, certificate_image_url: url })}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                />
            </div>

            <div>
              <Label>آپلود ویدیو مراسم</Label>
              <ResumeFileUploader
                userId={MOCK_USER_ID}
                category="awards"
                onUploadComplete={(url) => setFormData({ ...formData, video_url: url })}
                accept={{ 'video/*': ['.mp4', '.mov'] }}
              />
            </div>
          </>

          <div>
            <Label>لینک اینستاگرام</Label>
            <Input
              value={formData.media_links.instagram || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media_links: { ...formData.media_links, instagram: e.target.value },
                })
              }
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <Label>لینک تلگرام</Label>
            <Input
              value={formData.media_links.telegram || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  media_links: { ...formData.media_links, telegram: e.target.value },
                })
              }
              placeholder="https://t.me/..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
