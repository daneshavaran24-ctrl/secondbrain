-- Create AI chat sessions table
CREATE TABLE public.ai_chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  session_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI chat messages table
CREATE TABLE public.ai_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text'::text,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_chat_sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.ai_chat_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat sessions" 
ON public.ai_chat_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.ai_chat_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.ai_chat_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for ai_chat_messages
CREATE POLICY "Users can view messages in their sessions" 
ON public.ai_chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions 
  WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
  AND ai_chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can create messages in their sessions" 
ON public.ai_chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions 
  WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
  AND ai_chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can update messages in their sessions" 
ON public.ai_chat_messages 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions 
  WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
  AND ai_chat_sessions.user_id = auth.uid()
));

CREATE POLICY "Users can delete messages in their sessions" 
ON public.ai_chat_messages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.ai_chat_sessions 
  WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
  AND ai_chat_sessions.user_id = auth.uid()
));

-- Create indexes for performance
CREATE INDEX idx_ai_chat_sessions_user_id ON public.ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_type ON public.ai_chat_sessions(session_type);
CREATE INDEX idx_ai_chat_messages_session_id ON public.ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON public.ai_chat_messages(created_at);

-- Create trigger for updating updated_at column
CREATE TRIGGER update_ai_chat_sessions_updated_at
  BEFORE UPDATE ON public.ai_chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();