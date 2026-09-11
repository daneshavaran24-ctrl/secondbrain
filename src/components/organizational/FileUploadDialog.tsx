import React, { useState, useCallback } from 'react';
import { Upload, File, X, Loader2, Download, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { organizationalPolicyService } from '@/services/organizationalPolicyService';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type PolicyAttachment = Database['public']['Tables']['organizational_policy_attachments']['Row'];

interface FileUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: 'mission' | 'policy' | 'kpi' | 'approval';
  itemId: string;
  itemTitle: string;
}

export function FileUploadDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemTitle
}: FileUploadDialogProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [attachments, setAttachments] = useState<PolicyAttachment[]>([]);
  const [loading, setLoading] = useState(false);

  // Load attachments when dialog opens
  React.useEffect(() => {
    if (open) {
      loadAttachments();
    }
  }, [open, itemId, itemType]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('organizational_policy_attachments')
        .select('*')
        .eq('policy_id', itemId);
      
      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error loading attachments:', error);
      toast.error('خطا در بارگذاری فایل‌ها');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, [itemType, itemId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    try {
      for (const file of files) {
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`فایل ${file.name} بیش از ۱۰ مگابایت است`);
          continue;
        }

        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'image/jpeg',
          'image/png',
          'image/jpg'
        ];

        if (!allowedTypes.includes(file.type)) {
          toast.error(`نوع فایل ${file.name} پشتیبانی نمی‌شود`);
          continue;
        }

        await organizationalPolicyService.uploadAttachment(file, itemType, itemId);
        toast.success(`فایل ${file.name} با موفقیت آپلود شد`);
      }

      // Reload attachments
      await loadAttachments();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  const downloadAttachment = async (attachment: PolicyAttachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('فایل دانلود شد');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('خطا در دانلود فایل');
    }
  };

  const deleteAttachment = async (attachmentId: string) => {
    if (!confirm('آیا از حذف این فایل اطمینان دارید؟')) return;

    try {
      // Find the attachment to get its file path
      const attachment = attachments.find(a => a.id === attachmentId);
      if (!attachment) {
        toast.error('فایل یافت نشد');
        return;
      }

      await organizationalPolicyService.deleteAttachment(attachmentId, attachment.file_path);
      await loadAttachments();
      toast.success('فایل حذف شد');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('خطا در حذف فایل');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📊';
    if (mimeType?.includes('image')) return '🖼️';
    return '📁';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right">مدیریت فایل‌ها</DialogTitle>
          <DialogDescription className="text-right">
            فایل‌های مربوط به: {itemTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? 'border-primary bg-primary/10'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            {uploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">در حال آپلود...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <Upload className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">فایل‌ها را اینجا بکشید</p>
                  <p className="text-sm text-muted-foreground">
                    یا کلیک کنید تا فایل انتخاب کنید
                  </p>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    انتخاب فایل
                  </label>
                </Button>
                <p className="text-xs text-muted-foreground">
                  فرمت‌های مجاز: PDF, Word, Excel, تصاویر (حداکثر ۱۰ مگابایت)
                </p>
              </div>
            )}
          </div>

          {/* Attachments List */}
          <div className="space-y-4">
            <h4 className="font-medium text-right">فایل‌های موجود</h4>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : attachments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  هیچ فایلی آپلود نشده است
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <Card key={attachment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 space-x-reverse flex-1">
                          <div className="text-2xl">
                            {getFileIcon(attachment.mime_type || '')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate text-right">
                              {attachment.file_name}
                            </h5>
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <Badge variant="outline" className="text-xs">
                                {formatFileSize(attachment.file_size || 0)}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(attachment.created_at).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadAttachment(attachment)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteAttachment(attachment.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}