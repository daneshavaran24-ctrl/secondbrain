import React, { useState, useCallback, useRef } from 'react';
import { Upload, Video, Image, FileText, Music, X, Eye, Download, Play } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import type { Meeting } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedFileUploaderProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  preview?: string;
  type: 'video' | 'audio' | 'image' | 'document';
}

export const EnhancedFileUploader: React.FC<EnhancedFileUploaderProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getFileType = (file: File): UploadFile['type'] => {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    return 'document';
  };

  const getFileIcon = (type: UploadFile['type']) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5 text-blue-500" />;
      case 'audio': return <Music className="w-5 h-5 text-green-500" />;
      case 'image': return <Image className="w-5 h-5 text-purple-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Check file size limit (50MB per file)
    const maxSize = 50 * 1024 * 1024;
    const oversizedFiles = fileArray.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      toast({
        title: 'خطا',
        description: `فایل‌های زیر بیش از 50 مگابایت هستند: ${oversizedFiles.map(f => f.name).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Supported formats
    const supportedTypes = [
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/mkv',
      'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/webm', 'audio/ogg',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const unsupportedFiles = fileArray.filter(file => !supportedTypes.includes(file.type));
    
    if (unsupportedFiles.length > 0) {
      toast({
        title: 'فرمت پشتیبانی نشده',
        description: `فرمت این فایل‌ها پشتیبانی نمی‌شود: ${unsupportedFiles.map(f => f.name).join(', ')}`,
        variant: 'destructive'
      });
      return;
    }

    // Create upload files
    const newUploadFiles: UploadFile[] = [];
    
    for (const file of fileArray) {
      const preview = await createPreview(file);
      
      newUploadFiles.push({
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'uploading',
        preview,
        type: getFileType(file)
      });
    }

    setUploadFiles(prev => [...prev, ...newUploadFiles]);

    // Start uploads
    for (const uploadFile of newUploadFiles) {
      uploadFileToMeeting(uploadFile);
    }
  };

  const uploadFileToMeeting = async (uploadFile: UploadFile) => {
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadFiles(prev => prev.map(f => 
          f.id === uploadFile.id 
            ? { ...f, progress: Math.min(f.progress + Math.random() * 20, 95) }
            : f
        ));
      }, 300);

      // Process different file types
      let result;
      if (uploadFile.type === 'audio' || uploadFile.type === 'video') {
        // Audio/Video processing with speech-to-text
        result = await meetingService.processAudioTranscript(meeting.id, uploadFile.file);
      } else {
        // Regular file upload
        result = await meetingService.addAttachment(meeting.id, uploadFile.file);
      }

      clearInterval(progressInterval);
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, progress: 100, status: 'completed' }
          : f
      ));

      toast({
        title: 'موفقیت',
        description: `فایل "${uploadFile.file.name}" با موفقیت آپلود شد`
      });

    } catch (error) {
      console.error('Upload failed:', error);
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error' }
          : f
      ));

      toast({
        title: 'خطا',
        description: `خطا در آپلود فایل "${uploadFile.file.name}"`,
        variant: 'destructive'
      });
    }
  };

  const removeFile = (id: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFiles(files);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const openPreview = (uploadFile: UploadFile) => {
    setPreviewFile(uploadFile);
  };

  const closePreview = () => {
    setPreviewFile(null);
  };

  const completedUploads = uploadFiles.filter(f => f.status === 'completed');
  const isUploading = uploadFiles.some(f => f.status === 'uploading');

  return (
    <>
      <ResponsiveDialog
        open={isOpen}
        onOpenChange={onClose}
        title="آپلود فایل‌های پیشرفته"
        description="پشتیبانی از ویدئو، صوت، تصاویر و اسناد با پردازش خودکار"
      >
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${isDragging 
                ? 'border-primary bg-primary/10' 
                : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5'
              }
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <h3 className="text-lg font-semibold mb-2">
              {isDragging ? 'فایل‌ها را اینجا رها کنید' : 'فایل‌هایتان را اینجا بکشید'}
            </h3>
            <p className="text-muted-foreground text-sm">
              یا کلیک کنید تا فایل انتخاب کنید
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-blue-500" />
                ویدئو: MP4, WebM, AVI, MOV
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-green-500" />
                صوت: MP3, WAV, M4A, WebM
              </div>
              <div className="flex items-center gap-2">
                <Image className="w-4 h-4 text-purple-500" />
                تصویر: JPG, PNG, GIF, WebP
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                اسناد: PDF, DOC, XLS, TXT
              </div>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept="video/*,audio/*,image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />

          {/* Upload Progress */}
          {uploadFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">فایل‌های در حال آپلود</h4>
              <AnimatePresence>
                {uploadFiles.map((uploadFile) => (
                  <motion.div
                    key={uploadFile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className={`$
                      {uploadFile.status === 'completed' ? 'border-green-200 bg-green-50/50' :
                      uploadFile.status === 'error' ? 'border-red-200 bg-red-50/50' :
                      'border-blue-200 bg-blue-50/50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {/* File Icon & Preview */}
                          <div className="flex-shrink-0">
                            {uploadFile.preview ? (
                              <div className="relative w-12 h-12 rounded-md overflow-hidden bg-muted">
                                {uploadFile.type === 'video' ? (
                                  <video 
                                    src={uploadFile.preview} 
                                    className="w-full h-full object-cover"
                                    muted
                                  />
                                ) : (
                                  <img 
                                    src={uploadFile.preview} 
                                    alt="" 
                                    className="w-full h-full object-cover" 
                                  />
                                )}
                                {uploadFile.status === 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity"
                                    onClick={() => openPreview(uploadFile)}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                                {getFileIcon(uploadFile.type)}
                              </div>
                            )}
                          </div>

                          {/* File Info */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-sm truncate">
                              {uploadFile.file.name}
                            </h5>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {uploadFile.type}
                              </Badge>
                              <span>{getFileSize(uploadFile.file.size)}</span>
                            </div>
                            
                            {/* Progress Bar */}
                            {uploadFile.status === 'uploading' && (
                              <div className="mt-2">
                                <Progress value={uploadFile.progress} className="h-1" />
                                <span className="text-xs text-muted-foreground">
                                  {Math.round(uploadFile.progress)}%
                                </span>
                              </div>
                            )}
                            
                            {uploadFile.status === 'completed' && (
                              <span className="text-xs text-green-600 font-medium">
                                ✓ آپلود کامل
                              </span>
                            )}
                            
                            {uploadFile.status === 'error' && (
                              <span className="text-xs text-red-600 font-medium">
                                ✗ خطا در آپلود
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {uploadFile.status === 'completed' && uploadFile.preview && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => openPreview(uploadFile)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFile(uploadFile.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Existing Attachments */}
          {meeting.attachments && meeting.attachments.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">فایل‌های ضمیمه موجود</h4>
              <div className="grid gap-2">
                {meeting.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-2 bg-secondary/20 rounded"
                  >
                    <span className="text-sm">{attachment.file_name}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => meetingService.removeAttachment(meeting.id, attachment.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              بستن
            </Button>
            {completedUploads.length > 0 && (
              <Button 
                onClick={() => {
                  onUpdate();
                  onClose();
                  toast({
                    title: 'موفقیت',
                    description: `${completedUploads.length} فایل با موفقیت اضافه شد`
                  });
                }}
                disabled={isUploading}
              >
                {isUploading ? 'در حال آپلود...' : 'تایید و بستن'}
              </Button>
            )}
          </div>
        </div>
      </ResponsiveDialog>

      {/* File Preview Modal */}
      {previewFile && (
        <ResponsiveDialog
          open={!!previewFile}
          onOpenChange={closePreview}
          title={previewFile.file.name}
          description={`${previewFile.type} • ${getFileSize(previewFile.file.size)}`}
          className="max-w-4xl"
        >
          <div className="flex items-center justify-center bg-black/5 rounded-lg min-h-[300px]">
            {previewFile.type === 'video' && previewFile.preview && (
              <video
                src={previewFile.preview}
                controls
                className="max-w-full max-h-[60vh] rounded"
              >
                مرورگر شما از پخش ویدئو پشتیبانی نمی‌کند.
              </video>
            )}
            {previewFile.type === 'image' && previewFile.preview && (
              <img
                src={previewFile.preview}
                alt=""
                className="max-w-full max-h-[60vh] rounded object-contain"
              />
            )}
            {(previewFile.type === 'document' || previewFile.type === 'audio') && (
              <div className="text-center text-muted-foreground">
                {getFileIcon(previewFile.type)}
                <p className="mt-2">پیش‌نمایش برای این نوع فایل در دسترس نیست</p>
                {previewFile.type === 'audio' && previewFile.preview && (
                  <audio controls className="mt-4">
                    <source src={previewFile.preview} />
                    مرورگر شما از پخش صوت پشتیبانی نمی‌کند.
                  </audio>
                )}
              </div>
            )}
          </div>
        </ResponsiveDialog>
      )}
    </>
  );
};

export default EnhancedFileUploader;
