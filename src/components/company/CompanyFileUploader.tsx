import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, Trash2, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  CompanyFile,
  uploadCompanyFile,
  deleteCompanyFile,
  downloadCompanyFile,
  formatFileSize,
  getFileIcon
} from '@/services/companyFileService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CompanyFileUploaderProps {
  noteId: string;
  files: CompanyFile[];
  onFilesChange: (files: CompanyFile[]) => void;
  maxSize?: number; // in MB
}

export const CompanyFileUploader: React.FC<CompanyFileUploaderProps> = ({
  noteId,
  files,
  onFilesChange,
  maxSize = 10
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<CompanyFile | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const maxSizeBytes = maxSize * 1024 * 1024;

    // بررسی حجم فایل
    if (file.size > maxSizeBytes) {
      toast.error(`حجم فایل نباید بیشتر از ${maxSize} مگابایت باشد`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // شبیه‌سازی پیشرفت آپلود
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const uploadedFile = await uploadCompanyFile(noteId, file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (uploadedFile) {
        onFilesChange([...files, uploadedFile]);
        toast.success('فایل با موفقیت آپلود شد ✅');
      } else {
        toast.error('خطا در آپلود فایل ❌');
      }
    } catch (error) {
      console.error('خطا در آپلود فایل:', error);
      toast.error('خطا در آپلود فایل ❌');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [noteId, files, onFilesChange, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: maxSize * 1024 * 1024,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.avi', '.mov'],
      'audio/*': ['.mp3', '.wav']
    }
  });

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const success = await deleteCompanyFile(noteId, fileToDelete.id);
      if (success) {
        onFilesChange(files.filter(f => f.id !== fileToDelete.id));
        toast.success('فایل حذف شد 🗑️');
      } else {
        toast.error('خطا در حذف فایل');
      }
    } catch (error) {
      console.error('خطا در حذف فایل:', error);
      toast.error('خطا در حذف فایل');
    } finally {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const handleDownload = async (file: CompanyFile) => {
    try {
      await downloadCompanyFile(file);
      toast.success('دانلود فایل شروع شد');
    } catch (error) {
      console.error('خطا در دانلود فایل:', error);
      toast.error('خطا در دانلود فایل');
    }
  };

  const openDeleteDialog = (file: CompanyFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <File className="h-4 w-4" />
        <span>فایل‌های پیوست</span>
        {files.length > 0 && (
          <span className="text-muted-foreground">({files.length})</span>
        )}
      </div>

      {/* Drag & Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 hover:border-primary/50 hover:bg-accent/5
          ${isDragActive ? 'border-primary bg-accent/10' : 'border-border'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-medium">در حال آپلود...</p>
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadProgress}%
                </p>
              </div>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {isDragActive
                    ? 'فایل را اینجا رها کنید...'
                    : 'فایل را بکشید و اینجا رها کنید'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  یا کلیک کنید تا انتخاب کنید (حداکثر {maxSize} مگابایت)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            فایل‌های آپلود شده:
          </p>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-2xl flex-shrink-0">
                    {getFileIcon(file.file_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {new Date(file.uploaded_at).toLocaleDateString('fa-IR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(file)}
                    className="h-8 w-8"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDeleteDialog(file)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف فایل</AlertDialogTitle>
            <AlertDialogDescription>
              آیا مطمئن هستید که می‌خواهید این فایل را حذف کنید؟ این عملیات قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
