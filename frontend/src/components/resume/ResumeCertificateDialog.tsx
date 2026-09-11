import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResumeFileUploader } from './ResumeFileUploader';
import { createCertificate, updateCertificate, Certificate } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResumeCertificateDialogProps {
  open: boolean;
  onClose: () => void;
  certificate?: Certificate;
}

export function ResumeCertificateDialog({ open, onClose, certificate }: ResumeCertificateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    issuing_organization: '',
    issue_date: '',
    expiry_date: '',
    description: '',
    certificate_url: '',
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState('');

  useEffect(() => {
    if (certificate) {
      setFormData({
        title: certificate.title || '',
        issuing_organization: certificate.issuing_organization || '',
        issue_date: certificate.issue_date || '',
        expiry_date: certificate.expiry_date || '',
        description: certificate.description || '',
        certificate_url: certificate.certificate_url || '',
        skills: certificate.skills || [],
      });
    } else {
      setFormData({
        title: '',
        issuing_organization: '',
        issue_date: '',
        expiry_date: '',
        description: '',
        certificate_url: '',
        skills: [],
      });
    }
  }, [certificate, open]);

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (certificate?.id) {
        await updateCertificate(certificate.id, formData);
        toast({ title: 'گواهینامه با موفقیت به‌روزرسانی شد' });
      } else {
        await createCertificate({ ...formData, user_id: getActiveUserId() });
        toast({ title: 'گواهینامه با موفقیت ایجاد شد' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving certificate:', error);
      toast({
        title: 'خطا در ذخیره گواهینامه',
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
            {certificate ? 'ویرایش گواهینامه' : 'افزودن گواهینامه جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>عنوان گواهینامه *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label>موسسه صادرکننده *</Label>
            <Input
              value={formData.issuing_organization}
              onChange={(e) => setFormData({ ...formData, issuing_organization: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>تاریخ صدور *</Label>
              <Input
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>تاریخ انقضا</Label>
              <Input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
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
            <Label>مهارت‌های مرتبط</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="نام مهارت"
              />
              <Button type="button" onClick={handleAddSkill}>
                افزودن
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                  <X
                    className="w-3 h-3 mr-1 cursor-pointer"
                    onClick={() => handleRemoveSkill(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>آپلود گواهینامه</Label>
            <ResumeFileUploader
              userId={getActiveUserId()}
                category="certificates"
                onUploadComplete={(url) => setFormData({ ...formData, certificate_url: url })}
                accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg'] }}
              />
            {formData.certificate_url && (
              <p className="text-sm text-muted-foreground mt-2">
                فایل آپلود شده: ✓
              </p>
            )}
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
