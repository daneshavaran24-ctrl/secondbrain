import React, { useState, useRef } from 'react';
import { Mic, MicOff, Save, FileText, Volume2, Trash2, AlertCircle, Square, Star, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { legalService } from '@/services/legalService';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { MicrophonePermissionGuide } from '@/components/ui/microphone-permission-guide';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealtimeSpeechRecognition } from '@/hooks/useRealtimeSpeechRecognition';
import { RealtimeTranscript } from '@/components/journal/RealtimeTranscript';

interface LawyerNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseId: string;
  caseTitle: string;
  onNoteSaved: (note: any) => void;
  mode?: 'create' | 'edit';
  existingNote?: any;
}

export function LawyerNotesDialog({
  open,
  onOpenChange,
  caseId,
  caseTitle,
  onNoteSaved,
  mode = 'create',
  existingNote
}: LawyerNotesDialogProps) {
  const { toast } = useToast();
  const [useRealtimeMode, setUseRealtimeMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [noteText, setNoteText] = useState(existingNote?.content || '');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingNote?.audioUrl || null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // New fields
  const [noteTitle, setNoteTitle] = useState(existingNote?.title || '');
  const [category, setCategory] = useState(existingNote?.category || 'general');
  const [isStarred, setIsStarred] = useState(existingNote?.isStarred || false);
  const [reminderDate, setReminderDate] = useState(existingNote?.reminderDate || '');
  const [status, setStatus] = useState(existingNote?.status || 'pending');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const [permissionState, permissionActions] = useMicrophonePermission();

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSpeechRecognitionSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useRealtimeSpeechRecognition({
    language: 'fa-IR',
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setNoteText(prev => prev ? prev + ' ' + text : text);
      }
    }
  });

  const startRecording = async () => {
    try {
      const stream = await permissionActions.requestPermission();
      
      if (!stream) return;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Convert to speech-to-text
        await convertSpeechToText(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "ضبط شروع شد",
        description: "صحبت کنید..."
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      const errorType = permissionActions.handleMicrophoneError(error);
      const errorMsg = permissionActions.getErrorMessage(errorType);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      toast({
        title: "ضبط متوقف شد",
        description: "در حال پردازش صوت..."
      });
    }
  };

  const convertSpeechToText = async (blob: Blob) => {
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const { data, error } = await supabase.functions.invoke('speech-to-text', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        const newText = noteText ? noteText + '\n\n' + data.text : data.text;
        setNoteText(newText);
        
        toast({
          title: "تبدیل موفق",
          description: "متن از صدا استخراج شد"
        });
      }
    } catch (error) {
      console.error('Error converting speech to text:', error);
      toast({
        title: "خطا",
        description: "خطا در تبدیل صدا به متن",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        toast({
          title: "خطا",
          description: "خطا در پخش صدا",
          variant: "destructive"
        });
      });
    }
  };

  const deleteAudio = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    toast({
      title: "حذف شد",
      description: "فایل صوتی حذف شد"
    });
  };

  const handleRealtimeStart = async () => {
    try {
      await permissionActions.requestPermission();
      resetTranscript();
      startListening();
    } catch (error) {
      console.error('Failed to start real-time recording:', error);
    }
  };

  const handleRealtimeStop = () => {
    stopListening();
  };

  const saveNote = async () => {
    const finalText = useRealtimeMode && transcript ? noteText + ' ' + transcript : noteText;
    
    if (!finalText.trim() && !audioBlob) {
      toast({
        title: "خطا",
        description: "لطفاً متن یا فایل صوتی اضافه کنید",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      if (mode === 'edit' && existingNote) {
        // Update existing note
        const updatedNote = await legalService.updateLawyerNote(existingNote.id, {
          content: finalText.trim(),
          title: noteTitle,
          category: category as any,
          isStarred,
          reminderDate: reminderDate || undefined,
          status: status as any,
          hasAudio: !!audioBlob || !!audioUrl,
          audioUrl: audioUrl || existingNote.audioUrl
        });
        
        onNoteSaved(updatedNote);
      } else {
        // Create new note
        const noteData = {
          id: Date.now().toString(),
          caseId,
          content: finalText.trim(),
          title: noteTitle,
          category: category as any,
          isStarred,
          reminderDate: reminderDate || undefined,
          status: status as any,
          hasAudio: !!audioBlob,
          audioUrl: audioUrl || null,
          createdAt: new Date().toISOString(),
          type: 'lawyer_notes' as const
        };

        onNoteSaved(noteData);
      }
      
      // Reset form
      setNoteText('');
      setNoteTitle('');
      setCategory('general');
      setIsStarred(false);
      setReminderDate('');
      setStatus('pending');
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      resetTranscript();
      
      onOpenChange(false);
      
      toast({
        title: "ذخیره شد",
        description: mode === 'edit' ? "یادداشت به‌روزرسانی شد" : "یادداشت با موفقیت ذخیره شد"
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "خطا",
        description: "خطا در ذخیره یادداشت",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    if (isListening) {
      stopListening();
    }
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleClose}
      title="یادداشت برای وکیل"
      description={`نکات مهم برای جلسه بعدی - ${caseTitle}`}
      className="max-w-2xl"
    >
      <div className="space-y-6">
        <MicrophonePermissionGuide
          isOpen={permissionActions.showPermissionGuide}
          onClose={() => permissionActions.setShowPermissionGuide(false)}
        />

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

        {/* Mode Toggle */}
        <div className="flex items-center justify-center gap-2 p-2 bg-muted/30 rounded-lg">
          <Button
            variant={useRealtimeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setUseRealtimeMode(true)}
            disabled={!isSpeechRecognitionSupported}
          >
            Real-Time
          </Button>
          <Button
            variant={!useRealtimeMode ? "default" : "outline"}
            size="sm"
            onClick={() => setUseRealtimeMode(false)}
          >
            ضبط و تبدیل
          </Button>
          {!isSpeechRecognitionSupported && (
            <Badge variant="destructive" className="text-xs">
              فقط Chrome/Edge
            </Badge>
          )}
        </div>

        {useRealtimeMode && isSpeechRecognitionSupported ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4" />
                ضبط صوتی Real-Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                {!isListening ? (
                  <Button
                    variant="default"
                    onClick={handleRealtimeStart}
                    disabled={isProcessing}
                    className="flex items-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    شروع گفتن
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={handleRealtimeStop}
                    className="flex items-center gap-2"
                  >
                    <Square className="h-4 w-4" />
                    توقف
                  </Button>
                )}
                
                {isListening && (
                  <Badge variant="default" className="animate-pulse">
                    🔴 در حال شنیدن...
                  </Badge>
                )}
              </div>

              {(transcript || interimTranscript) && (
                <RealtimeTranscript
                  transcript={transcript}
                  interimTranscript={interimTranscript}
                  isListening={isListening}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mic className="h-4 w-4" />
                ضبط صوتی
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant={isRecording ? "destructive" : "default"}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  {isRecording ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      توقف ضبط
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      شروع ضبط
                    </>
                  )}
                </Button>
                
                {isRecording && (
                  <Badge variant="destructive" className="animate-pulse">
                    در حال ضبط...
                  </Badge>
                )}
                
                {isProcessing && (
                  <Badge variant="secondary">
                    در حال پردازش...
                  </Badge>
                )}
              </div>

              {audioUrl && (
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={playAudio}
                    className="h-8 w-8 p-0"
                  >
                    <Volume2 className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground flex-1">
                    فایل صوتی ضبط شده
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={deleteAudio}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Text Notes Section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              یادداشت متنی
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="نکات مهم برای جلسه بعدی با وکیل را اینجا بنویسید..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {noteText.length} کاراکتر
            </p>
          </CardContent>
        </Card>

        {/* New fields */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">جزئیات یادداشت</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">عنوان (اختیاری)</Label>
              <Input
                id="note-title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="عنوان کوتاه برای یادداشت..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="note-category">دسته‌بندی</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="note-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عمومی</SelectItem>
                    <SelectItem value="meeting-prep">آماده‌سازی جلسه</SelectItem>
                    <SelectItem value="follow-up">پیگیری</SelectItem>
                    <SelectItem value="important">مهم</SelectItem>
                    <SelectItem value="reminder">یادآوری</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note-status">وضعیت</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="note-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="completed">انجام شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-reminder">تاریخ یادآوری (اختیاری)</Label>
              <Input
                id="note-reminder"
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isStarred ? "default" : "outline"}
                size="sm"
                onClick={() => setIsStarred(!isStarred)}
                className="flex items-center gap-2"
              >
                <Star className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`} />
                {isStarred ? 'ستاره‌دار' : 'ستاره‌دار کردن'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button 
          variant="outline" 
          onClick={handleClose}
          disabled={isSaving}
        >
          انصراف
        </Button>
        <Button 
          onClick={saveNote}
          disabled={isSaving || (!noteText.trim() && !transcript.trim() && !audioBlob)}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'در حال ذخیره...' : 'ذخیره یادداشت'}
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
