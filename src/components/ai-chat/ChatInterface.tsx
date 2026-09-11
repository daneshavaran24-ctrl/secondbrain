import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageCircle, Bot, User, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import MarkdownMessage from './MarkdownMessage';
import MessageActions from './MessageActions';
import TypingIndicator from './TypingIndicator';
import QuickReplies from './QuickReplies';
import SentimentIndicator from './SentimentIndicator';
import ImageUpload from './ImageUpload';
import ExportButton from './ExportButton';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  role: string;
  content: string;
  created_at: string;
  sentiment?: string;
}

interface ChatInterfaceProps {
  sessionType: 'mentor' | 'coach' | 'decision-maker';
  sessionId?: string;
  onSessionCreated?: (sessionId: string) => void;
  initialContext?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  sessionType, 
  sessionId, 
  onSessionCreated,
  initialContext
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(sessionId);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (currentSessionId) {
      loadMessages();
      loadSessionTitle();
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const loadSessionTitle = async () => {
    if (!currentSessionId) return;
    
    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('title')
        .eq('id', currentSessionId)
        .single();
      
      if (error) throw error;
      setSessionTitle(data?.title || '');
    } catch (error) {
      console.error('Error loading session title:', error);
    }
  };

  const loadMessages = async () => {
    if (!currentSessionId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      let query = supabase
        .from('ai_chat_messages')
        .select('id, role, content, created_at, user_id, sentiment')
        .eq('session_id', currentSessionId);
      
      // فقط اگر لاگین بود، فیلتر user_id اضافه کن
      if (session?.user) {
        query = query.eq('user_id', session.user.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      
      if ((data || []).length > 0) {
        setShowQuickReplies(false);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: 'خطا',
        description: 'خطا در بارگذاری پیام‌ها',
        variant: 'destructive',
      });
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    setInputMessage('');
    setIsLoading(true);
    setShowQuickReplies(false);
    setIsTyping(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: 'temp-user',
      role: 'user',
      content: textToSend.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMessage]);

    // Add empty AI message for streaming
    const tempAiMessage: Message = {
      id: 'temp-ai',
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempAiMessage]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const supabaseUrl = 'https://jymajpnwthgqcghmkmam.supabase.co';
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: textToSend.trim(),
          sessionId: currentSessionId,
          sessionType,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', errorText);
        
        if (response.status === 429) {
          throw new Error('درخواست‌های شما زیاد است. لطفاً ۳۰ ثانیه صبر کنید...');
        } else if (response.status === 402) {
          throw new Error('اعتبار AI تمام شده. لطفاً از بخش تنظیمات اعتبار اضافه کنید.');
        }
        throw new Error('خطا در دریافت پاسخ از AI');
      }

      // Process streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      let buffer = '';
      let newSessionId = currentSessionId;

      setIsTyping(false); // Hide typing indicator when streaming starts
      setIsStreaming(true);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || line.startsWith(':')) continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            // Handle sessionId from first event
            if (parsed.sessionId && !currentSessionId) {
              newSessionId = parsed.sessionId;
              setCurrentSessionId(newSessionId);
              onSessionCreated?.(newSessionId);
            }

