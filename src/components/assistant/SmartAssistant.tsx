/**
 * Smart Executive Assistant Component
 * Floating chat interface for natural language commands
 * Enhanced with voice input, file upload, TTS, and detailed feedback
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { MoraRobotIcon } from './MoraRobotIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  MicOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  // Sparkles removed - replaced by MoraRobotIcon
  Calendar,
  ClipboardList,
  Bell,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Table,
  XCircle,
  MapPin,
  Volume2,
  Maximize2,
  BarChart3,
  Music,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { actionExecutor, AssistantAction, ActionResult } from '@/services/actionExecutorService';
import { offlineStorage } from '@/services/offlineStorageService';
import { fileProcessor, ProcessedFile } from '@/services/fileProcessorService';
import { logAssistantAction } from '@/services/assistantLogService';
import { useOffline } from '@/hooks/useOffline';
import { useRealtimeSpeechRecognition } from '@/hooks/useRealtimeSpeechRecognition';
import { usePersianTTS } from '@/hooks/usePersianTTS';
import { VoiceToggle } from './VoiceToggle';
import { MoraVoiceAssistant } from './MoraVoiceAssistant';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: AssistantAction[];
  questions?: Array<{
    question: string;
    options?: string[];
    field?: string;
  }>;
  isLoading?: boolean;
  attachment?: {
    fileName: string;
    type: string;
    preview?: string;
  };
}

interface SmartAssistantProps {
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SmartAssistant({ className, isOpen: externalIsOpen, onOpenChange }: SmartAssistantProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Use external control if provided, otherwise internal
  const isOpen = externalIsOpen ?? internalIsOpen;
  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };
  
  // State for preventing duplicate action execution
  const [executingActions, setExecutingActions] = useState<Set<string>>(new Set());
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState<AssistantAction[]>([]);
  const [attachedFile, setAttachedFile] = useState<ProcessedFile | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useOffline();
  
  // Persian TTS hook
  const tts = usePersianTTS();

  // Voice recognition hook
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    resetTranscript
  } = useRealtimeSpeechRecognition({
    language: 'fa-IR',
    continuous: true,
    interimResults: true,
    onResult: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setInput(prev => {
          const newInput = prev ? `${prev} ${text}` : text;
          return newInput;
        });
      }
    }
  });

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await offlineStorage.getRecentHistory(20);
      if (history.length > 0) {
        setMessages(history.map(h => ({
          id: h.id,
          role: h.role,
          content: h.content,
          timestamp: new Date(h.timestamp),
          actions: h.actions?.map(a => ({
            function: a.function || a.type || '',
            params: a.params,
            status: a.status as AssistantAction['status'],
            result: a.result,
            error: a.error
          }))
        })));
      }
    };
    loadHistory();
  }, []);

  // Auto-clear messages every 10 minutes for fresh UX
  useEffect(() => {
    const interval = setInterval(async () => {
      setMessages([]);
      await offlineStorage.clearSessionHistory('current');
      console.log('[SmartAssistant] Auto-cleared messages for fresh UX');
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Get current date/time context
  const getContext = useCallback(() => {
    const now = new Date();
    const persianFormatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    const timeFormatter = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return {
      currentDate: persianFormatter.format(now),
      currentTime: timeFormatter.format(now)
    };
  }, []);

  // Handle file upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const processed = await fileProcessor.processFile(file);
      setAttachedFile(processed);
    } catch (error) {
      console.error('[SmartAssistant] File processing error:', error);
      // Show error in chat
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ خطا در پردازش فایل: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Remove attached file
  const removeAttachment = () => {
    if (attachedFile?.preview) {
      URL.revokeObjectURL(attachedFile.preview);
    }
    setAttachedFile(null);
  };

  // Send message to assistant
  const sendMessage = async (text: string) => {
    if ((!text.trim() && !attachedFile) || isLoading) return;

    const messageText = text.trim() || (attachedFile ? `فایل ضمیمه: ${attachedFile.fileName}` : '');

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      attachment: attachedFile ? {
        fileName: attachedFile.fileName,
        type: attachedFile.type,
        preview: attachedFile.preview
      } : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    resetTranscript();

    // Save to offline storage
    await offlineStorage.saveMessage({
      id: userMessage.id,
      role: 'user',
      content: userMessage.content,
      timestamp: userMessage.timestamp.toISOString(),
      sessionId: 'current'
    });

    // Add loading message
    const loadingId = crypto.randomUUID();
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Prepare attachment data if present
      const attachmentData = attachedFile ? {
        fileName: attachedFile.fileName,
        type: attachedFile.type,
        content: attachedFile.text || JSON.stringify(attachedFile.data),
        summary: attachedFile.summary
      } : null;

      const response = await supabase.functions.invoke('smart-assistant', {
        body: {
          message: messageText,
          conversationHistory,
          context: getContext(),
          attachment: attachmentData
        }
      });

      // Clear attached file after sending
      removeAttachment();

      if (response.error) {
        throw new Error(response.error.message || 'خطا در ارتباط با دستیار');
      }

      const data = response.data;

      // Remove loading message and add response
      const responseMessage = data.message || 'چگونه می‌توانم کمکتان کنم؟';
      
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: responseMessage,
          timestamp: new Date(),
          actions: data.actions,
          questions: data.questions
        };

        // Save to offline storage
        offlineStorage.saveMessage({
          id: assistantMessage.id,
          role: 'assistant',
          content: assistantMessage.content,
          actions: assistantMessage.actions?.map(a => ({
            type: a.function,
            function: a.function,
            params: a.params,
            status: a.status
          })),
          timestamp: assistantMessage.timestamp.toISOString(),
          sessionId: 'current'
        });

        return [...filtered, assistantMessage];
      });

      // Speak the response if TTS is enabled
      if (tts.isEnabled && responseMessage) {
        tts.speak(responseMessage);
      }

      // Auto-execute safe actions, store sensitive ones for confirmation
      if (data.actions && data.actions.length > 0) {
        const safeActions = [
          'create_meeting', 'create_task', 'create_reminder',
          'save_for_later', 'save_journal_entry', 'save_gratitude',
          'create_contact', 'save_meeting_summary', 'save_meeting_recording',
          'create_tasks_batch', 'import_contacts_batch',
          // Domain-specific safe actions
          'save_health_metrics',    // سلامت
          'add_resume_item',        // رزومه
          'create_csr_project',     // مسئولیت اجتماعی
          'save_idea',              // ایده‌ها
          'save_knowledge',         // مدیریت دانش
          'complete_habit',         // عادت‌ها
          'get_pending_tasks',      // وظایف معوق
          // NEW: Legal & Organization
          'create_legal_case',      // پرونده حقوقی
          'save_lawyer_note',       // یادداشت حقوقی
          'create_organization_mission' // ماموریت سازمانی
        ];
        
        const sensitiveActions = ['cancel_meeting', 'update_meeting', 'delete_task'];
        
        for (const action of data.actions) {
          if (safeActions.includes(action.function)) {
            // Auto-execute safe actions
            const result = await actionExecutor.executeAction(action);

            // ثبت لاگ گزارش‌گیری
            logAssistantAction({
              action_type: action.function,
              summary: result.message || `اجرای ${action.function}`,
              domain: (action.params as any)?.domain ?? null,
              target_table: (result as any)?.targetTable ?? null,
              target_id: (result as any)?.targetId ?? null,
              payload: { params: action.params, result: { success: result.success, location: result.location } },
              status: result.success ? 'success' : 'failed',
              error_message: result.success ? null : result.message,
            });

            // Only add result message if different from AI response message
            // to avoid duplicate messages
            const resultMessage = result.location 
              ? `${result.message}\n📍 ${result.location}`
              : result.message;
            
            // Check if AI response already contains similar confirmation
            const aiMessageHasConfirmation = data.message && (
              data.message.includes('انجام شد') || 
              data.message.includes('ذخیره شد') ||
              data.message.includes('ایجاد شد') ||
              data.message.includes('ثبت شد')
            );
            
            // Only show separate result message if AI didn't already confirm
            // or if there was an error
            if (!result.success || !aiMessageHasConfirmation) {
              setMessages(prev => [...prev, {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: result.success ? resultMessage : `❌ ${result.message}`,
                timestamp: new Date()
              }]);
            }
          } else if (sensitiveActions.includes(action.function)) {
            // Store sensitive actions for confirmation
            setPendingActions(prev => [...prev, action]);
          }
        }
      }

    } catch (error) {
      console.error('[SmartAssistant] Error:', error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== loadingId);
        return [...filtered, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: error instanceof Error ? error.message : 'متأسفانه مشکلی پیش آمد. لطفاً دوباره تلاش کنید.',
          timestamp: new Date()
        }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Execute pending action
  const executeAction = async (action: AssistantAction) => {
    setIsLoading(true);
    try {
      const result = await actionExecutor.executeAction(action);

      logAssistantAction({
        action_type: action.function,
        summary: result.message || `اجرای ${action.function}`,
        domain: (action.params as any)?.domain ?? null,
        target_table: (result as any)?.targetTable ?? null,
        target_id: (result as any)?.targetId ?? null,
        payload: { params: action.params, result: { success: result.success, location: result.location } },
        status: result.success ? 'success' : 'failed',
        error_message: result.success ? null : result.message,
      });

      // Add result message with location info
      const resultMessage = result.location 
        ? `${result.message}\n📍 ${result.location}`
        : result.message;

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.success 
          ? resultMessage
          : `❌ ${result.message}`,
        timestamp: new Date()
      }]);

      // Remove from pending
      setPendingActions(prev => prev.filter(a => a !== action));

    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `❌ خطا در اجرای عملیات: ${error instanceof Error ? error.message : 'خطای ناشناخته'}`,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action selection
  const handleQuickOption = (option: string) => {
    setInput(option);
    sendMessage(option);
  };

  // Toggle voice input
  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel':
      case 'csv': return <Table className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      default: return <Paperclip className="h-4 w-4" />;
    }
  };

  // Quick suggestions
  const suggestions = [
    { icon: Calendar, text: 'قرارهای امروز', color: 'text-primary' },
    { icon: ClipboardList, text: 'وظایف عقب‌افتاده', color: 'text-warning' },
    { icon: Bell, text: 'یادآوری جدید', color: 'text-success' },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className={cn(
              'fixed bottom-24 left-6 z-50 md:bottom-8',
              'w-14 h-14 rounded-full',
              'glass-button shadow-lg',
              'flex items-center justify-center',
              'text-primary hover:glow-primary',
              'transition-all duration-300',
              className
            )}
          >
            <MoraRobotIcon size="lg" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn(
              'fixed bottom-4 left-4 right-4 z-50',
              'md:bottom-8 md:left-8 md:right-auto md:w-[440px]',
              'max-h-[85vh] rounded-3xl overflow-hidden',
              // Liquid Glass Styles
              'bg-white/70 dark:bg-slate-900/70',
              'backdrop-blur-2xl backdrop-saturate-150',
              'border border-white/50 dark:border-white/10',
              'shadow-[0_8px_32px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.5)]',
              'dark:shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]',
              'flex flex-col'
            )}
          >
            {/* Header - Liquid Glass */}
            <div className="flex items-center justify-between p-4 border-b border-white/30 dark:border-white/10 bg-white/30 dark:bg-slate-800/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <MoraRobotIcon size="sm" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">دستیار هوشمند مورا</h3>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? 'آنلاین' : 'آفلاین - حالت محدود'}
                    {tts.isSpeaking && ' • 🔊 در حال صحبت'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Reports link */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    window.location.href = '/assistant-reports';
                  }}
                  className="hover:bg-muted/50"
                  title="گزارش‌های دستیار"
                >
                  <BarChart3 className="h-5 w-5" />
                </Button>
                {/* Voice Mode Toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsVoiceMode(true)}
                  className="hover:bg-muted/50"
                  title="حالت صوتی تمام‌صفحه"
                >
                  <Maximize2 className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-muted/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages - Improved Scroll */}
            <ScrollArea 
              ref={scrollRef}
              className="flex-1 p-4 min-h-[200px] max-h-[50vh] overflow-y-auto"
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <MoraRobotIcon size="lg" className="mx-auto text-primary/40 mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    سلام! من دستیار هوشمند شما هستم.
                    <br />
                    چطور می‌توانم کمکتان کنم؟
                  </p>
                  
                  {/* Quick suggestions */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickOption(suggestion.text)}
                        className={cn(
                          'flex items-center gap-2 px-3 py-2 rounded-full',
                          'glass-button text-sm hover:scale-105 transition-transform',
                          suggestion.color
                        )}
                      >
                        <suggestion.icon className="h-4 w-4" />
                        <span>{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex',
                        message.role === 'user' ? 'justify-start' : 'justify-end'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-2xl px-4 py-3',
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'glass-card rounded-bl-md'
                        )}
                      >
                        {message.isLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">در حال فکر کردن...</span>
                          </div>
                        ) : (
                          <>
                            {/* Attachment preview */}
                            {message.attachment && (
                              <div className="flex items-center gap-2 mb-2 p-2 rounded-lg bg-background/30">
                                {getFileIcon(message.attachment.type)}
                                <span className="text-xs truncate">{message.attachment.fileName}</span>
                              </div>
                            )}

                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                            
                            {/* Questions with options */}
                            {message.questions && message.questions.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.questions.map((q, idx) => (
                                  <div key={idx} className="space-y-2">
                                    {q.options && q.options.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {q.options.map((option, optIdx) => (
                                          <button
                                            key={optIdx}
                                            onClick={() => handleQuickOption(option)}
                                            className="px-3 py-1.5 text-xs rounded-full glass-button hover:bg-primary/20"
                                          >
                                            {option}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Action confirmations with feedback */}
                            {message.actions && message.actions.length > 0 && (
                              <div className="mt-3 space-y-2">
                                {message.actions.map((action, idx) => (
                                  <div 
                                    key={idx}
                                    className="p-3 rounded-lg bg-background/50 space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-medium">
                                        {action.function === 'create_meeting' && '📅 ایجاد قرار'}
                                        {action.function === 'cancel_meeting' && '❌ لغو قرار'}
                                        {action.function === 'update_meeting' && '✏️ ویرایش قرار'}
                                        {action.function === 'create_task' && '✅ ایجاد وظیفه'}
                                        {action.function === 'send_notification' && '📨 ارسال پیام'}
                                        {action.function === 'create_reminder' && '🔔 یادآوری'}
                                        {action.function === 'save_journal_entry' && '📝 دل‌نوشته'}
                                        {action.function === 'save_gratitude' && '🙏 شکرگذاری'}
                                        {action.function === 'save_meeting_summary' && '📋 صورتجلسه'}
                                        {action.function === 'create_contact' && '👤 ایجاد مخاطب'}
                                        {action.function === 'save_meeting_recording' && '🎤 ذخیره ضبط'}
                                        {action.function === 'create_tasks_batch' && '✅ ایجاد وظایف'}
                                        {action.function === 'import_contacts_batch' && '👥 ورود مخاطبین'}
                                        {action.function === 'save_for_later' && '📚 ذخیره برای بعد'}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 px-2 text-xs"
                                        onClick={() => executeAction(action)}
                                        disabled={isLoading}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5 ml-1" />
                                        تأیید
                                      </Button>
                                    </div>
                                    
                                    {/* Feedback info */}
                                    {action.feedback && (
                                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        <span>{action.feedback.location}</span>
                                        {action.feedback.details && (
                                          <span>• {action.feedback.details}</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Attached file preview */}
            {attachedFile && (
              <div className="px-4 py-2 border-t border-border/50">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    {getFileIcon(attachedFile.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{attachedFile.fileName}</p>
                      <p className="text-xs text-muted-foreground">{attachedFile.summary}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={removeAttachment}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Interim transcript display */}
            {interimTranscript && (
              <div className="px-4 py-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">
                  🎤 {interimTranscript}...
                </p>
              </div>
            )}

            {/* Voice Toggle + Input - Liquid Glass Design */}
            <div className="p-4 border-t border-white/20 dark:border-white/10 space-y-3 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
              {/* TTS Toggle */}
              <div className="flex items-center justify-between">
                <VoiceToggle size="sm" showLabel={true} />
                {tts.isSpeaking && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => tts.stop()}
                    className="text-xs text-muted-foreground hover:bg-white/20"
                  >
                    متوقف کردن
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Voice button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleVoice}
                  disabled={!voiceSupported}
                  className={cn(
                    'shrink-0 h-10 w-10 rounded-xl',
                    'bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm',
                    'border border-white/30 dark:border-white/10',
                    'hover:bg-white/60 dark:hover:bg-slate-700/60',
                    'transition-all duration-200',
                    isListening && 'bg-destructive/20 text-destructive animate-pulse border-destructive/30'
                  )}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                {/* File upload button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessingFile}
                  className={cn(
                    'shrink-0 h-10 w-10 rounded-xl',
                    'bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm',
                    'border border-white/30 dark:border-white/10',
                    'hover:bg-white/60 dark:hover:bg-slate-700/60',
                    'transition-all duration-200'
                  )}
                >
                  {isProcessingFile ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,.pdf,.xlsx,.xls,.csv,.mp3,.wav,.m4a,.webm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
                  placeholder="اینجا بنویسید یا صحبت کنید..."
                  className={cn(
                    'flex-1 h-11 rounded-2xl',
                    'bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm',
                    'border border-white/40 dark:border-white/10',
                    'focus:ring-2 focus:ring-primary/30 focus:border-primary/50',
                    'placeholder:text-muted-foreground/70',
                    'transition-all duration-200'
                  )}
                  disabled={isLoading}
                />
                
                {/* Prominent Send Button */}
                <Button
                  onClick={() => sendMessage(input)}
                  disabled={(!input.trim() && !attachedFile) || isLoading}
                  className={cn(
                    'shrink-0 h-12 w-12 rounded-2xl',
                    'bg-gradient-to-br from-primary to-primary/80',
                    'hover:from-primary/90 hover:to-primary/70',
                    'shadow-lg shadow-primary/25',
                    'hover:shadow-xl hover:shadow-primary/30',
                    'border border-white/20',
                    'transition-all duration-300',
                    'disabled:opacity-50 disabled:shadow-none'
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    <Send className="h-5 w-5 text-white" />
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Voice Mode */}
      <AnimatePresence>
        {isVoiceMode && (
          <MoraVoiceAssistant onClose={() => setIsVoiceMode(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
