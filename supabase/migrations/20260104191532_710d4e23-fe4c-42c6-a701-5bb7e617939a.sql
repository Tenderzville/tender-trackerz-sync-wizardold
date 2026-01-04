-- Create historical_tender_awards table for past award data analysis (NO FAKE DATA)
CREATE TABLE public.historical_tender_awards (
  id SERIAL PRIMARY KEY,
  tender_number VARCHAR(255),
  title TEXT NOT NULL,
  organization VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  location VARCHAR(100),
  original_budget BIGINT,
  awarded_amount BIGINT,
  winner_name VARCHAR(255),
  winner_type VARCHAR(50), -- 'sme', 'large_enterprise', 'consortium', 'youth', 'women', 'pwd'
  bid_count INTEGER DEFAULT 1,
  award_date DATE,
  tender_type VARCHAR(50), -- 'open', 'restricted', 'direct', 'framework'
  procurement_method VARCHAR(100),
  source_url TEXT,
  scraped_from VARCHAR(100), -- 'egp_kenya', 'ppra', 'kenya_gazette', 'mygov'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Analytics fields (computed from real data)
  price_to_budget_ratio NUMERIC(5,4),
  competition_level VARCHAR(20)
);

-- Enable RLS
ALTER TABLE public.historical_tender_awards ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read historical data (it's public procurement info)
CREATE POLICY "Anyone can view historical awards"
  ON public.historical_tender_awards
  FOR SELECT
  USING (true);

-- Only admins can manage historical data
CREATE POLICY "Admins can manage historical awards"
  ON public.historical_tender_awards
  FOR ALL
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Create indexes for efficient querying
CREATE INDEX idx_historical_awards_category ON public.historical_tender_awards(category);
CREATE INDEX idx_historical_awards_organization ON public.historical_tender_awards(organization);
CREATE INDEX idx_historical_awards_location ON public.historical_tender_awards(location);
CREATE INDEX idx_historical_awards_award_date ON public.historical_tender_awards(award_date);
CREATE INDEX idx_historical_awards_tender_number ON public.historical_tender_awards(tender_number);

-- Unique constraint to prevent duplicate awards
CREATE UNIQUE INDEX idx_historical_awards_unique 
  ON public.historical_tender_awards(tender_number, organization) 
  WHERE tender_number IS NOT NULL;

-- Add updated_at trigger
CREATE TRIGGER update_historical_awards_updated_at
  BEFORE UPDATE ON public.historical_tender_awards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();