            // Handle content delta
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              aiContent += token;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === 'temp-ai'
                    ? { ...msg, content: aiContent }
                    : msg
                )
              );
              
              // Auto-scroll during streaming
              if (scrollAreaRef.current) {
                scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
              }
            }
          } catch (e) {
            console.error('Error parsing SSE:', e);
          }
        }
      }

      // Save the complete message to database
      if (newSessionId && aiContent) {
        // Get user_id (use mock user if not logged in)
        const userId = session?.user?.id || '00000000-0000-0000-0000-000000000000';
        
        await supabase
          .from('ai_chat_messages')
          .insert([
            {
              session_id: newSessionId,
              user_id: userId,
              role: 'user',
              content: textToSend.trim(),
            },
            {
              session_id: newSessionId,
              user_id: userId,
              role: 'assistant',
              content: aiContent,
            }
          ]);

        // Update session timestamp
        await supabase
          .from('ai_chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', newSessionId);

        // Reload to get proper IDs and sentiment
        setTimeout(() => {
          loadMessages();
        }, 500);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'خطا در ارسال پیام';
      let errorTitle = 'خطا';
      
      if (error.message?.includes('429') || error.message?.includes('زیاد')) {
        errorTitle = 'محدودیت درخواست';
        errorMessage = 'درخواست‌های شما زیاد است. لطفاً ۳۰ ثانیه صبر کنید و دوباره تلاش کنید.';
      } else if (error.message?.includes('402') || error.message?.includes('اعتبار')) {
        errorTitle = 'اعتبار ناکافی';
        errorMessage = 'اعتبار AI شما تمام شده است. لطفاً از بخش تنظیمات اعتبار اضافه کنید.';
      } else if (error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
        errorTitle = 'خطای شبکه';
        errorMessage = 'مشکل در اتصال به سرور. لطفاً اتصال اینترنت خود را بررسی کنید.';
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: 'destructive',
      });

      // Remove temp messages on error
      setMessages(prev => prev.filter(msg => msg.id !== 'temp-user' && msg.id !== 'temp-ai'));
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsStreaming(false);
    }
  };

  const handleQuickReply = (text: string) => {
    setInputMessage(text);
    sendMessage(text);
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    const previousUserMessage = messages[messageIndex - 1];
    if (previousUserMessage && previousUserMessage.role === 'user') {
      // Remove the AI message and regenerate
      setMessages(prev => prev.slice(0, messageIndex));
      await sendMessage(previousUserMessage.content);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getSessionTitle = () => {
    switch (sessionType) {
      case 'mentor':
        return 'چت با منتور AI';
      case 'coach':
        return 'چت با کوچ AI';
      case 'decision-maker':
        return 'چت با مشاور تصمیم‌گیری AI';
      default:
        return 'چت با AI';
    }
  };

  const getWelcomeMessage = () => {
    let baseMessage = '';
    
    switch (sessionType) {
      case 'mentor':
        baseMessage = 'سلام! من منتور شخصی شما هستم. چگونه می‌توانم به شما کمک کنم تا اهدافتان را محقق کنید؟';
        break;
      case 'coach':
        baseMessage = 'سلام! من کوچ شما هستم. آماده‌ام تا در مسیر بهبود و توسعه شخصی شما راهنمایی‌تان کنم.';
        break;
      case 'decision-maker':
        baseMessage = 'سلام! من مشاور تصمیم‌گیری شما هستم. آماده‌ام تا در تحلیل گزینه‌ها و اتخاذ تصمیمات مهم کمکتان کنم.';
        break;
      default:
        baseMessage = 'سلام! چگونه می‌توانم کمکتان کنم؟';
    }
    
    if (initialContext) {
      return `${baseMessage}\n\n${initialContext}`;
    }
    
    return baseMessage;
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              {getSessionTitle()}
              <Badge variant="secondary">
                {sessionType === 'mentor' ? 'منتور' : 
                 sessionType === 'coach' ? 'کوچ' : 'مشاور'}
              </Badge>
            </CardTitle>
            {currentSessionId && sessionTitle && (
              <ExportButton sessionId={currentSessionId} sessionTitle={sessionTitle} />
            )}
          </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 min-h-0">
        <ScrollArea className="flex-1 px-4 min-h-0" ref={scrollAreaRef}>
          <div className="space-y-4 py-4">
            {messages.length === 0 && (
              <>
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg mx-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">دستیار AI</p>
                    <p className="text-sm whitespace-pre-wrap">{getWelcomeMessage()}</p>
                  </div>
                </div>
                {showQuickReplies && (
                  <div className="mx-2">
                    <QuickReplies sessionType={sessionType} onSelect={handleQuickReply} />
                  </div>
                )}
              </>
            )}
            
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-secondary' 
                    : 'bg-primary'
                }`}>
                  {message.role === 'user' ? (
                    <User className="w-4 h-4 text-secondary-foreground" />
                  ) : (
                    <Bot className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className={`flex-1 ${message.role === 'user' ? 'text-right' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-muted-foreground">
                      {message.role === 'user' ? 'شما' : 'دستیار AI'}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-lg text-sm ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground ml-8'
                      : 'bg-muted mr-8'
                  }`}>
                    {message.role === 'assistant' ? (
                      <MarkdownMessage content={message.content} />
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'assistant' && (
                    <MessageActions
                      content={message.content}
                      messageId={message.id}
                      onRegenerate={() => handleRegenerateMessage(index)}
                    />
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && !isStreaming && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">دستیار AI</p>
                  <TypingIndicator />
                </div>
              </div>
            )}
            
            {isStreaming && (
              <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg w-fit">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs text-primary font-medium">در حال دریافت پاسخ...</span>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t flex-shrink-0">
          {selectedImage && (
            <div className="mb-3">
              <ImageUpload 
                onImageSelect={setSelectedImage} 
                onRemove={() => setSelectedImage(null)}
                disabled={isLoading}
              />
            </div>
          )}
          <div className="flex gap-2">
            {!selectedImage && (
              <ImageUpload 
                onImageSelect={setSelectedImage} 
                onRemove={() => setSelectedImage(null)}
                disabled={isLoading}
              />
            )}
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="پیام خود را تایپ کنید..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={() => sendMessage()}
              disabled={(!inputMessage.trim() && !selectedImage) || isLoading || isStreaming}
              size="icon"
              className="relative"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground mt-2 text-center">
            {inputMessage.length} کاراکتر
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;