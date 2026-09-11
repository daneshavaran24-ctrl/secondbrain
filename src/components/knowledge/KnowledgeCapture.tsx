import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Link, Image, Mic, Video, Brain, Folder, AlertCircle } from 'lucide-react';
import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';
import { KnowledgeItem } from '@/types';
import { motion } from 'framer-motion';
import { FolderTree } from './FolderTree';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { MicrophonePermissionGuide } from '@/components/ui/microphone-permission-guide';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

interface KnowledgeCaptureProps {
  onKnowledgeAdded?: (item: KnowledgeItem) => void;
}

export const KnowledgeCapture: React.FC<KnowledgeCaptureProps> = ({ onKnowledgeAdded }) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [captureType, setCaptureType] = useState<'text' | 'link' | 'file' | 'voice'>('text');
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>();
  const [showFolderSelector, setShowFolderSelector] = useState(false);

  const [permissionState, permissionActions] = useMicrophonePermission();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: async (files) => {
      const file = files[0];
      if (file) {
        await handleFileUpload(file);
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf'],
      'text/*': ['.txt', '.md'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.webm']
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const item = await supabaseKnowledgeService.storeKnowledge(content, 'text', {
        title: title || undefined,
        folder_id: selectedFolderId,
      });
      
      onKnowledgeAdded?.(item);
      setContent('');
      setTitle('');
      
    } catch (error) {
      console.error('Failed to store knowledge:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    const content = `فایل: ${file.name}\nنوع: ${file.type}\nاندازه: ${(file.size / 1024 / 1024).toFixed(2)} مگابایت`;
    
    try {
      const item = await supabaseKnowledgeService.storeKnowledge(content, 'pdf', {
        title: file.name,
        folder_id: selectedFolderId,
      });
      
      onKnowledgeAdded?.(item);
      
    } catch (error) {
      console.error('Failed to store file:', error);
    }
  };

  const handleVoiceRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await permissionActions.requestPermission();
        
        if (!stream) return;
        
        setIsRecording(true);
        
        // Note: This is a simplified version. For real-time speech-to-text,
        // you would integrate useRealtimeSpeechRecognition hook similar to VoiceRecorder
        setTimeout(() => {
          stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          setContent('یادداشت صوتی ضبط شده: ' + new Date().toLocaleString('fa-IR'));
        }, 3000);
        
      } catch (error) {
        console.error('Failed to start recording:', error);
        const errorType = permissionActions.handleMicrophoneError(error);
        const errorMsg = permissionActions.getErrorMessage(errorType);
        toast({
          title: errorMsg.title,
          description: errorMsg.description,
          variant: 'destructive',
        });
      }
    } else {
      setIsRecording(false);
    }
  };

  const captureTypes = [
    { id: 'text', label: 'متن', icon: FileText },
    { id: 'link', label: 'لینک', icon: Link },
    { id: 'file', label: 'فایل', icon: Upload },
    { id: 'voice', label: 'صوت', icon: Mic }
  ] as const;

  return (
    <Card className="p-10 border-4 border-primary/20 shadow-2xl rounded-3xl bg-gradient-to-br from-background to-muted/10">
      <CardHeader className="pb-12">
        <CardTitle className="text-4xl font-bold text-primary flex items-center gap-4 mb-8">
          <Brain className="h-12 w-12" />
          ذخیره دانش جدید
        </CardTitle>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {captureTypes.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={captureType === id ? "default" : "outline"}
              size="lg"
              onClick={() => setCaptureType(id)}
              className={`h-24 flex-col gap-4 text-xl font-bold border-3 rounded-2xl shadow-lg transition-all duration-300 ${
                captureType === id 
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xl scale-105 transform' 
                  : 'bg-background border-border hover:border-primary hover:shadow-xl hover:scale-102 transform'
              }`}
            >
              <Icon className="h-10 w-10" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-0">
        {/* Permission Guide */}
        {captureType === 'voice' && (
          <>
            <MicrophonePermissionGuide
              isOpen={permissionActions.showPermissionGuide}
              onClose={() => permissionActions.setShowPermissionGuide(false)}
            />

            {/* Permission Status Alert */}
            {permissionState.error && !permissionActions.showPermissionGuide && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{permissionActions.getErrorMessage(permissionState.error).description}</span>
                  <Button
                    onClick={() => permissionActions.setShowPermissionGuide(true)}
                    variant="outline"
                    size="sm"
                    className="mr-2"
                  >
                    راهنما
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {/* Folder Selector - Common for all capture types */}
        <Collapsible open={showFolderSelector} onOpenChange={setShowFolderSelector}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-start gap-2" type="button">
              <Folder className="h-4 w-4" />
              {selectedFolderId ? 'تغییر فولدر' : 'انتخاب فولدر (اختیاری)'}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <div className="border border-border rounded-lg p-3 bg-muted/20 max-h-64 overflow-y-auto">
              <FolderTree
                selectedFolderId={selectedFolderId}
                onFolderSelect={setSelectedFolderId}
                compact
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        {captureType === 'text' && (
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-3">
              <label className="text-readable font-semibold text-foreground">عنوان (اختیاری)</label>
              <Input
                placeholder="عنوان یادداشت را وارد کنید..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-readable"
              />
            </div>
            
            <div className="space-y-3">
              <label className="text-readable font-semibold text-foreground">محتوا</label>
              <Textarea
                placeholder="محتوای دانش خود را با جزئیات وارد کنید..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                className="input-readable min-h-[160px] resize-none"
              />
            </div>
            
            <Button type="submit" disabled={!content.trim()} className="btn-large-touch w-full">
              <span className="text-button-large">ذخیره دانش</span>
            </Button>
          </motion.form>
        )}

        {captureType === 'link' && (
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-3">
              <label className="text-readable font-semibold text-foreground">آدرس لینک</label>
              <Input
                placeholder="https://example.com"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input-readable"
              />
            </div>
            
            <Button 
              onClick={handleSubmit} 
              disabled={!content.trim()}
              className="btn-large-touch w-full"
            >
              <span className="text-button-large">ذخیره لینک</span>
            </Button>
          </motion.div>
        )}

        {captureType === 'file' && (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-xl p-12 text-center cursor-pointer transition-elegant ${
              isDragActive ? 'border-primary bg-primary/5 shadow-glow' : 'border-muted-foreground/25 hover:border-primary/30'
            }`}
          >
            <input {...getInputProps()} />
            
            <Upload className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
            
            {isDragActive ? (
              <p className="text-primary text-large-readable">فایل را اینجا رها کنید...</p>
            ) : (
              <div>
                <p className="text-foreground mb-4 text-large-readable">فایل را اینجا بکشید یا کلیک کنید</p>
                <p className="text-readable text-muted-foreground">
                  پشتیبانی از تصاویر، PDF، متن، صوت و ویدئو
                </p>
              </div>
            )}
          </div>
        )}

        {captureType === 'voice' && (
          <motion.div 
            className="space-y-4 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleVoiceRecording}
              variant={isRecording ? "destructive" : "default"}
              size="lg"
              className="w-full"
            >
              {isRecording ? (
                <>
                  <div className="animate-pulse h-4 w-4 bg-red-500 rounded-full ml-2" />
                  در حال ضبط... (کلیک برای توقف)
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 ml-2" />
                  شروع ضبط صوت
                </>
              )}
            </Button>

            {content && (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="متن تبدیل شده از صوت..."
                rows={4}
                className="bg-background/50"
              />
            )}

            {content && (
              <Button onClick={handleSubmit}>
                ذخیره یادداشت صوتی
              </Button>
            )}
          </motion.div>
        )}

        <div className="mt-8 p-6 bg-muted/20 rounded-xl border border-border/30">
          <h4 className="text-readable font-semibold mb-4 text-foreground">ویژگی‌های سیستم:</h4>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm px-3 py-1">PARA Method</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">طبقه‌بندی خودکار</Badge>
            <Badge variant="outline" className="text-sm px-3 py-1">جستجوی هوشمند</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};