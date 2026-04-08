
-- Add financier/sub-contractor fields to rfqs table
ALTER TABLE public.rfqs 
  ADD COLUMN IF NOT EXISTS financier_name text,
  ADD COLUMN IF NOT EXISTS financier_contact text,
  ADD COLUMN IF NOT EXISTS financier_details text,
  ADD COLUMN IF NOT EXISTS sub_contractors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS allow_interest_visibility boolean DEFAULT false;

-- Add financier/sub-contractor fields to rfq_quotes table  
ALTER TABLE public.rfq_quotes
  ADD COLUMN IF NOT EXISTS financier_name text,
  ADD COLUMN IF NOT EXISTS financier_contact text,
  ADD COLUMN IF NOT EXISTS financier_details text,
  ADD COLUMN IF NOT EXISTS sub_contractors jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS show_interest_publicly boolean DEFAULT false;
