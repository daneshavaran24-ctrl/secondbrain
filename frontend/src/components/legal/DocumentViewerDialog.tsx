import React, { useState, useEffect } from 'react';
import { Eye, Download, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useToast } from '@/hooks/use-toast';
import { LegalDocument } from '@/services/legalService';
import { generateSignedUrl } from '@/utils/signedUrlHelper';

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: LegalDocument | null;
}

export function DocumentViewerDialog({ 
  open, 
  onOpenChange, 
  document 
}: DocumentViewerDialogProps) {
  const { toast } = useToast();
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && document?.storageBucket && document?.storagePath) {
      loadFileUrl();
    } else {
      setFileUrl(null);
    }
  }, [open, document]);

  const loadFileUrl = async () => {
    if (!document?.storageBucket || !document?.storagePath) return;
    
    setLoading(true);
    try {
      const url = await generateSignedUrl(
        document.storageBucket, 
        document.storagePath,
        3600 // 1 hour
      );
      setFileUrl(url);
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در بارگذاری فایل",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!fileUrl || !document) return;
    
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "موفقیت",
        description: "فایل دانلود شد",
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در دانلود فایل",
        variant: "destructive",
      });
    }
  };

  const renderFileViewer = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-muted-foreground">در حال بارگذاری...</p>
          </div>
        </div>
      );
    }

    if (!fileUrl || !document) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">فایل در دسترس نیست</p>
            <p className="text-sm text-muted-foreground mt-1">
              برای مشاهده اسناد، لطفاً وارد حساب کاربری خود شوید
            </p>
          </div>
        </div>
      );
    }

    const mimeType = document.mimeType?.toLowerCase() || '';
    
    // PDF files
    if (mimeType.includes('pdf')) {
      return (
        <div className="h-96">
          <embed
            src={fileUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className="border rounded"
          />
        </div>
      );
    }
    
    // Image files
    if (mimeType.includes('image')) {
      return (
        <div className="flex justify-center">
          <img 
            src={fileUrl} 
            alt={document.name}
            className="max-w-full max-h-96 object-contain border rounded"
          />
        </div>
      );
    }
    
    // Other file types - show download option
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">{document.name}</p>
          <p className="text-muted-foreground mb-4">
            این نوع فایل قابل نمایش نیست. می‌توانید آن را دانلود کنید.
          </p>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            دانلود فایل
          </Button>
        </div>
      </div>
    );
  };

  if (!document) return null;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={document.name}
      description={`نوع: ${getDocumentTypeLabel(document.type)} | حجم: ${formatFileSize(document.size)}`}
      className="max-w-4xl"
    >
      <div className="space-y-4">
        {renderFileViewer()}
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            تاریخ آپلود: {new Date(document.uploadDate).toLocaleDateString('fa-IR')}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} disabled={!fileUrl}>
              <Download className="h-4 w-4 mr-2" />
              دانلود
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              بستن
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
}

function getDocumentTypeLabel(type: string): string {
  const labels = {
    contract: 'قرارداد',
    petition: 'دادخواست', 
    judgment: 'رأی',
    evidence: 'مدرک',
    correspondence: 'مکاتبات'
  };
  return labels[type as keyof typeof labels] || type;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'نامشخص';
  
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
