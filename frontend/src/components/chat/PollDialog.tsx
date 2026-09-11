import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
const sb: any = supabase as any;

interface PollDialogProps {
  channelId: string;
}

export const PollDialog: React.FC<PollDialogProps> = ({ channelId }) => {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [anonymous, setAnonymous] = useState(false);
  const [allowMulti, setAllowMulti] = useState(false);
  const [saving, setSaving] = useState(false);

  const addOption = () => setOptions((prev) => [...prev, '']);
  const updateOption = (idx: number, value: string) => setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));

  const createPoll = async () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2) return;
    setSaving(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: poll, error } = await sb
      .from('polls' as any)
      .insert({ channel_id: channelId, question: question.trim(), anonymous, allow_multi: allowMulti, created_by: user.id } as any)
      .select('*')
      .single();

    if (!error && poll) {
      const rows = options
        .map((text, i) => text.trim())
        .filter(Boolean)
        .map((text, i) => ({ poll_id: poll.id, option_text: text, option_order: i }));
      await sb.from('poll_options' as any).insert(rows as any);

      // Announce in chat
      await sb.from('messages' as any).insert({
        channel_id: channelId,
        sender_id: user.id,
        body: `نظرسنجی ایجاد شد: ${question.trim()}`,
        rich: { poll_id: (poll as any).id },
      } as any);

      setOpen(false);
      setQuestion('');
      setOptions(['', '']);
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">ایجاد نظرسنجی</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ایجاد نظرسنجی</DialogTitle>
          <DialogDescription>سوال و گزینه‌ها را وارد کنید</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Input placeholder="سوال" value={question} onChange={(e) => setQuestion(e.target.value)} />
          <div className="space-y-2">
            {options.map((opt, idx) => (
              <Input key={idx} placeholder={`گزینه ${idx + 1}`} value={opt} onChange={(e) => updateOption(idx, e.target.value)} />
            ))}
            <Button variant="ghost" size="sm" onClick={addOption}>افزودن گزینه</Button>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} /> ناشناس
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={allowMulti} onChange={(e) => setAllowMulti(e.target.checked)} /> چندگزینه‌ای
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={createPoll} disabled={saving}>ایجاد</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
