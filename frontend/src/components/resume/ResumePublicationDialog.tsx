import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getActiveUserId } from '@/config/mockUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResumeFileUploader } from './ResumeFileUploader';
import { createPublication, updatePublication, Publication } from '@/services/resumeService';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ResumePublicationDialogProps {
  open: boolean;
  onClose: () => void;
  publication?: Publication;
}

const PUBLICATION_TYPES = ['کتاب', 'مقاله', 'گزارش', 'پایان‌نامه', 'مجله'];

export function ResumePublicationDialog({ open, onClose, publication }: ResumePublicationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    publication_type: '',
    publisher: '',
    publication_date: '',
    isbn: '',
    description: '',
    cover_image_url: '',
    pdf_url: '',
    external_link: '',
    co_authors: [] as string[],
  });
  const [authorInput, setAuthorInput] = useState('');

  useEffect(() => {
    if (publication) {
      setFormData({
        title: publication.title || '',
        publication_type: publication.publication_type || '',
        publisher: publication.publisher || '',
        publication_date: publication.publication_date || '',
        isbn: publication.isbn || '',
        description: publication.description || '',
        cover_image_url: publication.cover_image_url || '',
        pdf_url: publication.pdf_url || '',
        external_link: publication.external_link || '',
        co_authors: publication.co_authors || [],
      });
    } else {
      setFormData({
        title: '',
        publication_type: '',
        publisher: '',
        publication_date: '',
        isbn: '',
        description: '',
        cover_image_url: '',
        pdf_url: '',
        external_link: '',
        co_authors: [],
      });
    }
  }, [publication, open]);

  const handleAddAuthor = () => {
    if (authorInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        co_authors: [...prev.co_authors, authorInput.trim()],
      }));
      setAuthorInput('');
    }
  };

  const handleRemoveAuthor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      co_authors: prev.co_authors.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      if (publication?.id) {
        await updatePublication(publication.id, formData);
        toast({ title: 'تالیف با موفقیت به‌روزرسانی شد' });
      } else {
        await createPublication({ ...formData, user_id: getActiveUserId() });
        toast({ title: 'تالیف با موفقیت ایجاد شد' });
      }
      onClose();
    } catch (error) {
      console.error('Error saving publication:', error);
      toast({
        title: 'خطا در ذخیره تالیف',
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
            {publication ? 'ویرایش تالیف' : 'افزودن تالیف جدید'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>عنوان *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>نوع انتشار</Label>
              <Select
                value={formData.publication_type}
                onValueChange={(value) => setFormData({ ...formData, publication_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب نوع" />
                </SelectTrigger>
                <SelectContent>
                  {PUBLICATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاریخ انتشار *</Label>
              <Input
                type="date"
                value={formData.publication_date}
                onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ناشر</Label>
              <Input
                value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
              />
            </div>
            <div>
              <Label>شابک (ISBN)</Label>
              <Input
                value={formData.isbn}
                onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
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
            <Label>نویسندگان مشترک</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAuthor())}
                placeholder="نام نویسنده"
              />
              <Button type="button" onClick={handleAddAuthor}>
                افزودن
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.co_authors.map((author, index) => (
                <Badge key={index} variant="secondary">
                  {author}
                  <X
                    className="w-3 h-3 mr-1 cursor-pointer"
                    onClick={() => handleRemoveAuthor(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>لینک خارجی (دانلود/خرید)</Label>
            <Input
              value={formData.external_link}
              onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <>
            <div>
              <Label>آپلود تصویر جلد</Label>
              <ResumeFileUploader
                userId={getActiveUserId()}
                  category="publications"
                  onUploadComplete={(url) => setFormData({ ...formData, cover_image_url: url })}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                />
            </div>

            <div>
              <Label>آپلود PDF</Label>
              <ResumeFileUploader
                userId={getActiveUserId()}
                category="publications"
                onUploadComplete={(url) => setFormData({ ...formData, pdf_url: url })}
                accept={{ 'application/pdf': ['.pdf'] }}
              />
            </div>
          </>

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
