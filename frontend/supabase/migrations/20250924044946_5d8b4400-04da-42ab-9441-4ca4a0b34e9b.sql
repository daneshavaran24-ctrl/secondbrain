-- Create health metrics table for daily health tracking
CREATE TABLE public.health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  energy_level INTEGER NOT NULL DEFAULT 0 CHECK (energy_level >= 0 AND energy_level <= 100),
  focus_level INTEGER NOT NULL DEFAULT 0 CHECK (focus_level >= 0 AND focus_level <= 100),
  stress_level INTEGER NOT NULL DEFAULT 0 CHECK (stress_level >= 0 AND stress_level <= 100),
  sleep_quality INTEGER NOT NULL DEFAULT 0 CHECK (sleep_quality >= 0 AND sleep_quality <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create health activities table for tracking daily activities
CREATE TABLE public.health_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TIME NOT NULL,
  activity TEXT NOT NULL,
  energy_level TEXT NOT NULL CHECK (energy_level IN ('بالا', 'متوسط', 'پایین')),
  focus_percentage INTEGER NOT NULL DEFAULT 0 CHECK (focus_percentage >= 0 AND focus_percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_activities ENABLE ROW LEVEL SECURITY;

-- Create policies for health_metrics
CREATE POLICY "Users can view their own health metrics" 
ON public.health_metrics 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health metrics" 
ON public.health_metrics 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health metrics" 
ON public.health_metrics 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health metrics" 
ON public.health_metrics 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for health_activities
CREATE POLICY "Users can view their own health activities" 
ON public.health_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own health activities" 
ON public.health_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health activities" 
ON public.health_activities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own health activities" 
ON public.health_activities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_health_metrics_updated_at
  BEFORE UPDATE ON public.health_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_activities_updated_at
  BEFORE UPDATE ON public.health_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();