import React, { useState, useRef } from 'react';
import { Upload, File, X, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import { supabase } from '@/integrations/supabase/client';
import { getCachedSignedUrl } from '@/utils/signedUrlHelper';
import type { Meeting, MeetingAttachment } from '@/types';

interface MeetingFileUploaderProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MeetingFileUploader: React.FC<MeetingFileUploaderProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/rtf'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های PDF، Word، و متنی پشتیبانی می‌شوند',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'خطا',
        description: 'حجم فایل نباید بیشتر از ۱۰ مگابایت باشد',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      // Try uploading to Supabase Storage first
      const { data: session } = await supabase.auth.getSession();
      
      if (session.session) {
        try {
          const timestamp = Date.now();
          const fileName = `${timestamp}-${file.name}`;
          const storagePath = `meetings/${meeting.id}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from('attachments')
            .upload(storagePath, file);

          if (uploadError) {
            throw uploadError;
          }

          // Save attachment record with storage path
          await meetingService.addAttachmentRecord(meeting.id, {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            storage_bucket: 'attachments',
            storage_path: storagePath
          });
          
          toast({
            title: 'موفقیت',
            description: 'فایل با موفقیت در فضای ذخیره‌سازی آپلود شد'
          });
        } catch (storageError) {
          console.warn('Supabase storage upload failed, falling back to blob URL:', storageError);
          
          // Fallback to old method (blob URL)
          await meetingService.addAttachment(meeting.id, file);
          
          toast({
            title: 'موفقیت',
            description: 'فایل آپلود شد (ذخیره محلی)'
          });
        }
      } else {
        // No session, use fallback method
        await meetingService.addAttachment(meeting.id, file);
        
        toast({
          title: 'توجه',
          description: 'فایل ذخیره شد اما برای ذخیره پایدار لطفاً وارد شوید'
        });
      }
      
      onUpdate();
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast({
        title: 'خطا',
        description: 'خطا در آپلود فایل',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      await meetingService.removeAttachment(meeting.id, attachmentId);
      onUpdate();
      toast({
        title: 'موفقیت',
        description: 'فایل حذف شد'
      });
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در حذف فایل',
        variant: 'destructive'
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📁';
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="مدیریت فایل‌های جلسه"
      description={`آپلود و مدیریت فایل‌های جلسه: ${meeting.title}`}
    >
      <div className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <div className="mt-2">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <File className="h-4 w-4" />
                انتخاب فایل
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.rtf"
                onChange={handleFileUpload}
              />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              PDF، Word، یا فایل متنی (حداکثر ۱۰ مگابایت)
            </p>
          </div>
        </div>

        {/* Attachments List */}
        {meeting.attachments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">فایل‌های آپلود شده:</h4>
            <div className="space-y-2">
              {meeting.attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(attachment.file_type)}</span>
                    <div>
                      <p className="text-sm font-medium">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file_size)} • {new Date(attachment.uploaded_at).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          let url = attachment.file_url;
                          
                          // If it's stored in Supabase Storage, get signed URL
                          if (attachment.storage_path && attachment.storage_bucket) {
                            const signedUrl = await getCachedSignedUrl(
                              attachment.storage_bucket,
                              attachment.storage_path,
                              3600 // 1 hour
                            );
                            if (signedUrl) {
                              url = signedUrl;
                            }
                          }
                          
                          if (url) {
                            window.open(url, '_blank');
                          } else {
                            throw new Error('فایل در دسترس نیست');
                          }
                        } catch (error) {
                          toast({
                            title: 'خطا',
                            description: 'خطا در باز کردن فایل',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAttachment(attachment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};