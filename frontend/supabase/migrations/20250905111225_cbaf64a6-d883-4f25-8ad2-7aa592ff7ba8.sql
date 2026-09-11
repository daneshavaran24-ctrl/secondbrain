-- Create chat channels table
CREATE TABLE public.channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID,
  created_by UUID,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create channel members table
CREATE TABLE public.channel_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(channel_id, user_id)
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  rich JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  created_by UUID NOT NULL,
  channel_id UUID NOT NULL REFERENCES public.channels(id) ON DELETE CASCADE,
  anonymous BOOLEAN DEFAULT false,
  allow_multiple BOOLEAN DEFAULT false,
  closes_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(poll_id, option_id, user_id)
);

-- Enable RLS on all chat tables
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for channels
CREATE POLICY "Users can view channels they are members of" ON public.channels
  FOR SELECT USING (
    id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create channels" ON public.channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Channel creators can update their channels" ON public.channels
  FOR UPDATE USING (created_by = auth.uid());

-- RLS Policies for channel_members
CREATE POLICY "Users can view channel members of their channels" ON public.channel_members
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join channels" ON public.channel_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own membership" ON public.channel_members
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their channels" ON public.messages
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their channels" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    channel_id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (sender_id = auth.uid());

-- RLS Policies for polls
CREATE POLICY "Users can view polls in their channels" ON public.polls
  FOR SELECT USING (
    channel_id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create polls in their channels" ON public.polls
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    channel_id IN (
      SELECT channel_id FROM public.channel_members 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for poll_options
CREATE POLICY "Users can view poll options for accessible polls" ON public.poll_options
  FOR SELECT USING (
    poll_id IN (
      SELECT p.id FROM public.polls p
      JOIN public.channel_members cm ON p.channel_id = cm.channel_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Poll creators can insert options" ON public.poll_options
  FOR INSERT WITH CHECK (
    poll_id IN (
      SELECT id FROM public.polls WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for poll_votes
CREATE POLICY "Users can view votes for accessible polls" ON public.poll_votes
  FOR SELECT USING (
    poll_id IN (
      SELECT p.id FROM public.polls p
      JOIN public.channel_members cm ON p.channel_id = cm.channel_id
      WHERE cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can vote on accessible polls" ON public.poll_votes
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    poll_id IN (
      SELECT p.id FROM public.polls p
      JOIN public.channel_members cm ON p.channel_id = cm.channel_id
      WHERE cm.user_id = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_channel_members_channel_user ON public.channel_members(channel_id, user_id);
CREATE INDEX idx_messages_channel_created ON public.messages(channel_id, created_at DESC);
CREATE INDEX idx_polls_channel ON public.polls(channel_id);
CREATE INDEX idx_poll_options_poll ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_user ON public.poll_votes(poll_id, user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_channels_updated_at
  BEFORE UPDATE ON public.channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat tables
ALTER TABLE public.channels REPLICA IDENTITY FULL;
ALTER TABLE public.channel_members REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.polls REPLICA IDENTITY FULL;
ALTER TABLE public.poll_options REPLICA IDENTITY FULL;
ALTER TABLE public.poll_votes REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.channels;
ALTER PUBLICATION supabase_realtime ADD TABLE public.channel_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_options;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;