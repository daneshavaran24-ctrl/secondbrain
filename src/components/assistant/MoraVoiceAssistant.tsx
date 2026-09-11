/**
 * Mora Voice Assistant - Full-screen Voice UI
 * Immersive voice-first experience with wake word detection
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Settings,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceToggle } from './VoiceToggle';
import { useWakeWord } from '@/hooks/useWakeWord';
import { useRealtimeSpeechRecognition } from '@/hooks/useRealtimeSpeechRecognition';
import { usePersianTTS } from '@/hooks/usePersianTTS';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CommandHistory {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
}

type AssistantState = 
  | 'waiting'      // Waiting for wake word
  | 'listening'    // Listening for command
  | 'processing'   // Processing command
  | 'speaking'     // Speaking response
  | 'error';       // Error state

interface MoraVoiceAssistantProps {
  onClose?: () => void;
  className?: string;
}

export function MoraVoiceAssistant({ onClose, className }: MoraVoiceAssistantProps) {
  const [state, setState] = useState<AssistantState>('waiting');
  const [statusText, setStatusText] = useState('در انتظار «هی مورا»...');
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const tts = usePersianTTS();

  // Wake word detection
  const wakeWord = useWakeWord({
    autoStart: true,
    fallbackEnabled: true,
    onWakeWord: () => {
      // Play activation sound or feedback
      setState('listening');
      setStatusText('گوش می‌دهم...');
      startListeningForCommand();
    },
    onError: (error) => {
      console.error('[MoraVoice] Wake word error:', error);
    }
  });

  // Speech recognition for commands
  const speechRecognition = useRealtimeSpeechRecognition({
    language: 'fa-IR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      setCurrentTranscript(text);
      if (isFinal && text.trim()) {
        processCommand(text.trim());
      }
    },
    onError: (error) => {
      console.error('[MoraVoice] Speech error:', error);
      setState('error');
      setErrorMessage(error);
      setTimeout(() => {
        setState('waiting');
        setStatusText('در انتظار «هی مورا»...');
        setErrorMessage(null);
      }, 3000);
    },
    onEnd: () => {
      if (state === 'listening' && !currentTranscript) {
        setState('waiting');
        setStatusText('در انتظار «هی مورا»...');
      }
    }
  });

  const startListeningForCommand = useCallback(() => {
    setCurrentTranscript('');
    speechRecognition.resetTranscript();
    speechRecognition.startListening();
  }, [speechRecognition]);

  // Process spoken command
  const processCommand = useCallback(async (command: string) => {
    setState('processing');
    setStatusText('در حال پردازش...');
    speechRecognition.stopListening();

    try {
      // Simple rule-based responses first
      let response = getSimpleResponse(command);

      if (!response) {
        // Call AI assistant for complex commands
        const result = await supabase.functions.invoke('smart-assistant', {
          body: {
            message: command,
            conversationHistory: [],
            context: getCurrentContext()
          }
        });

        if (result.error) throw new Error(result.error.message);
        response = result.data?.message || 'متوجه نشدم. لطفاً دوباره بگویید.';
      }

      // Add to history
      const historyEntry: CommandHistory = {
        id: crypto.randomUUID(),
        command,
        response,
        timestamp: new Date()
      };
      setCommandHistory(prev => [historyEntry, ...prev].slice(0, 5));

      // Speak response
      if (tts.isEnabled) {
        setState('speaking');
        setStatusText('پاسخ می‌دهم...');
        await tts.speak(response);
      }

      // Return to waiting state
      setState('waiting');
      setStatusText('در انتظار «هی مورا»...');

    } catch (error) {
      console.error('[MoraVoice] Process error:', error);
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'خطایی رخ داد');
      
      setTimeout(() => {
        setState('waiting');
        setStatusText('در انتظار «هی مورا»...');
        setErrorMessage(null);
      }, 3000);
    }
  }, [speechRecognition, tts]);

  // Simple rule-based responses
  const getSimpleResponse = (command: string): string | null => {
    const lower = command.toLowerCase().trim();

    // Greetings
    if (/^(سلام|درود|صبح بخیر|عصر بخیر|شب بخیر)/.test(lower)) {
      const greetings = ['سلام! چطوری؟', 'درود! چه کمکی از دستم بر میاد؟', 'سلام! در خدمتم'];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Farewell
    if (/^(خداحافظ|بای|به‌به|فعلا)/.test(lower)) {
      return 'زود برگرد! منتظرتم.';
    }

    // Time query
    if (/(ساعت چند|ساعت چنده|الان ساعت)/.test(lower)) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `الان ساعت ${formatter.format(now)} است.`;
    }

    // Date query
    if (/(تاریخ چی|امروز چندم|تاریخ امروز)/.test(lower)) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
      return `امروز ${formatter.format(now)} است.`;
    }

    // How are you
    if (/(حالت چطوره|چطوری|خوبی)/.test(lower)) {
      return 'ممنون! عالی‌ام. تو چطوری؟';
    }

    // What can you do
    if (/(چیکار میتونی|چه کارایی|کمکم کنی)/.test(lower)) {
      return 'می‌تونم قرارها و وظایفت رو مدیریت کنم، یادآوری بذارم، و به سوالاتت جواب بدم.';
    }

    return null; // No simple match, use AI
  };

  const getCurrentContext = () => {
    const now = new Date();
    return {
      currentDate: new Intl.DateTimeFormat('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(now),
      currentTime: new Intl.DateTimeFormat('fa-IR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(now)
    };
  };

  // Update status based on wake word state
  useEffect(() => {
    if (wakeWord.status === 'loading') {
      setStatusText('در حال راه‌اندازی...');
    } else if (wakeWord.status === 'fallback') {
      setStatusText('بگویید «مورا» یا «سلام مورا»...');
    } else if (wakeWord.status === 'error') {
      setStatusText('خطا در سیستم صوتی');
    }
  }, [wakeWord.status]);

  // Get pulse animation classes based on state
  const getPulseClass = () => {
    switch (state) {
      case 'listening':
        return 'animate-pulse bg-green-500/30';
      case 'speaking':
        return 'animate-pulse bg-primary/30';
      case 'processing':
        return 'bg-yellow-500/30';
      default:
        return 'bg-muted/30';
    }
  };

  return (
    <div 
      className={cn(
        'fixed inset-0 z-50 flex flex-col',
        'bg-gradient-to-br from-background via-background to-primary/10',
        className
      )}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <VoiceToggle size="sm" />
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-5 w-5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Title */}
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-primary mb-8"
        >
          مورا
        </motion.h1>

        {/* Microphone Visualization */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          {/* Outer pulse rings */}
          <AnimatePresence>
            {(state === 'listening' || state === 'speaking') && (
              <>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    state === 'listening' ? 'bg-green-500' : 'bg-primary'
                  )}
                />
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1.3, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                  className={cn(
                    'absolute inset-0 rounded-full',
                    state === 'listening' ? 'bg-green-500' : 'bg-primary'
                  )}
                />
              </>
            )}
          </AnimatePresence>

          {/* Main circle */}
          <motion.div
            className={cn(
              'relative w-32 h-32 rounded-full flex items-center justify-center',
              'border-4 transition-colors duration-300',
              state === 'listening' && 'border-green-500 bg-green-500/10',
              state === 'speaking' && 'border-primary bg-primary/10',
              state === 'processing' && 'border-yellow-500 bg-yellow-500/10',
              state === 'error' && 'border-destructive bg-destructive/10',
              state === 'waiting' && 'border-muted-foreground/30 bg-muted/10'
            )}
            animate={{
              scale: state === 'listening' ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: state === 'listening' ? Infinity : 0,
            }}
          >
            {state === 'processing' ? (
              <Loader2 className="h-12 w-12 text-yellow-500 animate-spin" />
            ) : state === 'speaking' ? (
              <Volume2 className="h-12 w-12 text-primary animate-pulse" />
            ) : state === 'error' ? (
              <MicOff className="h-12 w-12 text-destructive" />
            ) : (
              <Mic className={cn(
                'h-12 w-12 transition-colors',
                state === 'listening' ? 'text-green-500' : 'text-muted-foreground'
              )} />
            )}
          </motion.div>
        </motion.div>

        {/* Status Text */}
        <motion.p
          key={statusText}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl text-foreground/80 text-center mb-4"
        >
          {statusText}
        </motion.p>

        {/* Current Transcript */}
        <AnimatePresence>
          {currentTranscript && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-lg text-primary text-center mb-6 max-w-md"
            >
              «{currentTranscript}»
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-destructive text-center mb-6 max-w-md"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual Start Button (when not auto-listening) */}
        {state === 'waiting' && !wakeWord.isListening && (
          <Button
            onClick={() => {
              setState('listening');
              setStatusText('گوش می‌دهم...');
              startListeningForCommand();
            }}
            size="lg"
            className="mt-4"
          >
            <Mic className="h-5 w-5 ml-2" />
            شروع گفتگو
          </Button>
        )}
      </div>

      {/* Command History */}
      {commandHistory.length > 0 && (
        <div className="px-6 pb-6">
          <div className="glass-card rounded-xl p-4 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              آخرین دستورات:
            </h3>
            <div className="space-y-2">
              {commandHistory.map((item) => (
                <div 
                  key={item.id}
                  className="text-sm border-b border-border/30 pb-2 last:border-0"
                >
                  <p className="text-foreground">«{item.command}»</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    ← {item.response.substring(0, 50)}
                    {item.response.length > 50 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Wake Word Status Indicator */}
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground flex items-center gap-2">
        <span 
          className={cn(
            'w-2 h-2 rounded-full',
            wakeWord.isListening ? 'bg-green-500' : 'bg-muted-foreground/30'
          )} 
        />
        {wakeWord.useFallback ? 'تشخیص صوتی' : 'Wake Word فعال'}
      </div>
    </div>
  );
}
