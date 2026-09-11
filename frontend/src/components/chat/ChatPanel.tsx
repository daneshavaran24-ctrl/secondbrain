import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { PollDialog } from './PollDialog';
import { supabase } from '@/integrations/supabase/client';
const sb: any = supabase as any;

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  taskTitle: string;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ open, onOpenChange, channelId, taskTitle }) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data: { user } } = await sb.auth.getUser();
      if (!isMounted || !user) return;
      userIdRef.current = user.id;

      // Update last_read_at when opening
      await sb
        .from('channel_members' as any)
        .update({ last_read_at: new Date().toISOString() } as any)
        .eq('channel_id', channelId)
        .eq('user_id', user.id);

      // Presence for typing indicators
      const room = sb.channel(`room:chat:${channelId}`, {
        config: { presence: { key: user.id } },
      } as any);

      room
        .on('presence', { event: 'sync' }, () => {
          const state = room.presenceState() as any;
          const active = Object.values(state as any)
            .flat()
            .filter((p: any) => p.typing)
            .map((p: any) => p.name || 'کاربر');
          setTypingUsers(active);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await room.track({ typing: false, name: (user as any).user_metadata?.display_name || user.email });
          }
        });

      presenceChannelRef.current = room;
    })();

    return () => {
      isMounted = false;
      if (presenceChannelRef.current) sb.removeChannel(presenceChannelRef.current);
    };
  }, [channelId]);

  const handleTyping = async (active: boolean) => {
    const ch = presenceChannelRef.current;
    if (!ch) return;
    await ch.track({ typing: active });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col h-full w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>گفتگو - {taskTitle}</SheetTitle>
          <SheetDescription>گفتگوی خصوصی این وظیفه با اعضای درگیر</SheetDescription>
        </SheetHeader>

        <div className="flex items-center justify-between py-2 gap-2">
          <PollDialog channelId={channelId} />
        </div>

        <div className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-2">
            <MessageList channelId={channelId} />
          </ScrollArea>
        </div>

        {typingUsers.length > 0 && (
          <div className="text-xs text-muted-foreground py-1">
            {typingUsers.join('، ')} در حال تایپ...
          </div>
        )}

        <div className="pt-2 border-t">
          <MessageInput channelId={channelId} onTyping={handleTyping} />
        </div>
      </SheetContent>
    </Sheet>
  );
};
