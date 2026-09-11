import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createSkill, updateSkill, type Skill } from '@/services/resumeService';
import { Loader2 } from 'lucide-react';

interface ResumeSkillDialogProps {
  open: boolean;
  onClose: () => void;
  editItem?: Skill | null;
}

export function ResumeSkillDialog({ open, onClose, editItem }: ResumeSkillDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Skill>>({
    skill_name: '',
    proficiency_level: 'intermediate',
    category: '',
    years_of_experience: undefined,
    certificate_url: ''
  });

  useEffect(() => {
    if (editItem) {
      setFormData(editItem);
    } else {
      setFormData({
        skill_name: '',
        proficiency_level: 'intermediate',
        category: '',
        years_of_experience: undefined,
        certificate_url: ''
      });
    }
  }, [editItem, open]);

  const handleSave = async () => {
    if (!formData.skill_name) {
      toast.error('لطفاً نام مهارت را وارد کنید');
      return;
    }

    setSaving(true);
    try {
      if (editItem?.id) {
        await updateSkill(editItem.id, formData);
        toast.success('مورد با موفقیت به‌روزرسانی شد');
      } else {
        await createSkill({ ...formData, user_id: getActiveUserId() } as any);
        toast.success('مورد با موفقیت اضافه شد');
      }
      onClose();
    } catch (error: any) {
      console.error('Error saving skill:', error);
      toast.error('خطا در ذخیره اطلاعات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editItem ? 'ویرایش مهارت' : 'افزودن مهارت'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="skill_name">نام مهارت *</Label>
            <Input
              id="skill_name"
              value={formData.skill_name || ''}
              onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
              placeholder="مثلاً: React.js"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">دسته‌بندی</Label>
            <Input
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="مثلاً: برنامه‌نویسی"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proficiency_level">سطح مهارت</Label>
            <Select
              value={formData.proficiency_level}
              onValueChange={(value: any) => setFormData({ ...formData, proficiency_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">مبتدی</SelectItem>
                <SelectItem value="intermediate">متوسط</SelectItem>
                <SelectItem value="advanced">پیشرفته</SelectItem>
                <SelectItem value="expert">متخصص</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="years_of_experience">سال‌های تجربه</Label>
            <Input
              id="years_of_experience"
              type="number"
              value={formData.years_of_experience || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                years_of_experience: parseInt(e.target.value) || undefined 
              })}
              placeholder="5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificate_url">لینک گواهینامه</Label>
            <Input
              id="certificate_url"
              value={formData.certificate_url || ''}
              onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
              placeholder="آدرس URL گواهینامه"
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