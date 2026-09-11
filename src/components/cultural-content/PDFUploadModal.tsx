import React, { useState, useCallback } from 'react';
import { Upload, Link, FileText, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PDFUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (data: { pdfFile?: string; pdfUrl?: string; title: string }) => void;
}

export const PDFUploadModal: React.FC<PDFUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  const [title, setTitle] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFile(file);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
    } else {
      toast({
        title: "خطا",
        description: "لطفاً فقط فایل PDF انتخاب کنید.",
        variant: "destructive"
      });
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const handleUpload = async () => {
    if (!title.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً عنوان را وارد کنید.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === 'upload' && !uploadedFile) {
      toast({
        title: "خطا",
        description: "لطفاً فایل PDF را انتخاب کنید.",
        variant: "destructive"
      });
      return;
    }

    if (activeTab === 'link' && !pdfUrl.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً لینک PDF را وارد کنید.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      if (activeTab === 'upload' && uploadedFile) {
        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "خطا",
            description: "لطفاً وارد حساب کاربری شوید",
            variant: "destructive"
          });
          setIsUploading(false);
          return;
        }

        // Upload file to Supabase storage with correct path pattern
        const fileExt = 'pdf';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, uploadedFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        onUpload({
          title: title.trim(),
          pdfFile: publicUrl
        });

        toast({
          title: "موفق",
          description: "فایل PDF با موفقیت آپلود شد.",
        });
      } else if (activeTab === 'link') {
        onUpload({
          title: title.trim(),
          pdfUrl: pdfUrl.trim()
        });

        toast({
          title: "موفق",
          description: "لینک PDF با موفقیت اضافه شد.",
        });
      }

      // Reset form
      setTitle('');
      setPdfUrl('');
      setUploadedFile(null);
      onClose();
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast({
        title: "خطا",
        description: "خطا در آپلود فایل PDF. لطفاً دوباره تلاش کنید.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setPdfUrl('');
    setUploadedFile(null);
    setActiveTab('upload');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-right pr-8">افزودن PDF</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">عنوان</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان کتاب یا مقاله..."
              className="text-right"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upload' | 'link')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                آپلود فایل
              </TabsTrigger>
              <TabsTrigger value="link" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                لینک PDF
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50",
                  uploadedFile && "border-green-500 bg-green-50"
                )}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                  {uploadedFile ? (
                    <>
                      <FileText className="h-12 w-12 text-green-600" />
                      <div className="text-sm font-medium text-green-600">
                        {uploadedFile.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-muted-foreground" />
                      <div className="text-sm font-medium">
                        {isDragActive
                          ? "فایل PDF را اینجا رها کنید"
                          : "فایل PDF را اینجا بکشید یا کلیک کنید"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        حداکثر حجم: 10MB
                      </div>
                    </>
                  )}
                </div>
              </div>

              {uploadedFile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadedFile(null)}
                  className="w-full"
                >
                  <X className="h-4 w-4 ml-2" />
                  حذف فایل
                </Button>
              )}
            </TabsContent>

            <TabsContent value="link" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pdfUrl">لینک PDF</Label>
                <Input
                  id="pdfUrl"
                  type="url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://example.com/document.pdf"
                  className="text-left"
                  dir="ltr"
                />
                <div className="text-xs text-muted-foreground">
                  لینک مستقیم به فایل PDF را وارد کنید
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              انصراف
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || !title.trim()}
              className="flex-1"
            >
              {isUploading ? "در حال آپلود..." : "افزودن"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};