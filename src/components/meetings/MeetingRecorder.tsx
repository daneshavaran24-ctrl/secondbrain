import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Mic, MicOff, Video, VideoOff, Square, Play, Users, AlertCircle } from 'lucide-react';
import { meetingService } from '@/services/meetingService';
import { Meeting, MeetingLocation } from '@/types';
import { motion } from 'framer-motion';
import { useOrganizations } from '@/services/organizationService';
import { MeetingUploadButton } from '@/components/meetings/MeetingUploadButton';
import { toast } from 'sonner';
import { LocationPicker } from './LocationPicker';
import { useMicrophonePermission } from '@/hooks/useMicrophonePermission';
import { MicrophonePermissionGuide } from '@/components/ui/microphone-permission-guide';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface MeetingRecorderProps {
  onMeetingCreated?: (meeting: Meeting) => void;
}

export const MeetingRecorder: React.FC<MeetingRecorderProps> = ({ onMeetingCreated }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState<Meeting | null>(null);
  const [meetingTitle, setMeetingTitle] = useState('');
  const [organization, setOrganization] = useState<Meeting['organization']>('Varid');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true); // Default to true
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [participantCount, setParticipantCount] = useState(1);
  const [isProcessingTranscript, setIsProcessingTranscript] = useState(false);
  const [location, setLocation] = useState<MeetingLocation | undefined>(undefined);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const { organizations } = useOrganizations();
  const faceDetectorRef = useRef<any>(null);

  const [permissionState, permissionActions] = useMicrophonePermission();

  // Function to setup video stream with face detection
  const setupVideoStream = async (stream: MediaStream) => {
    if (videoRef.current && videoEnabled) {
      videoRef.current.srcObject = stream;
      setVideoError(null);
      
      try {
        await videoRef.current.play();
        console.log('Video preview started successfully');
        
        // Initialize face detection if available
        if ('FaceDetector' in window) {
          try {
            faceDetectorRef.current = new (window as any).FaceDetector();
            startFaceDetection();
          } catch (error) {
            console.warn('Face detection not available:', error);
          }
        }
      } catch (error) {
        console.error('Failed to play video:', error);
        setVideoError('خطا در نمایش تصویر');
      }
    }
  };

  // Face detection function
  const startFaceDetection = () => {
    if (!faceDetectorRef.current || !videoRef.current) return;

    const detectFaces = async () => {
      try {
        const faces = await faceDetectorRef.current.detect(videoRef.current);
        setParticipantCount(Math.max(1, faces.length));
      } catch (error) {
        console.warn('Face detection error:', error);
      }
    };

    // Run face detection every 2 seconds during recording
    if (isRecording) {
      const interval = setInterval(detectFaces, 2000);
      return () => clearInterval(interval);
    }
  };

  const startRecording = async () => {
    console.log('Starting recording process...');
    
    // Auto-generate title if empty
    const finalTitle = meetingTitle.trim() || `جلسه ${new Date().toLocaleDateString('fa-IR')}`;
    
    // Check if at least one media is enabled
    if (!audioEnabled && !videoEnabled) {
      toast.error('حداقل یکی از گزینه‌های صوت یا تصویر را فعال کنید');
      return;
    }

    // Check for HTTPS requirement
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      toast.error('ضبط رسانه فقط در HTTPS یا localhost امکان‌پذیر است');
      return;
    }

    // Check for media devices support
    if (!navigator.mediaDevices) {
      toast.error('مرورگر شما از ضبط رسانه پشتیبانی نمی‌کند');
      return;
    }

    if (!navigator.mediaDevices.getUserMedia) {
      toast.error('تابع getUserMedia در دسترس نیست');
      return;
    }

    try {
      console.log('Requesting permissions for recording...');
      
      // Check available devices first
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.log('Available devices:', devices);
      
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      
      if (audioEnabled && !hasAudio) {
        toast.error('هیچ میکروفونی یافت نشد');
        return;
      }
      
      if (videoEnabled && !hasVideo) {
        toast.error('هیچ دوربینی یافت نشد');
        return;
      }

      // Get media stream with better error handling
      const constraints = {
        audio: audioEnabled ? {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } : false,
        video: videoEnabled ? { 
          width: { ideal: 1280, max: 1920 }, 
          height: { ideal: 720, max: 1080 },
          facingMode: 'user',
          frameRate: { ideal: 30, max: 60 }
        } : false
      };

      console.log('Requesting media with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      // Setup video preview
      if (videoEnabled) {
        await setupVideoStream(stream);
      }

      // Setup MediaRecorder with correct MIME types based on enabled media
      let mimeType = '';
      
      if (videoEnabled && audioEnabled) {
        // Both video and audio
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
          mimeType = 'video/webm;codecs=vp9,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
          mimeType = 'video/webm;codecs=vp8,opus';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      } else if (videoEnabled && !audioEnabled) {
        // Video only
        if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
          mimeType = 'video/webm;codecs=vp9';
        } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
          mimeType = 'video/webm;codecs=vp8';
        } else if (MediaRecorder.isTypeSupported('video/webm')) {
          mimeType = 'video/webm';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        }
      } else if (!videoEnabled && audioEnabled) {
        // Audio only
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        }
      }
      
      if (!mimeType) {
        throw new Error('هیچ فرمت رسانه‌ای پشتیبانی نمی‌شود');
      }
      
      console.log('Selected MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000);

      const meeting = await meetingService.createMeeting(finalTitle, organization, location);
      setCurrentMeeting(meeting);
      setMeetingTitle(finalTitle); // Update the displayed title
      
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      toast.success('ضبط جلسه شروع شد');
      onMeetingCreated?.(meeting);
      
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      // Better error messages based on specific error types
      if (error.name === 'NotAllowedError') {
        toast.error('دسترسی به دوربین/میکروفون رد شد. لطفاً در تنظیمات مرورگر دسترسی را اجازه دهید');
      } else if (error.name === 'NotFoundError') {
        toast.error('دوربین یا میکروفون یافت نشد. لطفاً اتصال دستگاه‌ها را بررسی کنید');
      } else if (error.name === 'NotReadableError') {
        toast.error('خطا در دسترسی به دوربین/میکروفون. احتمالاً توسط برنامه دیگری استفاده می‌شود');
      } else if (error.name === 'OverconstrainedError') {
        toast.error('تنظیمات درخواستی توسط دستگاه پشتیبانی نمی‌شود');
      } else if (error.name === 'SecurityError') {
        toast.error('خطای امنیتی - لطفاً از HTTPS استفاده کنید');
      } else {
        toast.error(`خطا در شروع ضبط: ${error.message || 'خطای ناشناخته'}`);
      }
      setVideoError('خطا در دسترسی به دوربین');
    }
  };

  const stopRecording = async () => {
    if (!currentMeeting) return;

    try {
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      // Wait for final data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create blob from recorded chunks
      let recordingBlob: Blob | null = null;
      if (recordedChunksRef.current.length > 0) {
        recordingBlob = new Blob(recordedChunksRef.current, { 
          type: mediaRecorderRef.current?.mimeType || 'video/webm' 
        });
      }

      // Stop all tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Clear video preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // Save recording to meeting
      if (recordingBlob) {
        const recordingUrl = URL.createObjectURL(recordingBlob);
        const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
        await meetingService.updateMeetingMedia(currentMeeting.id, recordingUrl, mimeType);
        
        // Process audio transcript
        setIsProcessingTranscript(true);
        try {
          await meetingService.processAudioTranscript(currentMeeting.id, recordingBlob);
          toast.success('پردازش صوت با موفقیت انجام شد');
        } catch (error) {
          console.error('Transcript processing failed:', error);
          toast.error('خطا در پردازش صوت');
        } finally {
          setIsProcessingTranscript(false);
        }
      }

      await meetingService.stopRecording(currentMeeting.id);
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      // Reset form
      setMeetingTitle('');
      setCurrentMeeting(null);
      setRecordingTime(0);
      setVideoError(null);
      setParticipantCount(1);
      
      toast.success('ضبط جلسه متوقف شد');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('خطا در توقف ضبط جلسه');
    }
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle video toggle during recording
  const handleVideoToggle = async () => {
    if (!isRecording) {
      setVideoEnabled(!videoEnabled);
      return;
    }

    // During recording, control the video tracks
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      const newVideoState = !videoEnabled;
      
      videoTracks.forEach(track => {
        track.enabled = newVideoState;
      });
      
      setVideoEnabled(newVideoState);
      
      if (videoRef.current) {
        if (newVideoState) {
          videoRef.current.style.display = 'block';
          try {
            await videoRef.current.play();
          } catch (error) {
            console.error('Failed to resume video:', error);
          }
        } else {
          videoRef.current.style.display = 'none';
        }
      }
    } else {
      setVideoEnabled(!videoEnabled);
    }
  };

  // Handle audio toggle during recording
  const handleAudioToggle = () => {
    if (!isRecording) {
      setAudioEnabled(!audioEnabled);
      return;
    }

    // During recording, control the audio tracks
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      const newAudioState = !audioEnabled;
      
      audioTracks.forEach(track => {
        track.enabled = newAudioState;
      });
      
      setAudioEnabled(newAudioState);
    } else {
      setAudioEnabled(!audioEnabled);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <Card className="bg-glass border-elegant" dir="rtl">
      <CardHeader>
        <CardTitle className="text-foreground flex items-center gap-2">
          <Video className="h-5 w-5" />
          ضبط جلسه هوشمند
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Permission Guide */}
        {audioEnabled && (
          <>
            <MicrophonePermissionGuide
              isOpen={permissionActions.showPermissionGuide}
              onClose={() => permissionActions.setShowPermissionGuide(false)}
            />

            {permissionState.error && !permissionActions.showPermissionGuide && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {permissionActions.getErrorMessage(permissionState.error).description}
                </AlertDescription>
              </Alert>
            )}
          </>
        )}

        {!isRecording ? (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <label className="text-sm font-medium mb-2 block">عنوان جلسه</label>
              <Input
                placeholder="عنوان جلسه را وارد کنید..."
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                className="bg-background/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">سازمان</label>
              <Select value={organization} onValueChange={(value: Meeting['organization']) => setOrganization(value)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.value} value={org.value}>
                      <span className="flex items-center gap-2">
                        <span>{org.icon}</span>
                        {org.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <LocationPicker
                value={location}
                onChange={setLocation}
                placeholder="آدرس محل برگزاری جلسه"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleAudioToggle}
                className="flex items-center gap-2"
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                صوت
              </Button>

              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleVideoToggle}
                className="flex items-center gap-2"
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                تصویر
              </Button>
            </div>

            <Button 
              onClick={startRecording}
              disabled={isRecording}
              className="w-full flex items-center justify-center gap-2"
              size="lg"
            >
              <Play className="h-4 w-4" />
              شروع ضبط جلسه
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="space-y-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-center">
              {videoEnabled && !videoError ? (
                <video 
                  ref={videoRef}
                  autoPlay 
                  playsInline
                  muted 
                  className="w-full max-w-md rounded-lg border bg-background shadow-lg"
                  style={{ 
                    maxHeight: '300px',
                    minHeight: '200px',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    console.error('Video error:', e);
                    setVideoError('خطا در نمایش تصویر');
                  }}
                  onLoadedMetadata={() => {
                    console.log('Video metadata loaded');
                    setVideoError(null);
                  }}
                />
              ) : (
                <div className="w-full max-w-md h-48 rounded-lg border bg-muted/20 flex items-center justify-center shadow-lg">
                  <div className="text-center text-muted-foreground">
                    <VideoOff className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">
                      {videoError || (!videoEnabled ? 'تصویر خاموش است' : 'در حال بارگذاری تصویر...')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              </div>
              
              <p className="text-sm text-muted-foreground">
                در حال ضبط: {currentMeeting?.title}
              </p>
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {participantCount} نفر شناسایی شده
              </Badge>
              <Badge variant="outline">
                {isProcessingTranscript ? 'در حال پردازش متن...' : 'گفتار به نوشتار'}
              </Badge>
              <Badge variant="outline">استخراج وظایف</Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={audioEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleAudioToggle}
                className="flex items-center justify-center gap-2"
              >
                {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                {audioEnabled ? 'قطع صوت' : 'روشن صوت'}
              </Button>

              <Button
                variant={videoEnabled ? "default" : "outline"}
                size="sm"
                onClick={handleVideoToggle}
                className="flex items-center justify-center gap-2"
              >
                {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                {videoEnabled ? 'قطع تصویر' : 'روشن تصویر'}
              </Button>
            </div>

            <Button 
              onClick={stopRecording}
              variant="destructive"
              className="w-full flex items-center justify-center gap-2"
              size="lg"
              disabled={isProcessingTranscript}
            >
              <Square className="h-4 w-4" />
              {isProcessingTranscript ? 'در حال پردازش...' : 'توقف ضبط و پردازش'}
            </Button>
          </motion.div>
        )}

        {/* Optional upload button after recording */}
        {currentMeeting && !isRecording && (
          <div className="mt-4 flex justify-center">
            <MeetingUploadButton
              meeting={currentMeeting}
              label="ضمیمه کردن فایل"
              variant="button"
            />
          </div>
        )}

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>ویژگی‌های هوشمند:</p>
          <p>• تبدیل گفتار به متن فارسی • شناسایی تعداد شرکت‌کنندگان • استخراج وظایف</p>
          <p>• تولید صورت جلسه چندگانه • پردازش هوشمند محتوا</p>
        </div>
      </CardContent>
    </Card>
  );
};
