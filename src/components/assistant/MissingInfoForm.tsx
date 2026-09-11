/**
 * Missing Info Form Component
 * Collects additional information from user when extracted data is incomplete
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
  Send,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface MissingField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'time';
  options?: string[];
  placeholder?: string;
  required?: boolean;
}

interface MissingInfoFormProps {
  dataType: string;
  fields: MissingField[];
  suggestions?: Record<string, string[]>;
  onSubmit: (data: Record<string, string>) => void;
  onSkip?: () => void;
  className?: string;
}

export function MissingInfoForm({
  dataType,
  fields,
  suggestions = {},
  onSubmit,
  onSkip,
  className
}: MissingInfoFormProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentField = fields[currentIndex];
  const isLast = currentIndex === fields.length - 1;

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (isLast) {
      onSubmit(values);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSuggestionClick = (value: string) => {
    handleChange(currentField.key, value);
    handleNext();
  };

  if (!currentField) {
    return null;
  }

  const fieldSuggestions = suggestions[currentField.key] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border/50 overflow-hidden',
        'bg-card/80 backdrop-blur-sm p-4',
        className
      )}
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-1 mb-4">
        {fields.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              idx <= currentIndex ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Question */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground mb-1">
            {currentField.label}
          </p>
          {currentField.placeholder && (
            <p className="text-xs text-muted-foreground">
              {currentField.placeholder}
            </p>
          )}
        </div>
      </div>

      {/* Input based on type */}
      <div className="mb-4">
        {currentField.type === 'textarea' ? (
          <Textarea
            value={values[currentField.key] || ''}
            onChange={(e) => handleChange(currentField.key, e.target.value)}
            placeholder={currentField.placeholder}
            rows={3}
            className="resize-none"
          />
        ) : currentField.type === 'select' && currentField.options ? (
          <div className="flex flex-wrap gap-2">
            {currentField.options.map((option) => (
              <Button
                key={option}
                variant={values[currentField.key] === option ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleChange(currentField.key, option)}
              >
                {option}
              </Button>
            ))}
          </div>
        ) : (
          <Input
            type={currentField.type === 'date' ? 'date' : currentField.type === 'time' ? 'time' : 'text'}
            value={values[currentField.key] || ''}
            onChange={(e) => handleChange(currentField.key, e.target.value)}
            placeholder={currentField.placeholder}
          />
        )}
      </div>

      {/* Suggestions */}
      {fieldSuggestions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">پیشنهادات:</p>
          <div className="flex flex-wrap gap-2">
            {fieldSuggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleNext}
          disabled={currentField.required && !values[currentField.key]}
          className="flex-1 gap-2"
        >
          {isLast ? (
            <>
              <Send className="h-4 w-4" />
              تأیید و ذخیره
            </>
          ) : (
            <>
              بعدی
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
        
        {onSkip && !currentField.required && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSkip}
          >
            رد کردن
          </Button>
        )}
      </div>
    </motion.div>
  );
}
