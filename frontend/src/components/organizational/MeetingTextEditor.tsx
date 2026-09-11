import React, { useState } from 'react';
import { FileText, Save, Download, Wand2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { useToast } from '@/hooks/use-toast';
import { meetingService } from '@/services/meetingService';
import { MeetingTemplateSelector } from '@/components/meetings/MeetingTemplateSelector';
import { MeetingMinutesTemplate } from '@/data/meetingMinutesTemplates';
import type { Meeting } from '@/types';

interface MeetingTextEditorProps {
  meeting: Meeting;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const MeetingTextEditor: React.FC<MeetingTextEditorProps> = ({
  meeting,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [minutesText, setMinutesText] = useState(meeting.minutes_text || '');
  const [showTemplateSelector, setShowTemplateSelector] = useState(!meeting.minutes_text);
  const [selectedTemplate, setSelectedTemplate] = useState<MeetingMinutesTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleTemplateSelect = (template: MeetingMinutesTemplate | null) => {
    if (template) {
      setMinutesText(template.content);
      setSelectedTemplate(template);
    }
    setShowTemplateSelector(false);
  };

  const handleChangeTemplate = () => {
    setShowTemplateSelector(true);
    setSelectedTemplate(null);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await meetingService.setMinutesText(meeting.id, minutesText);
      onUpdate();
      toast({
        title: 'موفقیت',
        description: 'متن صورت‌جلسه با موفقیت ذخیره شد'
      });
      onClose();
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ذخیره متن صورت‌جلسه',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtractResolutions = () => {
    const lines = minutesText.split('\n');
    let extractedResolutions = '';
    
    lines.forEach(line => {
      const lowerLine = line.toLowerCase();
      if (lowerLine.includes('مصوب') || lowerLine.includes('تصویب') || 
          lowerLine.includes('تصمیم') || lowerLine.includes('قرار')) {
        extractedResolutions += `• ${line.trim()}\n`;
      }
    });

    if (extractedResolutions) {
      const updatedText = minutesText + '\n\n--- مصوبات استخراج شده ---\n' + extractedResolutions;
      setMinutesText(updatedText);
      toast({
        title: 'موفقیت',
        description: 'مصوبات از متن استخراج شدند'
      });
    } else {
      toast({
        title: 'اطلاع',
        description: 'هیچ مصوبه‌ای در متن یافت نشد'
      });
    }
  };

  const getStatusBadge = (status: Meeting['minutes_status']) => {
    const variants = {
      draft: 'secondary',
      completed: 'default',
      approved: 'default'
    } as const;

    const labels = {
      draft: 'پیش‌نویس',
      completed: 'تکمیل شده',
      approved: 'تایید شده'
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      onOpenChange={onClose}
      title="ویرایش متن صورت‌جلسه"
      description={`ویرایش متن صورت‌جلسه: ${meeting.title}`}
    >
      <div className="space-y-4">
        {showTemplateSelector ? (
          <MeetingTemplateSelector onSelectTemplate={handleTemplateSelect} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">وضعیت:</span>
                {getStatusBadge(meeting.minutes_status)}
                {selectedTemplate && (
                  <Badge variant="outline" className="mr-2">
                    {selectedTemplate.icon} {selectedTemplate.name}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {selectedTemplate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleChangeTemplate}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    تغییر تمپلیت
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExtractResolutions}
                  className="flex items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  استخراج مصوبات
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <TextInputWithVoice
                id="minutes-text"
                value={minutesText}
                onChange={setMinutesText}
                type="textarea"
                placeholder="متن کامل صورت‌جلسه را وارد کنید..."
                rows={16}
                enableVoice={true}
                label="متن صورت‌جلسه"
                className="min-h-[400px] resize-none font-mono"
              />
            </div>
          </>
        )}

        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => meetingService.downloadMinutes(meeting.id)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            دانلود
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              انصراف
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'در حال ذخیره...' : 'ذخیره'}
            </Button>
          </div>
        </div>
      </div>
    </ResponsiveDialog>
  );
};