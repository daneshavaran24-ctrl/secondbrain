import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createEducation, updateEducation, type Education } from '@/services/resumeService';
import { Loader2 } from 'lucide-react';

interface ResumeEducationDialogProps {
  open: boolean;
  onClose: () => void;
  editItem?: Education | null;
}

export function ResumeEducationDialog({ open, onClose, editItem }: ResumeEducationDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Education>>({
    degree: '',
    university: '',
    field_of_study: '',
    start_year: undefined,
    end_year: undefined,
    description: '',
    certificate_url: ''
  });

  useEffect(() => {
    if (editItem) {
      setFormData(editItem);
    } else {
      setFormData({
        degree: '',
        university: '',
        field_of_study: '',
        start_year: undefined,
        end_year: undefined,
        description: '',
        certificate_url: ''
      });
    }
  }, [editItem, open]);

  const handleSave = async () => {
    if (!formData.degree || !formData.university) {
      toast.error('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    setSaving(true);
    try {
      if (editItem?.id) {
        await updateEducation(editItem.id, formData);
        toast.success('مورد با موفقیت به‌روزرسانی شد');
      } else {
        await createEducation({ ...formData, user_id: getActiveUserId() } as any);
        toast.success('مورد با موفقیت اضافه شد');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving education:', error);
      toast.error('خطا در ذخیره اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'ویرایش مدرک تحصیلی' : 'افزودن مدرک تحصیلی'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="degree">مدرک *</Label>
              <Input
                id="degree"
                value={formData.degree || ''}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                placeholder="مثلاً: کارشناسی ارشد"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">دانشگاه *</Label>
              <Input
                id="university"
                value={formData.university || ''}
                onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                placeholder="نام دانشگاه"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_of_study">رشته تحصیلی</Label>
            <Input
              id="field_of_study"
              value={formData.field_of_study || ''}
              onChange={(e) => setFormData({ ...formData, field_of_study: e.target.value })}
              placeholder="مثلاً: مهندسی کامپیوتر"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_year">سال شروع</Label>
              <Input
                id="start_year"
                type="number"
                value={formData.start_year || ''}
                onChange={(e) => setFormData({ ...formData, start_year: parseInt(e.target.value) || undefined })}
                placeholder="1400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_year">سال پایان</Label>
              <Input
                id="end_year"
                type="number"
                value={formData.end_year || ''}
                onChange={(e) => setFormData({ ...formData, end_year: parseInt(e.target.value) || undefined })}
                placeholder="1404"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات اضافی..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_url">لینک مدرک</Label>
            <Input
              id="certificate_url"
              value={formData.certificate_url || ''}
              onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
              placeholder="آدرس URL مدرک"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  در حال ذخیره...
                </>
              ) : (
                'ذخیره'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}