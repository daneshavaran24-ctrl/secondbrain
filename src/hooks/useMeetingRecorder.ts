import { useState, useRef, useCallback } from 'react';
import { Meeting } from '@/types';
import { meetingService } from '@/services/meetingService';
import { toast } from 'sonner';

export interface MeetingRecorderState {
  isRecording: boolean;
  currentMeeting: Meeting | null;
  recordingTime: number;
  isProcessing: boolean;
  participantCount: number;
  audioEnabled: boolean;
  videoEnabled: boolean;
}

export const useMeetingRecorder = () => {
  const [state, setState] = useState<MeetingRecorderState>({
    isRecording: false,
    currentMeeting: null,
    recordingTime: 0,
    isProcessing: false,
    participantCount: 1,
    audioEnabled: true,
    videoEnabled: true
  });

  const intervalRef = useRef<NodeJS.Timeout>();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const updateState = useCallback((updates: Partial<MeetingRecorderState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startRecording = useCallback(async (title: string, organization: Meeting['organization']) => {
    try {
      setState(prev => ({ ...prev, isRecording: true, recordingTime: 0 }));
      
      // Create meeting
      const meeting = await meetingService.createMeeting(title, organization);
      setState(prev => ({ ...prev, currentMeeting: meeting }));

      // Start timer
      intervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);

      toast.success('ضبط جلسه شروع شد');
      return meeting;
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('خطا در شروع ضبط جلسه');
      setState(prev => ({ ...prev, isRecording: false }));
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!state.currentMeeting) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true }));

      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Stop media tracks
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Save recording
      await meetingService.stopRecording(state.currentMeeting.id);

      // Reset state
      setState({
        isRecording: false,
        currentMeeting: null,
        recordingTime: 0,
        isProcessing: false,
        participantCount: 1,
        audioEnabled: true,
        videoEnabled: true
      });

      toast.success('ضبط جلسه متوقف شد');
    } catch (error) {
      console.error('Failed to stop recording:', error);
      toast.error('خطا در توقف ضبط جلسه');
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.currentMeeting]);

  const toggleAudio = useCallback(() => {
    setState(prev => ({ ...prev, audioEnabled: !prev.audioEnabled }));
  }, []);

  const toggleVideo = useCallback(() => {
    setState(prev => ({ ...prev, videoEnabled: !prev.videoEnabled }));
  }, []);

  const setParticipantCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, participantCount: count }));
  }, []);

  const formatRecordingTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
  }, []);

  return {
    state,
    actions: {
      startRecording,
      stopRecording,
      toggleAudio,
      toggleVideo,
      setParticipantCount,
      cleanup,
      updateState
    },
    utils: {
      formatRecordingTime
    },
    refs: {
      mediaStreamRef,
      mediaRecorderRef
    }
  };
};

export type MeetingRecorderHook = ReturnType<typeof useMeetingRecorder>;