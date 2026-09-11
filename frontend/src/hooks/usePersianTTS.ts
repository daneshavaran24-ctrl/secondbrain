/**
 * React Hook for Persian Text-to-Speech
 */

import { useState, useEffect, useCallback } from 'react';
import { persianTTS, VoiceConfig } from '@/lib/voice';

interface UsePersianTTSReturn {
  // State
  isEnabled: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  hasPersianVoice: boolean;
  
  // Actions
  speak: (text: string) => Promise<void>;
  stop: () => void;
  setEnabled: (enabled: boolean) => void;
  toggleEnabled: () => void;
  
  // Config
  config: VoiceConfig;
}

export function usePersianTTS(): UsePersianTTSReturn {
  const [isSpeaking, setIsSpeaking] = useState(persianTTS.isSpeaking());
  const [isEnabled, setIsEnabledState] = useState(persianTTS.isEnabled());
  
  useEffect(() => {
    // Subscribe to speaking state changes
    const unsubscribe = persianTTS.onSpeakingChange(setIsSpeaking);
    
    return () => {
      unsubscribe();
      // Stop speech on unmount
      persianTTS.stop();
    };
  }, []);

  const speak = useCallback(async (text: string) => {
    await persianTTS.speak(text);
  }, []);

  const stop = useCallback(() => {
    persianTTS.stop();
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    persianTTS.setEnabled(enabled);
    setIsEnabledState(enabled);
  }, []);

  const toggleEnabled = useCallback(() => {
    const newValue = !persianTTS.isEnabled();
    persianTTS.setEnabled(newValue);
    setIsEnabledState(newValue);
  }, []);

  return {
    isEnabled,
    isSpeaking,
    isSupported: persianTTS.isSupported(),
    hasPersianVoice: persianTTS.hasPersianVoice(),
    speak,
    stop,
    setEnabled,
    toggleEnabled,
    config: persianTTS.getConfig(),
  };
}
