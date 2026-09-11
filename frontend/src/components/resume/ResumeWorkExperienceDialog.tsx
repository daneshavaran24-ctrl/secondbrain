import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createWorkExperience, updateWorkExperience, type WorkExperience } from '@/services/resumeService';
import { Loader2, Plus, X } from 'lucide-react';

interface ResumeWorkExperienceDialogProps {
  open: boolean;
  onClose: () => void;
  editItem?: WorkExperience | null;
}

export function ResumeWorkExperienceDialog({ open, onClose, editItem }: ResumeWorkExperienceDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WorkExperience>>({
    job_title: '',
    company_name: '',
    company_website: '',
    start_date: '',
    end_date: '',
    description: '',
    responsibilities: [],
    achievements: []
  });
  const [newResponsibility, setNewResponsibility] = useState('');
  const [newAchievement, setNewAchievement] = useState('');

  useEffect(() => {
    if (editItem) {
      setFormData(editItem);
    } else {
      setFormData({
        job_title: '',
        company_name: '',
        company_website: '',
        start_date: '',
        end_date: '',
        description: '',
        responsibilities: [],
        achievements: []
      });
    }
  }, [editItem, open]);

  const handleSave = async () => {
    if (!formData.job_title || !formData.company_name || !formData.start_date) {
      toast.error('لطفاً فیلدهای الزامی را پر کنید');
      return;
    }

    setSaving(true);
    try {
      if (editItem?.id) {
        await updateWorkExperience(editItem.id, formData);
        toast.success('مورد با موفقیت به‌روزرسانی شد');
      } else {
        await createWorkExperience({ ...formData, user_id: getActiveUserId() } as any);
        toast.success('مورد با موفقیت اضافه شد');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving work experience:', error);
      toast.error('خطا در ذخیره اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData({
        ...formData,
        responsibilities: [...(formData.responsibilities || []), newResponsibility.trim()]
      });
      setNewResponsibility('');
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData({
      ...formData,
      responsibilities: formData.responsibilities?.filter((_, i) => i !== index)
    });
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setFormData({
        ...formData,
        achievements: [...(formData.achievements || []), newAchievement.trim()]
      });
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements?.filter((_, i) => i !== index)
    });
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'ویرایش سابقه کاری' : 'افزودن سابقه کاری'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="job_title">عنوان شغلی *</Label>
              <Input
                id="job_title"
                value={formData.job_title || ''}
                onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                placeholder="مثلاً: مدیر عامل"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">نام شرکت *</Label>
              <Input
                id="company_name"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="نام شرکت"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_website">وبسایت شرکت</Label>
            <Input
              id="company_website"
              value={formData.company_website || ''}
              onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">تاریخ شروع *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date || ''}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">تاریخ پایان</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date || ''}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">برای شغل فعلی خالی بگذارید</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">توضیحات</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="توضیحات کلی در مورد شغل..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>مسئولیت‌ها</Label>
            <div className="flex gap-2">
              <Input
                value={newResponsibility}
                onChange={(e) => setNewResponsibility(e.target.value)}
                placeholder="مسئولیت جدید..."
                onKeyPress={(e) => e.key === 'Enter' && addResponsibility()}
              />
              <Button type="button" onClick={addResponsibility}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {formData.responsibilities?.map((resp, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                  <span className="text-sm">{resp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeResponsibility(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>دستاوردها</Label>
            <div className="flex gap-2">
              <Input
                value={newAchievement}
                onChange={(e) => setNewAchievement(e.target.value)}
                placeholder="دستاورد جدید..."
                onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
              />
              <Button type="button" onClick={addAchievement}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-1 mt-2">
              {formData.achievements?.map((ach, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/50 p-2 rounded">
                  <span className="text-sm">{ach}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAchievement(idx)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
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