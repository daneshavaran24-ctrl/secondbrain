-- Add revenue and monetization fields to ideas table
ALTER TABLE public.ideas 
ADD COLUMN IF NOT EXISTS revenue_models jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS market_size numeric,
ADD COLUMN IF NOT EXISTS target_customers text,
ADD COLUMN IF NOT EXISTS pricing_strategy text,
ADD COLUMN IF NOT EXISTS monthly_revenue_projection numeric,
ADD COLUMN IF NOT EXISTS break_even_months integer,
ADD COLUMN IF NOT EXISTS customer_acquisition_cost numeric,
ADD COLUMN IF NOT EXISTS customer_lifetime_value numeric,
ADD COLUMN IF NOT EXISTS business_model_canvas jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS monetization_strategies jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS financial_projections jsonb DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN public.ideas.revenue_models IS 'Array of revenue model objects with type, description, and potential';
COMMENT ON COLUMN public.ideas.market_size IS 'Total addressable market size in local currency';
COMMENT ON COLUMN public.ideas.target_customers IS 'Description of target customer segments';
COMMENT ON COLUMN public.ideas.pricing_strategy IS 'Pricing strategy and rationale';
COMMENT ON COLUMN public.ideas.monthly_revenue_projection IS 'Projected monthly revenue';
COMMENT ON COLUMN public.ideas.break_even_months IS 'Estimated months to break-even point';
COMMENT ON COLUMN public.ideas.customer_acquisition_cost IS 'Cost to acquire one customer';
COMMENT ON COLUMN public.ideas.customer_lifetime_value IS 'Lifetime value of one customer';
COMMENT ON COLUMN public.ideas.business_model_canvas IS 'Business Model Canvas with 9 key components';
COMMENT ON COLUMN public.ideas.monetization_strategies IS 'Array of monetization strategy objects';
COMMENT ON COLUMN public.ideas.financial_projections IS 'Detailed financial projections and metrics';