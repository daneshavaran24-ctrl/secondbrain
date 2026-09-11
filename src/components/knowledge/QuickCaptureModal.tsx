import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { Button } from '@/components/ui/button';
import { Brain, Sparkles } from 'lucide-react';
import { supabaseKnowledgeService } from '@/services/supabaseKnowledgeService';
import { useToast } from '@/hooks/use-toast';

interface QuickCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ open, onOpenChange }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setTitle('');
      setContent('');
      setSaving(false);
    }
  }, [open]);

  const save = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      await supabaseKnowledgeService.storeKnowledge(content, 'text', { title: title || undefined });
      toast({ title: 'ذخیره شد', description: 'یادداشت شما ذخیره شد.' });
      onOpenChange(false);
    } catch (e) {
      toast({ title: 'خطا', description: 'ذخیره‌سازی انجام نشد.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-primary text-right pr-8">
            <Brain className="h-5 w-5" />
            ثبت سریع دانش
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="عنوان (اختیاری)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-readable"
          />
          <TextInputWithVoice
            value={content}
            onChange={setContent}
            type="textarea"
            placeholder="ایده، نکته، یا لینک خود را بنویسید..."
            rows={6}
            enableVoice={true}
            className="input-readable"
          />
          <Button onClick={save} disabled={!content.trim() || saving} className="w-full">
            <Sparkles className="h-4 w-4 ml-2" />
            ذخیره کن
          </Button>
          <p className="text-xs text-muted-foreground text-center">میانبر: ⌘K یا Ctrl+K</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
