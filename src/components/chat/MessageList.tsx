import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
const sb: any = supabase as any;

interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  body: string | null;
  rich: any;
  attachments: Array<{ bucket?: string; path?: string; name?: string; type?: string; size?: number; url?: string }>;
  created_at: string;
}

interface MessageListProps {
  channelId: string;
}

export const MessageList: React.FC<MessageListProps> = ({ channelId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: { user } }, { data, error }] = await Promise.all([
        sb.auth.getUser(),
        sb
          .from('messages' as any)
          .select('*')
          .eq('channel_id', channelId)
          .is('deleted_at', null)
          .order('created_at', { ascending: true }),
      ]);
      if (user) setCurrentUserId(user.id);
      if (error) {
        console.error('load messages error', error);
        return;
      }
      setMessages((data as any) || []);
      scrollToBottom();
    };

    load();

    const channel = sb
      .channel('realtime:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `channel_id=eq.${channelId}` }, (payload: any) => {
        setMessages((prev) => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as any];
          if (payload.eventType === 'UPDATE') return prev.map((m) => (m.id === (payload.new as any).id ? (payload.new as any) : m));
          if (payload.eventType === 'DELETE') return prev.filter((m) => m.id !== (payload.old as any).id);
          return prev;
        });
        scrollToBottom();
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [channelId]);

  const isMine = (senderId: string) => currentUserId && senderId === currentUserId;

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const renderAttachments = (msg: Message) => {
    if (!msg.attachments || msg.attachments.length === 0) return null;
    return (
      <div className="mt-2 grid gap-2">
        {msg.attachments.map((att, idx) => (
          <AttachmentItem key={idx} att={att} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4 py-2">
      {messages.map((msg) => (
        <div key={msg.id} className={`flex ${isMine(msg.sender_id) ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[80%] rounded-lg p-3 shadow-sm ${isMine(msg.sender_id) ? 'bg-primary/10' : 'bg-muted/60'}`}>
            {msg.rich?.poll_id ? (
              <PollInline pollId={msg.rich.poll_id} />
            ) : (
              <div className="whitespace-pre-wrap break-words text-sm">{msg.body}</div>
            )}
            {renderAttachments(msg)}
            <div className="text-[10px] text-muted-foreground mt-1 text-left">
              {new Date(msg.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

const AttachmentItem: React.FC<{ att: any }> = ({ att }) => {
  const [url, setUrl] = useState<string | null>(att.url || null);

  useEffect(() => {
    (async () => {
      if (url || !att?.path) return;
      try {
        const { data, error } = await sb.storage.from(att.bucket || 'attachments').createSignedUrl(att.path, 60 * 60);
        if (!error) setUrl(data?.signedUrl || null);
      } catch (e) {
        console.warn('signed url error', e);
      }
    })();
  }, [att, url]);

  if (!att) return null;
  const name = att.name || 'file';
  const type = att.type || '';

  if (type.startsWith('image/')) {
    return <img src={url ?? ''} alt={name} className="rounded-md max-h-64" />;
  }
  return (
    <a href={url ?? '#'} target="_blank" rel="noreferrer" className="text-primary underline text-sm">
      {name}
    </a>
  );
};

const PollInline: React.FC<{ pollId: string }> = ({ pollId }) => {
  const [poll, setPoll] = useState<any>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [voting, setVoting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      setUserId(user?.id ?? null);
      const [{ data: p }, { data: opts }, { data: vts }] = await Promise.all([
        sb.from('polls' as any).select('*').eq('id', pollId).maybeSingle(),
        sb.from('poll_options' as any).select('*').eq('poll_id', pollId).order('option_order'),
        sb.from('poll_votes' as any).select('*').eq('poll_id', pollId),
      ]);
      setPoll(p as any);
      setOptions((opts as any) || []);
      const counts: Record<string, number> = {};
      (vts as any[] | undefined || []).forEach((v: any) => { counts[v.option_id] = (counts[v.option_id] || 0) + 1; });
      setVotes(counts);
    })();
  }, [pollId]);

  const canVote = useMemo(() => {
    if (!poll) return false;
    if (!poll.closes_at) return true;
    return new Date(poll.closes_at) > new Date();
  }, [poll]);

  const onVote = async (optionId: string) => {
    if (!canVote || !userId) return;
    setVoting(true);
    const { error } = await sb.from('poll_votes' as any).insert({ poll_id: pollId, option_id: optionId, user_id: userId });
    if (!error) {
      setVotes((prev) => ({ ...prev, [optionId]: (prev[optionId] || 0) + 1 }));
    }
    setVoting(false);
  };

  if (!poll) return null;

  return (
    <div>
      <div className="font-medium mb-2">نظرسنجی: {poll.question}</div>
      <div className="space-y-2">
        {options.map((opt) => (
          <div key={opt.id} className="flex items-center justify-between gap-2">
            <button
              disabled={!canVote || voting}
              onClick={() => onVote(opt.id)}
              className="px-2 py-1 rounded bg-primary/10 hover:bg-primary/20 transition"
            >
              {opt.option_text}
            </button>
            <Badge variant="secondary">{votes[opt.id] || 0}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
};
