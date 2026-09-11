import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TextInputWithVoice } from '@/components/ui/text-input-with-voice';
import { supabase } from '@/integrations/supabase/client';
const sb: any = supabase as any;

interface MessageInputProps {
  channelId: string;
  onTyping?: (active: boolean) => void;
  onSent?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({ channelId, onTyping, onSent }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const handleTyping = (value: string) => {
    setText(value);
    if (!onTyping) return;
    onTyping(true);
    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = window.setTimeout(() => onTyping(false), 1200);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
  };

  const uploadAttachments = async (): Promise<any[]> => {
    const uploaded: any[] = [];
    for (const file of files) {
      const path = `${channelId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await sb.storage.from('attachments').upload(path, file, { upsert: false, contentType: file.type } as any);
      if (!error) {
        uploaded.push({ bucket: 'attachments', path, name: file.name, type: file.type, size: file.size });
      }
    }
    return uploaded;
  };

  const send = async () => {
    if (!text.trim() && files.length === 0) return;
    setSending(true);
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      setSending(false);
      return;
    }
    const attachments = await uploadAttachments();
    const { error } = await sb.from('messages' as any).insert({
      channel_id: channelId,
      sender_id: user.id,
      body: text.trim() || null,
      attachments,
      rich: {},
    } as any);
    setSending(false);
    if (!error) {
      setText('');
      setFiles([]);
      if (onSent) onSent();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <TextInputWithVoice
        value={text}
        onChange={handleTyping}
        type="textarea"
        placeholder="پیام خود را بنویسید..."
        rows={3}
        enableVoice={true}
      />
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input type="file" multiple onChange={onFileChange} />
        </div>
        <Button onClick={send} disabled={sending}>
          ارسال
        </Button>
      </div>
    </div>
  );
};
