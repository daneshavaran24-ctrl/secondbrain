import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { LegalCase, LegalDocument } from '@/services/legalService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LegalDocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentUploaded: (document: LegalDocument) => void;
  availableCases: Array<{ id: string; title: string; }>;
  preSelectedCaseId?: string | null;
}

export function LegalDocumentUploadDialog({ 
  open, 
  onOpenChange, 
  onDocumentUploaded,
  availableCases,
  preSelectedCaseId
}: LegalDocumentUploadDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    caseId: '',
    name: '',
    type: 'contract' as const,
    tags: '',
    isShared: false,
    file: null as File | null
  });
  const [tagList, setTagList] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  // Pre-select case if provided
  React.useEffect(() => {
    if (preSelectedCaseId) {
      setFormData(prev => ({ ...prev, caseId: preSelectedCaseId }));
    }
  }, [preSelectedCaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.caseId || !formData.file) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدهای ضروری را پر کنید",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    
    try {
      let storageBucket: string | undefined;
      let storagePath: string | undefined;
      let mimeType: string | undefined;
      let size: number | undefined;

      // Upload file to Supabase Storage if user is authenticated
      if (formData.file && user) {
        const fileExt = formData.file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/legal-documents/${formData.caseId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, formData.file);

        if (uploadError) {
          throw new Error('خطا در آپلود فایل: ' + uploadError.message);
        }

        storageBucket = 'documents';
        storagePath = filePath;
        mimeType = formData.file.type;
        size = formData.file.size;
      } else if (formData.file && !user) {
        toast({
          title: "توجه",
          description: "برای ذخیره فایل، لطفاً وارد حساب کاربری خود شوید",
          variant: "destructive",
        });
        setUploading(false);
        return;
      }

      // Create document object
      const newDocument: LegalDocument = {
        id: Date.now().toString(),
        caseId: formData.caseId,
        name: formData.name,
        type: formData.type,
        uploadDate: new Date().toISOString(),
        tags: tagList,
        isShared: formData.isShared,
        userId: user?.id || 'default',
        storageBucket,
        storagePath,
        mimeType,
        size
      };

      onDocumentUploaded(newDocument);
      
      toast({
        title: "موفقیت",
        description: "سند با موفقیت آپلود شد",
      });

      // Reset form
      setFormData({
        caseId: '',
        name: '',
        type: 'contract',
        tags: '',
        isShared: false,
        file: null
      });
      setTagList([]);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در آپلود سند",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddTag = () => {
    if (formData.tags.trim() && !tagList.includes(formData.tags.trim())) {
      setTagList([...tagList, formData.tags.trim()]);
      setFormData(prev => ({ ...prev, tags: '' }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTagList(tagList.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, file }));
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="آپلود سند حقوقی"
      description="سند جدید را به پرونده اضافه کنید"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="case-select">پرونده مرتبط *</Label>
          <Select
            value={formData.caseId}
            onValueChange={(value) => setFormData(prev => ({ ...prev, caseId: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="پرونده را انتخاب کنید" />
            </SelectTrigger>
            <SelectContent>
              {availableCases.map((case_) => (
                <SelectItem key={case_.id} value={case_.id}>
                  {case_.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="document-name">نام سند *</Label>
          <Input
            id="document-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="نام سند را وارد کنید"
          />
        </div>

        <div>
          <Label htmlFor="document-type">نوع سند</Label>
          <Select
            value={formData.type}
            onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">قرارداد</SelectItem>
              <SelectItem value="petition">دادخواست</SelectItem>
              <SelectItem value="judgment">رأی</SelectItem>
              <SelectItem value="evidence">مدرک</SelectItem>
              <SelectItem value="correspondence">مکاتبات</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="file-upload">فایل سند *</Label>
          <Input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
          {formData.file && (
            <p className="text-sm text-muted-foreground mt-1">
              {formData.file.name} ({Math.round(formData.file.size / 1024)} KB)
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="tags">برچسب‌ها</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="برچسب جدید"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button type="button" variant="outline" onClick={handleAddTag}>
              افزودن
            </Button>
          </div>
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tagList.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                  <X 
                    className="h-3 w-3 mr-1 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is-shared"
            checked={formData.isShared}
            onChange={(e) => setFormData(prev => ({ ...prev, isShared: e.target.checked }))}
            className="rounded border-gray-300"
          />
          <Label htmlFor="is-shared">به اشتراک گذاری با سازمان</Label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                در حال آپلود...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                آپلود سند
              </>
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}