-- Create gratitude_entries table for daily gratitude journaling
CREATE TABLE public.gratitude_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  gratitude_item_1 TEXT NOT NULL,
  gratitude_item_2 TEXT,
  gratitude_item_3 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE public.gratitude_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own gratitude entries" 
ON public.gratitude_entries 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own gratitude entries" 
ON public.gratitude_entries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gratitude entries" 
ON public.gratitude_entries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own gratitude entries" 
ON public.gratitude_entries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_gratitude_entries_updated_at
BEFORE UPDATE ON public.gratitude_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();