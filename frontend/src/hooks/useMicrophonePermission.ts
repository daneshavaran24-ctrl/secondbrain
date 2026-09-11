import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unknown';
export type MicrophoneError = 'NotAllowedError' | 'NotFoundError' | 'NotReadableError' | 'SecurityError' | 'unknown';

interface MicrophonePermissionState {
  permissionStatus: PermissionStatus;
  isChecking: boolean;
  error: MicrophoneError | null;
  hasDevices: boolean;
}

interface MicrophonePermissionActions {
  checkPermission: () => Promise<PermissionStatus>;
  requestPermission: () => Promise<MediaStream | null>;
  showPermissionGuide: boolean;
  setShowPermissionGuide: (show: boolean) => void;
  handleMicrophoneError: (error: any) => MicrophoneError;
  getErrorMessage: (error: MicrophoneError) => { title: string; description: string };
}

export const useMicrophonePermission = (): [MicrophonePermissionState, MicrophonePermissionActions] => {
  const [state, setState] = useState<MicrophonePermissionState>({
    permissionStatus: 'unknown',
    isChecking: false,
    error: null,
    hasDevices: false,
  });
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);

  const checkPermission = async (): Promise<PermissionStatus> => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // Check if Permission API is supported
      if ('permissions' in navigator && navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          const status = result.state as PermissionStatus;
          
          setState(prev => ({ ...prev, permissionStatus: status, isChecking: false }));
          return status;
        } catch (permError) {
          console.warn('Permission API query failed:', permError);
        }
      }

      // Fallback: try to enumerate devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');
        
        setState(prev => ({ 
          ...prev, 
          hasDevices: audioDevices.length > 0,
          permissionStatus: 'unknown',
          isChecking: false 
        }));
        
        return 'unknown';
      }

      setState(prev => ({ ...prev, isChecking: false }));
      return 'unknown';
    } catch (error) {
      console.error('Permission check failed:', error);
      setState(prev => ({ ...prev, isChecking: false }));
      return 'unknown';
    }
  };

  const handleMicrophoneError = (error: any): MicrophoneError => {
    if (error?.name === 'NotAllowedError') return 'NotAllowedError';
    if (error?.name === 'NotFoundError') return 'NotFoundError';
    if (error?.name === 'NotReadableError') return 'NotReadableError';
    if (error?.name === 'SecurityError') return 'SecurityError';
    return 'unknown';
  };

  const getErrorMessage = (error: MicrophoneError): { title: string; description: string } => {
    switch (error) {
      case 'NotAllowedError':
        return {
          title: '🚫 دسترسی رد شد',
          description: 'شما دسترسی به میکروفون را رد کردید. برای ضبط صدا، باید دسترسی را مجاز کنید.',
        };
      case 'NotFoundError':
        return {
          title: '🎤 میکروفون یافت نشد',
          description: 'هیچ میکروفونی در دستگاه شما پیدا نشد. لطفاً اتصال میکروفون را بررسی کنید.',
        };
      case 'NotReadableError':
        return {
          title: '⚠️ میکروفون در حال استفاده است',
          description: 'میکروفون توسط برنامه دیگری استفاده می‌شود. لطفاً آن برنامه را ببندید و دوباره تلاش کنید.',
        };
      case 'SecurityError':
        return {
          title: '🔒 خطای امنیتی',
          description: 'دسترسی به میکروفون به دلیل محدودیت‌های امنیتی (HTTPS) امکان‌پذیر نیست.',
        };
      default:
        return {
          title: 'خطا در دسترسی به میکروفون',
          description: 'لطفاً دسترسی به میکروفون را مجاز کنید و دوباره امتحان کنید.',
        };
    }
  };

  const requestPermission = async (): Promise<MediaStream | null> => {
    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // First check if we already have denied permission
      const currentStatus = await checkPermission();
      
      if (currentStatus === 'denied') {
        const errorMsg = getErrorMessage('NotAllowedError');
        toast({
          title: errorMsg.title,
          description: errorMsg.description,
          variant: 'destructive',
        });
        setShowPermissionGuide(true);
        setState(prev => ({ ...prev, error: 'NotAllowedError', isChecking: false }));
        return null;
      }

      // Check for available devices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some(device => device.kind === 'audioinput');

        if (!hasAudio) {
          const errorMsg = getErrorMessage('NotFoundError');
          toast({
            title: errorMsg.title,
            description: errorMsg.description,
            variant: 'destructive',
          });
          setState(prev => ({ ...prev, error: 'NotFoundError', hasDevices: false, isChecking: false }));
          return null;
        }
      }

      // Request permission
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      setState(prev => ({ 
        ...prev, 
        permissionStatus: 'granted', 
        hasDevices: true,
        error: null,
        isChecking: false 
      }));

      return stream;
    } catch (error: any) {
      console.error('Microphone access error:', error);
      
      const errorType = handleMicrophoneError(error);
      const errorMsg = getErrorMessage(errorType);
      
      toast({
        title: errorMsg.title,
        description: errorMsg.description,
        variant: 'destructive',
      });

      if (errorType === 'NotAllowedError' || errorType === 'SecurityError') {
        setShowPermissionGuide(true);
      }

      setState(prev => ({ 
        ...prev, 
        error: errorType,
        permissionStatus: errorType === 'NotAllowedError' ? 'denied' : prev.permissionStatus,
        isChecking: false 
      }));

      return null;
    }
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return [
    state,
    {
      checkPermission,
      requestPermission,
      showPermissionGuide,
      setShowPermissionGuide,
      handleMicrophoneError,
      getErrorMessage,
    }
  ];
};
