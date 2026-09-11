/**
 * File Analysis Card Component
 * Displays extracted data from files with options to save
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  ClipboardList,
  FileText,
  Check,
  X,
  Edit2,
  Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExtractedField {
  key: string;
  label: string;
  value: string;
  required?: boolean;
  editable?: boolean;
}

interface FileAnalysisCardProps {
  dataType: 'contact' | 'meeting' | 'task' | 'recording' | 'document';
  extractedFields: ExtractedField[];
  missingFields?: string[];
  onConfirm: (data: Record<string, string>) => void;
  onCancel: () => void;
  onRequestInfo?: (field: string) => void;
  isLoading?: boolean;
  className?: string;
}

const TYPE_CONFIG = {
  contact: {
    icon: User,
    title: 'مخاطب جدید',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  meeting: {
    icon: Calendar,
    title: 'رویداد تقویم',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10'
  },
  task: {
    icon: ClipboardList,
    title: 'وظیفه جدید',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  recording: {
    icon: FileText,
    title: 'ضبط جلسه',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  document: {
    icon: FileText,
    title: 'سند',
    color: 'text-gray-500',
    bgColor: 'bg-gray-500/10'
  }
};

export function FileAnalysisCard({
  dataType,
  extractedFields,
  missingFields = [],
  onConfirm,
  onCancel,
  onRequestInfo,
  isLoading = false,
  className
}: FileAnalysisCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    extractedFields.forEach(f => {
      initial[f.key] = f.value;
    });
    return initial;
  });

  const config = TYPE_CONFIG[dataType];
  const Icon = config.icon;

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues(prev => ({ ...prev, [key]: value }));
  };

  const handleConfirm = () => {
    onConfirm(fieldValues);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border border-border/50 overflow-hidden',
        'bg-card/80 backdrop-blur-sm',
        className
      )}
    >
      {/* Header */}
      <div className={cn('flex items-center gap-3 p-4', config.bgColor)}>
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          <Icon className={cn('h-5 w-5', config.color)} />
        </div>
        <div>
          <h4 className="font-semibold text-foreground">{config.title}</h4>
          <p className="text-xs text-muted-foreground">
            اطلاعات استخراج شده از فایل
          </p>
        </div>
      </div>

      {/* Fields */}
      <div className="p-4 space-y-3">
        {extractedFields.map((field) => (
          <div key={field.key} className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground min-w-[80px]">
              {field.label}:
            </span>
            
            {editingField === field.key ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={fieldValues[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setEditingField(null)}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex items-center gap-2">
                <span className="text-sm text-foreground flex-1">
                  {fieldValues[field.key] || (
                    <span className="text-muted-foreground italic">خالی</span>
                  )}
                </span>
                {field.editable !== false && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-50 hover:opacity-100"
                    onClick={() => setEditingField(field.key)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
            
            {field.required && !fieldValues[field.key] && (
              <Badge variant="destructive" className="text-xs">
                الزامی
              </Badge>
            )}
          </div>
        ))}

        {/* Missing Fields Warning */}
        {missingFields.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <p className="text-sm text-warning font-medium mb-2">
              ⚠️ اطلاعات ناقص:
            </p>
            <div className="flex flex-wrap gap-2">
              {missingFields.map((field) => (
                <Button
                  key={field}
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => onRequestInfo?.(field)}
                >
                  {field}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 p-4 border-t border-border/50 bg-muted/30">
        <Button
          onClick={handleConfirm}
          disabled={isLoading}
          className="flex-1 gap-2"
        >
          <Check className="h-4 w-4" />
          ذخیره
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
