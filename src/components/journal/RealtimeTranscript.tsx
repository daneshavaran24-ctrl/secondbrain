import React, { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';

interface RealtimeTranscriptProps {
  transcript: string;
  interimTranscript: string;
  isListening: boolean;
}

export const RealtimeTranscript: React.FC<RealtimeTranscriptProps> = ({
  transcript,
  interimTranscript,
  isListening,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript, interimTranscript]);

  const wordCount = (transcript + interimTranscript).trim().split(/\s+/).filter(Boolean).length;
  const charCount = (transcript + interimTranscript).length;

  return (
    <Card className="p-4 space-y-3 border-2 border-primary/20 bg-gradient-to-br from-background to-muted/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">متن تبدیل شده</span>
          {isListening && (
            <Badge variant="default" className="animate-pulse">
              در حال شنیدن...
            </Badge>
          )}
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>{wordCount} کلمه</span>
          <span>|</span>
          <span>{charCount} کاراکتر</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-[120px] max-h-[300px] overflow-y-auto p-4 rounded-lg bg-background/50 border border-border/50"
        dir="rtl"
      >
        {!transcript && !interimTranscript && (
          <p className="text-muted-foreground text-sm text-center py-8">
            متن در اینجا نمایش داده می‌شود...
          </p>
        )}
        
        {transcript && (
          <span className="text-foreground leading-relaxed">
            {transcript}
          </span>
        )}
        
        {interimTranscript && (
          <span className="text-muted-foreground leading-relaxed opacity-70">
            {interimTranscript}
          </span>
        )}
      </div>
    </Card>
  );
};
