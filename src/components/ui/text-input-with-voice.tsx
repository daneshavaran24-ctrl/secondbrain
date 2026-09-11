import * as React from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRealtimeSpeechRecognition } from "@/hooks/useRealtimeSpeechRecognition";
import { Badge } from "@/components/ui/badge";
import { RealtimeTranscript } from "@/components/journal/RealtimeTranscript";

export interface TextInputWithVoiceProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  type?: 'input' | 'textarea';
  enableVoice?: boolean;
  label?: string;
  rows?: number;
}

const TextInputWithVoice = React.forwardRef<HTMLTextAreaElement, TextInputWithVoiceProps>(
  ({ 
    className, 
    value, 
    onChange, 
    type = 'textarea', 
    enableVoice = true,
    label,
    rows = 3,
    placeholder,
    disabled,
    ...props 
  }, ref) => {
    const {
      isListening,
      transcript,
      interimTranscript,
      isSupported,
      startListening,
      stopListening,
      resetTranscript
    } = useRealtimeSpeechRecognition({
      language: 'fa-IR',
      continuous: true,
      interimResults: true,
      onResult: (text, isFinal) => {
        if (isFinal) {
          // Append final text to current value
          const newValue = value + (value ? ' ' : '') + text;
          onChange(newValue);
        }
      }
    });

    const handleToggleListening = () => {
      if (isListening) {
        // Save transcript before stopping
        const finalText = (transcript + ' ' + interimTranscript).trim();
        if (finalText) {
          const newValue = value + (value ? ' ' : '') + finalText;
          onChange(newValue);
        }
        stopListening();
        resetTranscript();
      } else {
        resetTranscript();
        startListening();
      }
    };

    const displayValue = value + (isListening && interimTranscript ? ' ' + interimTranscript : '');

    const inputClasses = cn(
      "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      type === 'textarea' ? "min-h-[80px] resize-none" : "h-10",
      className
    );

    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          {label && <label className="text-sm font-medium text-foreground">{label}</label>}
          {enableVoice && isSupported && (
            <div className="flex items-center gap-2">
              {isListening && (
                <Badge variant="default" className="animate-pulse text-xs">
                  در حال شنیدن...
                </Badge>
              )}
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={handleToggleListening}
                disabled={disabled}
                className="h-8 w-8 p-0"
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Real-time transcript display when listening */}
        {isListening && (transcript || interimTranscript) && (
          <RealtimeTranscript
            transcript={transcript}
            interimTranscript={interimTranscript}
            isListening={isListening}
          />
        )}
        
        {type === 'textarea' ? (
          <textarea
            ref={ref}
            className={inputClasses}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled || isListening}
            {...props}
          />
        ) : (
          <input
            type="text"
            className={inputClasses}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isListening}
          />
        )}
        
        {isListening && (
          <p className="text-xs text-muted-foreground">
            صحبت کنید... (برای توقف روی دکمه میکروفون کلیک کنید)
          </p>
        )}
      </div>
    );
  }
);

TextInputWithVoice.displayName = "TextInputWithVoice";

export { TextInputWithVoice };