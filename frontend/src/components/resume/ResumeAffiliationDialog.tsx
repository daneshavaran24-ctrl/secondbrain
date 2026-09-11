import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeFileUploader } from './ResumeFileUploader';
import { createAffiliation, updateAffiliation, Affiliation } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResumeAffiliationDialogProps {
  open: boolean;
  onClose: () => void;
  affiliation?: Affiliation;
}

const CATEGORIES = ['کتاب', 'حمایت بیماران', 'صنعت', 'ورزش', 'خیریه', 'فرهنگی', 'علمی'];

export function ResumeAffiliationDialog({ open, onClose, affiliation }: ResumeAffiliationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    position: '',
    category: '',
    start_date: '',
    end_date: '',
    description: '',
    responsibilities: [] as string[],
    media_urls: {} as Record<string, string>,
  });
  const [responsibilityInput, setResponsibilityInput] = useState('');

  useEffect(() => {
    if (affiliation) {
      setFormData({
        organization_name: affiliation.organization_name || '',
        position: affiliation.position || '',
        category: affiliation.category || '',
        start_date: affiliation.start_date || '',
        end_date: affiliation.end_date || '',
        description: affiliation.description || '',
        responsibilities: affiliation.responsibilities || [],
        media_urls: affiliation.media_urls || {},
      });
    } else {
      setFormData({
        organization_name: '',
        position: '',
        category: '',
        start_date: '',
        end_date: '',
        description: '',
        responsibilities: [],
        media_urls: {},
      });
    }
  }, [affiliation, open]);

  const handleAddResponsibility = () => {
    if (responsibilityInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        responsibilities: [...prev.responsibilities, responsibilityInput.trim()],
      }));
      setResponsibilityInput('');
    }
  };

  const handleRemoveResponsibility = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (affiliation?.id) {
        await updateAffiliation(affiliation.id, formData);
        toast({ title: 'عضویت با موفقیت به‌روزرسانی شد' });
      } else {
        await createAffiliation({ ...formData, user_id: getActiveUserId() });
        toast({ title: 'عضویت با موفقیت ایجاد شد' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving affiliation:', error);
      toast({
        title: 'خطا در ذخیره عضویت',
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
            {affiliation ? 'ویرایش عضویت' : 'افزودن عضویت جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>نام سازمان *</Label>
            <Input
              value={formData.organization_name}
              onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>سمت/منصب *</Label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                required
                placeholder="مثلاً: ریاست، عضویت، مشاور"
              />
            </div>
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
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تاریخ شروع *</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>تاریخ پایان</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>توضیحات</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div>
            <Label>مسئولیت‌ها</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddResponsibility())}
                placeholder="شرح مسئولیت"
              />
              <Button type="button" onClick={handleAddResponsibility}>
                افزودن
              </Button>
            </div>
            <div className="space-y-2">
              {formData.responsibilities.map((resp, index) => (
                <Badge key={index} variant="secondary" className="text-sm py-2 px-3">
                  {resp}
                  <X
                    className="w-3 h-3 mr-2 cursor-pointer"
                    onClick={() => handleRemoveResponsibility(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>آپلود تصاویر/ویدیوهای رویدادها</Label>
            <ResumeFileUploader
              userId={getActiveUserId()}
                category="affiliations"
                onUploadComplete={(url) => {
                  const key = `media_${Date.now()}`;
                  setFormData({
                    ...formData,
                    media_urls: { ...formData.media_urls, [key]: url },
              });
              }}
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
