import { useState, useRef, useEffect } from "react";
import { ModernButton } from "@/components/ui/modern-button";
import { Mic, Square, Trash2, FileText, AlertCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useMicrophonePermission } from "@/hooks/useMicrophonePermission";
import { MicrophonePermissionGuide } from "@/components/ui/microphone-permission-guide";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRealtimeSpeechRecognition } from "@/hooks/useRealtimeSpeechRecognition";
import { RealtimeTranscript } from "./RealtimeTranscript";
import { Badge } from "@/components/ui/badge";

interface VoiceRecorderProps {
  onTextReceived: (text: string) => void;
  onCancel: () => void;
}

export const VoiceRecorder = ({ onTextReceived, onCancel }: VoiceRecorderProps) => {
  const [useRealtimeMode, setUseRealtimeMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await permissionActions.requestPermission();
      
      if (!stream) {
        return;
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "ضبط شروع شد",
        description: "شروع به صحبت کنید",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      const errorType = permissionActions.handleMicrophoneError(error);
      const errorMsg = permissionActions.getErrorMessage(errorType);
      
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    chunksRef.current = [];
  };

  const convertToText = async () => {
    if (!audioBlob) return;

    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(',')[1];

        if (!base64Audio) {
          throw new Error('خطا در خواندن فایل صوتی');
        }

        const { data, error } = await supabase.functions.invoke('speech-to-text', {
          body: { audio: base64Audio }
        });

        if (error) {
          throw error;
        }

        if (data?.text) {
          onTextReceived(data.text);
          toast({
            title: "تبدیل موفق",
            description: "متن با موفقیت اضافه شد",
          });
        } else {
          throw new Error('متنی دریافت نشد');
        }
      };

      reader.onerror = () => {
        throw new Error('خطا در خواندن فایل');
      };
    } catch (error) {
      console.error('Error converting speech to text:', error);
      toast({
        title: "خطا در تبدیل",
        description: error instanceof Error ? error.message : "خطا در تبدیل صدا به متن",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRealtimeStart = async () => {
    try {
      await permissionActions.requestPermission();
      resetTranscript();
      startListening();
      setRecordingTime(0);
      
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start real-time recording:', error);
    }
  };

  const handleRealtimeStop = () => {
    stopListening();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleRealtimeSave = () => {
    if (transcript.trim()) {
      onTextReceived(transcript);
      toast({
        title: "ذخیره موفق",
        description: "متن با موفقیت ذخیره شد",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <MicrophonePermissionGuide
        isOpen={permissionActions.showPermissionGuide}
        onClose={() => permissionActions.setShowPermissionGuide(false)}
      />

      {permissionState.error && !permissionActions.showPermissionGuide && (
        <Alert variant="destructive" className="border-destructive/50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{permissionActions.getErrorMessage(permissionState.error).description}</span>
            <ModernButton
              onClick={() => permissionActions.setShowPermissionGuide(true)}
              variant="outline"
              size="sm"
              className="mr-2"
            >
              راهنما
            </ModernButton>
          </AlertDescription>
        </Alert>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 rounded-lg">
        <ModernButton
          variant={useRealtimeMode ? "default" : "outline"}
          size="sm"
          onClick={() => setUseRealtimeMode(true)}
          disabled={!isSpeechRecognitionSupported}
        >
          Real-Time
        </ModernButton>
        <ModernButton
          variant={!useRealtimeMode ? "default" : "outline"}
          size="sm"
          onClick={() => setUseRealtimeMode(false)}
        >
          ضبط و تبدیل
        </ModernButton>
        {!isSpeechRecognitionSupported && (
          <Badge variant="destructive" className="text-xs">
            فقط Chrome/Edge
          </Badge>
        )}
      </div>

      {useRealtimeMode && isSpeechRecognitionSupported ? (
        <>
          {/* Real-Time Mode */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 relative">
              {isListening && (
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
              )}
              <Mic className={`h-12 w-12 ${isListening ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="text-3xl font-bold text-foreground mb-2">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {isListening ? '🔴 در حال شنیدن...' : 'برای شروع، دکمه شروع را فشار دهید'}
            </p>
            
            {!isListening && (
              <p className="text-xs text-muted-foreground mt-1">
                متن همزمان با صحبت نمایش داده می‌شود
              </p>
            )}
          </div>

          {(transcript || interimTranscript) && (
            <RealtimeTranscript
              transcript={transcript}
              interimTranscript={interimTranscript}
              isListening={isListening}
            />
          )}

          <div className="flex flex-col gap-3">
            {!isListening ? (
              <ModernButton
                onClick={handleRealtimeStart}
                icon={<Mic className="h-5 w-5" />}
                className="w-full"
                glow
              >
                شروع
              </ModernButton>
            ) : (
              <ModernButton
                onClick={handleRealtimeStop}
                variant="destructive"
                icon={<Square className="h-5 w-5" />}
                className="w-full"
              >
                توقف
              </ModernButton>
            )}

            {transcript && !isListening && (
              <>
                <ModernButton
                  onClick={handleRealtimeSave}
                  icon={<FileText className="h-5 w-5" />}
                  className="w-full"
                  glow
                >
                  ذخیره متن
                </ModernButton>
                <div className="flex gap-2">
                  <ModernButton
                    onClick={resetTranscript}
                    variant="outline"
                    icon={<Trash2 className="h-4 w-4" />}
                    className="flex-1"
                  >
                    حذف
                  </ModernButton>
                  <ModernButton
                    onClick={onCancel}
                    variant="outline"
                    icon={<X className="h-4 w-4" />}
                    className="flex-1"
                  >
                    انصراف
                  </ModernButton>
                </div>
              </>
            )}

            {!transcript && !isListening && (
              <ModernButton
                onClick={onCancel}
                variant="outline"
                className="w-full"
              >
                انصراف
              </ModernButton>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Traditional Mode */}
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 relative">
              {isRecording && (
                <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse" />
              )}
              <Mic className={`h-12 w-12 ${isRecording ? 'text-primary animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            
            <div className="text-3xl font-bold text-foreground mb-2">
              {formatTime(recordingTime)}
            </div>
            
            <p className="text-sm text-muted-foreground">
              {isRecording ? 'در حال ضبط...' : audioBlob ? 'آماده برای تبدیل' : 'روی دکمه میکروفن کلیک کنید'}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {!audioBlob && !isRecording && (
              <ModernButton
                onClick={startRecording}
                icon={<Mic className="h-5 w-5" />}
                className="w-full"
                glow
              >
                شروع ضبط
              </ModernButton>
            )}

            {isRecording && (
              <ModernButton
                onClick={stopRecording}
                variant="destructive"
                icon={<Square className="h-5 w-5" />}
                className="w-full"
              >
                توقف ضبط
              </ModernButton>
            )}

            {audioBlob && !isRecording && (
              <>
                <ModernButton
                  onClick={convertToText}
                  disabled={isProcessing}
                  icon={<FileText className="h-5 w-5" />}
                  className="w-full"
                  glow
                >
                  {isProcessing ? 'در حال پردازش...' : 'تبدیل به متن'}
                </ModernButton>

                <div className="flex gap-2">
                  <ModernButton
                    onClick={discardRecording}
                    variant="outline"
                    icon={<Trash2 className="h-4 w-4" />}
                    className="flex-1"
                  >
                    حذف و شروع مجدد
                  </ModernButton>
                  
                  <ModernButton
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    انصراف
                  </ModernButton>
                </div>
              </>
            )}

            {!audioBlob && !isRecording && (
              <ModernButton
                onClick={onCancel}
                variant="outline"
                className="w-full"
              >
                انصراف
              </ModernButton>
            )}
          </div>
        </>
      )}

      <div className="text-xs text-muted-foreground text-center space-y-1 pt-4 border-t border-border/30">
        <p>• برای بهترین نتیجه، در محیط ساکت صحبت کنید</p>
        <p>• ضبط صوت به صورت خودکار به زبان فارسی تبدیل می‌شود</p>
      </div>
    </div>
  );
};
