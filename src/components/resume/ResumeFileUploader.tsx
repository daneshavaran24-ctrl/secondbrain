import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image as ImageIcon } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { uploadResumeFile } from '@/services/resumeStorageService';
import { toast } from '@/hooks/use-toast';

interface ResumeFileUploaderProps {
  userId: string;
  category: string;
  onUploadComplete: (url: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function ResumeFileUploader({
  userId,
  category,
  onUploadComplete,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'application/pdf': ['.pdf'],
    'video/*': ['.mp4', '.mov'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
}: ResumeFileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);
      setProgress(0);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
      }

      try {
        // Simulate progress
        const interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 10, 90));
        }, 200);

        const url = await uploadResumeFile(userId, file, category);
        
        clearInterval(interval);
        setProgress(100);
        
        toast({
          title: 'آپلود موفق',
          description: 'فایل با موفقیت آپلود شد',
        });

        onUploadComplete(url);
      } catch (error) {
        console.error('Upload error:', error);
        toast({
          title: 'خطا در آپلود',
          description: 'لطفا دوباره تلاش کنید',
          variant: 'destructive',
        });
      } finally {
        setUploading(false);
        setTimeout(() => {
          setProgress(0);
          setPreview(null);
        }, 2000);
      }
    },
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          {isDragActive
            ? 'فایل را اینجا رها کنید'
            : 'فایل را بکشید و اینجا رها کنید یا کلیک کنید'}
        </p>
        <p className="text-xs text-muted-foreground">
          حداکثر حجم: {(maxSize / 1024 / 1024).toFixed(0)} مگابایت
        </p>
      </div>

      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-sm text-center text-muted-foreground">
            در حال آپلود... {progress}%
          </p>
        </div>
      )}

      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-lg"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={() => setPreview(null)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
