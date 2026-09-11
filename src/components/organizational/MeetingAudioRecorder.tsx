import React, { useState, useRef } from 'react';
import { Mic, Square, Upload, Volume2, Trash2, Play, Pause, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import type { Meeting } from '@/types';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { MicrophonePermissionGuide } from '@/components/ui/microphone-permission-guide';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRealtimeSpeechRecognition } from '@/hooks/useRealtimeSpeechRecognition';
import { RealtimeTranscript } from '@/components/journal/RealtimeTranscript';
import { Badge } from '@/components/ui/badge';

interface MeetingAudioRecorderProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MeetingAudioRecorder: React.FC<MeetingAudioRecorderProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [useRealtimeMode, setUseRealtimeMode] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const { toast } = useToast();
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

  const startRecording = async () => {
    try {
      const stream = await permissionActions.requestPermission();
      
      if (!stream) return;

      const mediaRecorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      const errorType = permissionActions.handleMicrophoneError(error);
      const errorMsg = permissionActions.getErrorMessage(errorType);
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: 'خطا',
        description: 'فقط فایل‌های صوتی پشتیبانی می‌شوند',
        variant: 'destructive'
      });
      return;
    }

    setAudioBlob(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  const handleRealtimeStart = async () => {
    try {
      await permissionActions.requestPermission();
      resetTranscript();
      startListening();
      setRecordingTime(0);
      
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start real-time recording:', error);
    }
  };

  const handleRealtimeStop = () => {
    stopListening();
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const processAudio = async () => {
    if (!audioBlob && !transcript) return;

    setIsProcessing(true);
    try {
      if (audioBlob) {
        await meetingService.processAudioTranscript(meeting.id, audioBlob);
      }
      
      // If we have real-time transcript, update meeting with it
      if (transcript) {
        // TODO: Add method to update meeting transcript directly
        console.log('Real-time transcript:', transcript);
      }
      
      onUpdate();
      toast({
        title: 'موفقیت',
        description: 'صوت با موفقیت پردازش و به متن تبدیل شد'
      });
      onClose();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در پردازش فایل صوتی',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setRecordingTime(0);
    resetTranscript();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="ضبط و پردازش صوت"
      description={`ضبط صوت و تبدیل به متن برای جلسه: ${meeting.title}`}
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
          <>
            {/* Real-Time Mode */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {!isListening ? (
                  <Button
                    onClick={handleRealtimeStart}
                    size="lg"
                    className="h-20 w-20 rounded-full"
                    disabled={isProcessing}
                  >
                    <Mic className="h-8 w-8" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleRealtimeStop}
                    size="lg"
                    variant="destructive"
                    className="h-20 w-20 rounded-full"
                  >
                    <Square className="h-8 w-8" />
                  </Button>
                )}
              </div>
              
              {isListening && (
                <div className="space-y-2">
                  <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
                  <Badge variant="default" className="animate-pulse">
                    🔴 در حال شنیدن...
                  </Badge>
                </div>
              )}
            </div>

            {(transcript || interimTranscript) && (
              <RealtimeTranscript
                transcript={transcript}
                interimTranscript={interimTranscript}
                isListening={isListening}
              />
            )}
          </>
        ) : (
          <>
            {/* Traditional Mode */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="h-20 w-20 rounded-full bg-red-500 hover:bg-red-600"
                    disabled={isProcessing}
                  >
                    <Mic className="h-8 w-8 text-white" />
                  </Button>
                ) : (
                  <Button
                    onClick={stopRecording}
                    size="lg"
                    className="h-20 w-20 rounded-full bg-gray-500 hover:bg-gray-600"
                  >
                    <Square className="h-8 w-8 text-white" />
                  </Button>
                )}
              </div>
              
              {isRecording && (
                <div className="space-y-2">
                  <div className="text-lg font-mono">{formatTime(recordingTime)}</div>
                  <div className="flex justify-center">
                    <div className="flex space-x-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-8 bg-red-500 rounded-full animate-pulse"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">یا فایل صوتی آپلود کنید</div>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isProcessing}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                انتخاب فایل صوتی
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="audio/*"
                onChange={handleFileUpload}
              />
            </div>

            {audioUrl && (
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-4 w-4" />
                    <span className="text-sm font-medium">پیش‌نمایش صوت</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAudio}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={isPlaying ? pauseAudio : playAudio}
                    className="flex items-center gap-2"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {isPlaying ? 'توقف' : 'پخش'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {(audioBlob || transcript) && (
          <Button
            onClick={processAudio}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? 'در حال پردازش...' : 'تبدیل به متن و ذخیره'}
          </Button>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="text-sm text-center">در حال پردازش صوت...</div>
            <Progress value={45} className="w-full" />
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            بستن
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
