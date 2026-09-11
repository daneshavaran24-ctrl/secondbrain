-- Create succession_talent_pool table
CREATE TABLE IF NOT EXISTS public.succession_talent_pool (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL,
  employee_name text NOT NULL,
  employee_id text,
  current_position text,
  target_position_id uuid,
  readiness_level text NOT NULL DEFAULT 'not_ready',
  skills text[] DEFAULT '{}',
  performance_rating integer DEFAULT 3,
  potential_rating integer DEFAULT 3,
  development_needs text,
  career_aspirations text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.succession_talent_pool ENABLE ROW LEVEL SECURITY;

-- Create policies for succession_talent_pool
CREATE POLICY "Users can manage talent pool of their organization" 
ON public.succession_talent_pool 
FOR ALL 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  )
);

CREATE POLICY "Users can view talent pool of their organization" 
ON public.succession_talent_pool 
FOR SELECT 
USING (
  organization_id IN (
    SELECT organization_id 
    FROM user_profiles 
    WHERE user_id = auth.uid() 
    AND organization_id IS NOT NULL
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_succession_talent_pool_updated_at
BEFORE UPDATE ON public.succession_talent_pool
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();