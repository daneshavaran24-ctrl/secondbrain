/**
 * Wake Word Detection Hook using Picovoice Porcupine
 * Supports custom "hey mora" keyword with fallback to Web Speech
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

// Types from Porcupine
type PorcupineInstance = {
  process: (pcm: Int16Array) => Promise<void>;
  release: () => Promise<void>;
};

type WakeWordStatus = 
  | 'idle'
  | 'loading'
  | 'listening'
  | 'detected'
  | 'error'
  | 'unsupported'
  | 'fallback';

interface UseWakeWordOptions {
  accessKey?: string;
  onWakeWord?: () => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
  fallbackEnabled?: boolean;
}

interface UseWakeWordReturn {
  status: WakeWordStatus;
  error: string | null;
  isListening: boolean;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  useFallback: boolean;
}

// Fallback: Web Speech API keyword detection
function useFallbackWakeWord(
  enabled: boolean,
  onDetected: () => void
): { isListening: boolean; start: () => void; stop: () => void } {
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    if (!enabled) return;

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fa-IR';

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        
        // Check for wake word variations
        const wakeWords = [
          'هی مورا',
          'hey mora',
          'hi mora',
          'سلام مورا',
          'مورا'
        ];
        
        if (wakeWords.some(w => transcript.includes(w.toLowerCase()))) {
          onDetected();
          break;
        }
      }
    };

    recognition.onend = () => {
      // Auto-restart for continuous listening
      if (isListeningRef.current && recognitionRef.current) {
        setTimeout(() => {
          try {
            recognitionRef.current?.start();
          } catch {
            // Ignore
          }
        }, 100);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.warn('[WakeWord Fallback] Error:', event.error);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore
      }
    };
  }, [enabled, onDetected]);

  const start = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        // Already started
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
  }, []);

  return { isListening, start, stop };
}

export function useWakeWord(options: UseWakeWordOptions = {}): UseWakeWordReturn {
  const {
    accessKey = import.meta.env.VITE_PICOVOICE_ACCESS_KEY,
    onWakeWord,
    onError,
    autoStart = false,
    fallbackEnabled = true,
  } = options;

  const [status, setStatus] = useState<WakeWordStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  
  const porcupineRef = useRef<PorcupineInstance | null>(null);
  const isInitializing = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Fallback wake word detection
  const fallback = useFallbackWakeWord(
    useFallback && fallbackEnabled,
    () => {
      setStatus('detected');
      onWakeWord?.();
      
      // Reset to listening after detection
      setTimeout(() => {
        if (useFallback) setStatus('fallback');
      }, 1000);
    }
  );

  // Cleanup function
  const cleanup = useCallback(async () => {
    try {
      if (porcupineRef.current) {
        await porcupineRef.current.release();
        porcupineRef.current = null;
      }
      
      // Unsubscribe from WebVoiceProcessor
      const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor');
      await WebVoiceProcessor.reset();
    } catch (e) {
      console.warn('[WakeWord] Cleanup error:', e);
    }
  }, []);

  // Initialize Porcupine
  const initializePorcupine = useCallback(async () => {
    if (isInitializing.current) return;
    if (!accessKey) {
      console.warn('[WakeWord] No access key provided, using fallback');
      setUseFallback(true);
      setStatus('fallback');
      fallback.start();
      return;
    }

    isInitializing.current = true;
    setStatus('loading');
    setError(null);

    try {
      // Dynamic imports
      const { Porcupine, BuiltInKeyword } = await import('@picovoice/porcupine-web');
      const { WebVoiceProcessor } = await import('@picovoice/web-voice-processor');

      await cleanup();

      // Detection callback
      const detectionCallback = (detection: { label: string; index: number }) => {
        console.log('[WakeWord] Detected:', detection.label);
        setStatus('detected');
        onWakeWord?.();
        
        // Reset to listening after brief detection state
        setTimeout(() => setStatus('listening'), 1000);
      };

      // Custom keyword model for "hey mora"
      const keywordModel = {
        publicPath: '/models/Hey-mora_en_wasm_v4_0_0.ppn',
        label: 'hey mora'
      };

      // Create Porcupine instance with custom "hey mora" keyword
      const porcupine = await Porcupine.create(
        accessKey,
        keywordModel,
        detectionCallback,
        { publicPath: '/porcupine_params.pv' }
      );

      porcupineRef.current = porcupine;

      // Subscribe to voice processor
      await WebVoiceProcessor.subscribe(porcupine as any);

      setStatus('listening');
      retryCount.current = 0;
      
      console.log('[WakeWord] Porcupine initialized with "hey mora" keyword');
      toast({
        title: 'دستیار صوتی فعال شد',
        description: 'بگویید «هی مورا» برای فعال‌سازی',
      });

    } catch (err) {
      console.error('[WakeWord] Init error:', err);
      const errorMsg = err instanceof Error ? err.message : 'خطا در راه‌اندازی';
      setError(errorMsg);
      onError?.(errorMsg);

      // Retry with exponential backoff
      if (retryCount.current < maxRetries) {
        retryCount.current++;
        const delay = Math.min(200 * Math.pow(2, retryCount.current), 800);
        console.log(`[WakeWord] Retrying in ${delay}ms...`);
        setTimeout(() => {
          isInitializing.current = false;
          initializePorcupine();
        }, delay);
        return;
      }

      // Fall back to Web Speech
      if (fallbackEnabled) {
        console.log('[WakeWord] Falling back to Web Speech API');
        setUseFallback(true);
        setStatus('fallback');
        fallback.start();
        toast({
          title: 'حالت جایگزین',
          description: 'بگویید «مورا» یا «سلام مورا» برای فعال‌سازی',
        });
      } else {
        setStatus('error');
      }
    } finally {
      isInitializing.current = false;
    }
  }, [accessKey, cleanup, fallbackEnabled, onError, onWakeWord, fallback]);

  // Auto-start on mount if enabled
  useEffect(() => {
    if (autoStart) {
      initializePorcupine();
    }

    return () => {
      cleanup();
      fallback.stop();
    };
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start listening
  const start = useCallback(async () => {
    if (useFallback) {
      fallback.start();
      setStatus('fallback');
    } else if (!porcupineRef.current) {
      await initializePorcupine();
    } else {
      setStatus('listening');
    }
  }, [useFallback, fallback, initializePorcupine]);

  // Stop listening
  const stop = useCallback(() => {
    cleanup();
    fallback.stop();
    setStatus('idle');
  }, [cleanup, fallback]);

  const isListening = status === 'listening' || status === 'fallback' || fallback.isListening;
  const isSupported = typeof window !== 'undefined' && 
                      ('AudioContext' in window || 'webkitAudioContext' in (window as any));

  return {
    status,
    error,
    isListening,
    isSupported,
    start,
    stop,
    useFallback,
  };
}
