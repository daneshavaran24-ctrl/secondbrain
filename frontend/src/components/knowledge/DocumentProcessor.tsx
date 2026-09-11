import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, 
  Upload, 
  Eye, 
  Save, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  FileImage,
  ScanLine
} from 'lucide-react';
import { ocrService, OCRResult, DocumentInfo } from '@/services/ocrService';
import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';
import { KnowledgeItem } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DocumentProcessorProps {
  onDocumentProcessed?: (item: KnowledgeItem) => void;
}

export const DocumentProcessor: React.FC<DocumentProcessorProps> = ({
  onDocumentProcessed
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentInfo, setDocumentInfo] = useState<DocumentInfo | null>(null);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editedText, setEditedText] = useState('');
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState<KnowledgeItem['category']>('Resources');
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setProgress(0);
    
    try {
      const info = await ocrService.analyzeDocument(selectedFile);
      setDocumentInfo(info);
      toast({
        title: "فایل آماده پردازش",
        description: `${info.type === 'pdf' ? 'فایل PDF' : 'تصویر'} با ${info.pages} صفحه تشخیص داده شد.`
      });
    } catch (error) {
      toast({
        title: "خطا در تحلیل فایل",
        description: "فرمت فایل پشتیبانی نمی‌شود.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
      'application/pdf': ['.pdf']
    },
    multiple: false
  });

  const processDocument = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);

    try {
      // Initialize OCR worker
      await ocrService.initializeWorker();
      setProgress(30);

      // Process document
      const result = await ocrService.processDocument(file);
      setProgress(80);

      setOcrResult(result);
      setEditedText(result.text);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      setProgress(100);

      toast({
        title: "پردازش کامل شد",
        description: `متن با دقت ${Math.round(result.confidence)}% استخراج شد.`
      });
    } catch (error) {
      toast({
        title: "خطا در پردازش",
        description: "امکان استخراج متن وجود ندارد.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const saveKnowledge = async () => {
    if (!editedText.trim() || !title.trim()) {
      toast({
        title: "اطلاعات ناقص",
        description: "عنوان و متن الزامی است.",
        variant: "destructive"
      });
      return;
    }

    try {
      const knowledgeItem = await supabaseKnowledgeService.storeKnowledge(
        editedText,
        'pdf',
        {
          title,
          category,
          tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
          metadata: {
            originalFileName: file?.name,
            ocrConfidence: ocrResult?.confidence,
            pages: documentInfo?.pages,
            fileSize: documentInfo?.size
          }
        }
      );

      onDocumentProcessed?.(knowledgeItem);
      
      // Reset form
      setFile(null);
      setDocumentInfo(null);
      setOcrResult(null);
      setEditedText('');
      setTitle('');
      setTags('');
      setProgress(0);

      toast({
        title: "ذخیره شد",
        description: "سند در پایگاه دانش ذخیره شد."
      });
    } catch (error) {
      toast({
        title: "خطا در ذخیره",
        description: "امکان ذخیره‌سازی وجود ندارد.",
        variant: "destructive"
      });
    }
  };

  const getFileIcon = () => {
    if (!documentInfo) return <Upload className="w-8 h-8" />;
    return documentInfo.type === 'pdf' ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            پردازش اسناد و تصاویر
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              {getFileIcon()}
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? 'فایل را رها کنید' : 'فایل را بکشید یا کلیک کنید'}
                </p>
                <p className="text-muted-foreground">
                  پشتیبانی از PDF، PNG، JPG، JPEG
                </p>
              </div>
            </div>
          </div>

          {file && documentInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center justify-between p-4 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getFileIcon()}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {documentInfo.pages} صفحه • {Math.round(documentInfo.size / 1024)} KB
                  </p>
                </div>
              </div>
              <Button onClick={processDocument} disabled={processing}>
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    در حال پردازش...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    استخراج متن
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {processing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">پیشرفت پردازش</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* OCR Results */}
      <AnimatePresence>
        {ocrResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    نتیجه استخراج متن
                  </span>
                  <Badge 
                    variant="outline" 
                    className={getConfidenceColor(ocrResult.confidence)}
                  >
                    دقت: {Math.round(ocrResult.confidence)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">عنوان</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="عنوان سند"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">برچسب‌ها</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="برچسب1، برچسب2، ..."
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">دسته‌بندی</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as KnowledgeItem['category'])}
                    className="w-full p-2 border border-input rounded-md bg-background"
                  >
                    <option value="Projects">پروژه</option>
                    <option value="Areas">حوزه</option>
                    <option value="Resources">منبع</option>
                    <option value="Archives">آرشیو</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="extractedText">متن استخراج شده</Label>
                  <Textarea
                    id="extractedText"
                    value={editedText}
                    onChange={(e) => setEditedText(e.target.value)}
                    rows={10}
                    className="mt-2"
                    placeholder="متن استخراج شده..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setFile(null);
                    setDocumentInfo(null);
                    setOcrResult(null);
                    setEditedText('');
                    setTitle('');
                    setTags('');
                  }}>
                    لغو
                  </Button>
                  <Button onClick={saveKnowledge}>
                    <Save className="w-4 h-4 mr-2" />
                    ذخیره در پایگاه دانش
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};