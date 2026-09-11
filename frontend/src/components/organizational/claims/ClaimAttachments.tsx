import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Paperclip, Upload, File, Image, Trash2, Download, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ClaimAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface ClaimAttachmentsProps {
  claimId: string;
  attachments: ClaimAttachment[];
  onAttachmentsUpdate: (attachments: ClaimAttachment[]) => void;
  readonly?: boolean;
}

export function ClaimAttachments({ 
  claimId, 
  attachments, 
  onAttachmentsUpdate, 
  readonly = false 
}: ClaimAttachmentsProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <File className="h-4 w-4" />;
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${claimId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(fileName);

      // Create attachment record (if you have such a table)
      const newAttachment: ClaimAttachment = {
        id: Math.random().toString(36).substring(7),
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        created_at: new Date().toISOString()
      };

      // Update attachments
      const updatedAttachments = [...attachments, newAttachment];
      onAttachmentsUpdate(updatedAttachments);

      toast({
        title: "فایل بارگذاری شد",
        description: `${file.name} با موفقیت بارگذاری شد.`,
      });

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "خطا در بارگذاری فایل",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteAttachment = async (attachment: ClaimAttachment) => {
    try {
      // Extract file path from URL
      const urlParts = attachment.file_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `${claimId}/${fileName}`;

      // Delete from storage
      const { error } = await supabase.storage
        .from('attachments')
        .remove([filePath]);

      if (error) throw error;

      // Update attachments
      const updatedAttachments = attachments.filter(att => att.id !== attachment.id);
      onAttachmentsUpdate(updatedAttachments);

      toast({
        title: "فایل حذف شد",
        description: `${attachment.file_name} حذف شد.`,
      });

    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "خطا در حذف فایل",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  const handleViewFile = (attachment: ClaimAttachment) => {
    window.open(attachment.file_url, '_blank');
  };

  const handleDownloadFile = async (attachment: ClaimAttachment) => {
    try {
      const response = await fetch(attachment.file_url);
      const blob = await response.blob();
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = attachment.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "خطا در دانلود فایل",
        description: "لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="h-5 w-5" />
          فایل‌های ضمیمه
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {!readonly && (
          <div className="space-y-4">
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
              onClick={handleFileSelect}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                فایل‌های خود را اینجا بکشید یا کلیک کنید
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                حداکثر اندازه فایل: 10MB
              </p>
            </div>

            <Button variant="outline" onClick={handleFileSelect} disabled={uploading}>
              <Upload className="h-4 w-4 ml-2" />
              انتخاب فایل
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">در حال بارگذاری...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}
          </div>
        )}

        {/* Attachments List */}
        {attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(attachment.mime_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {formatFileSize(attachment.file_size)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(attachment.created_at).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewFile(attachment)}
                    title="مشاهده"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadFile(attachment)}
                    title="دانلود"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  {!readonly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteAttachment(attachment)}
                      title="حذف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Paperclip className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">هیچ فایل ضمیمه‌ای وجود ندارد</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}