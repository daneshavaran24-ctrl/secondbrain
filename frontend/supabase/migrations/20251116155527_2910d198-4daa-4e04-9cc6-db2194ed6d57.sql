-- ایجاد جدول تحلیل مالی
CREATE TABLE IF NOT EXISTS public.idea_financial_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE UNIQUE,
  
  -- سرمایه اولیه
  initial_capital_min NUMERIC,
  initial_capital_max NUMERIC,
  initial_capital_currency TEXT DEFAULT 'تومان',
  
  -- هزینه‌های عملیاتی ماهانه
  monthly_operational_costs JSONB,
  
  -- پیش‌بینی درآمد
  revenue_forecast JSONB,
  
  -- نقطه سربه‌سر
  break_even_month INTEGER,
  break_even_analysis TEXT,
  
  -- ROI
  roi_percentage NUMERIC,
  roi_timeline TEXT,
  
  -- نسبت‌های مالی کلیدی
  profit_margin_percentage NUMERIC,
  cash_flow_analysis TEXT,
  
  -- یادداشت‌های اضافی
  financial_notes TEXT,
  assumptions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies برای idea_financial_analysis
ALTER TABLE public.idea_financial_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own idea financial analysis"
  ON public.idea_financial_analysis FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can insert their own idea financial analysis"
  ON public.idea_financial_analysis FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can update their own idea financial analysis"
  ON public.idea_financial_analysis FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can delete their own idea financial analysis"
  ON public.idea_financial_analysis FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

-- ایجاد جدول استراتژی
CREATE TABLE IF NOT EXISTS public.idea_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE UNIQUE,
  
  -- استراتژی بازاریابی
  marketing_strategy JSONB,
  target_audience TEXT,
  positioning_statement TEXT,
  
  -- استراتژی رشد
  growth_strategy TEXT,
  scaling_plan JSONB,
  expansion_markets TEXT[],
  
  -- استراتژی رقابتی
  competitive_strategy TEXT,
  competitive_advantage TEXT[],
  differentiation_points TEXT[],
  
  -- استراتژی محصول
  product_roadmap JSONB,
  innovation_approach TEXT,
  technology_stack TEXT[],
  
  -- استراتژی عملیاتی
  operational_strategy TEXT,
  key_processes TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies برای idea_strategy
ALTER TABLE public.idea_strategy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own idea strategy"
  ON public.idea_strategy FOR SELECT
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can insert their own idea strategy"
  ON public.idea_strategy FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can update their own idea strategy"
  ON public.idea_strategy FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

CREATE POLICY "Users can delete their own idea strategy"
  ON public.idea_strategy FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM public.ideas WHERE id = idea_id));

-- Trigger برای updated_at
CREATE TRIGGER update_idea_financial_analysis_updated_at
  BEFORE UPDATE ON public.idea_financial_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_idea_strategy_updated_at
  BEFORE UPDATE ON public.idea_strategy
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();