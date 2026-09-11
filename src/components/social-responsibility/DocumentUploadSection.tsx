import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Download } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { socialResponsibilityService, CSRDocument } from "@/services/socialResponsibilityService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DocumentUploadSectionProps {
  projectId: string;
  documents: CSRDocument[];
  onDocumentsChange: () => void;
}

export function DocumentUploadSection({
  projectId,
  documents,
  onDocumentsChange,
}: DocumentUploadSectionProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (acceptedFiles) => {
      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        const result = await socialResponsibilityService.uploadDocument(
          projectId,
          file
        );

        if (result) {
          toast.success(`${file.name} آپلود شد`);
        } else {
          toast.error(`خطا در آپلود ${file.name}`);
        }

        setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
      }

      setUploading(false);
      setUploadProgress(0);
      onDocumentsChange();
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleDelete = async (docId: string) => {
    const success = await socialResponsibilityService.deleteDocument(docId);
    if (success) {
      toast.success("فایل حذف شد");
      onDocumentsChange();
    } else {
      toast.error("خطا در حذف فایل");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} />
        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
        {isDragActive ? (
          <p className="text-primary font-medium">فایل‌ها را اینجا رها کنید...</p>
        ) : (
          <div>
            <p className="font-medium mb-1">
              فایل‌ها را بکشید و اینجا رها کنید
            </p>
            <p className="text-sm text-muted-foreground">
              یا کلیک کنید تا فایل انتخاب کنید
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              حداکثر 10 مگابایت
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>در حال آپلود...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} />
        </div>
      )}

      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">فایل‌های آپلود شده:</h4>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
            >
              <File className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                {doc.file_size && (
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </p>
                )}
              </div>
              {doc.category && (
                <Badge variant="outline" className="text-xs">
                  {doc.category}
                </Badge>
              )}
              <div className="flex gap-1">
                <ModernButton
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open(doc.file_url, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </ModernButton>
                <ModernButton
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(doc.id)}
                >
                  <X className="h-4 w-4" />
                </ModernButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
