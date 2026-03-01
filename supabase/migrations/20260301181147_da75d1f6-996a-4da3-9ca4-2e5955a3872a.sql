-- Fix remaining broken source URLs
UPDATE public.tenders 
SET source_url = 'https://tenders.go.ke/website/tender/search?keyword=' || tender_number
WHERE source_url LIKE '%/detail/%'
  AND tender_number IS NOT NULL;

-- Create service provider advertisements table
CREATE TABLE public.service_provider_ads (
  id serial PRIMARY KEY,
  provider_id integer NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  ad_type text NOT NULL DEFAULT 'standard',
  amount numeric NOT NULL DEFAULT 1000,
  currency text NOT NULL DEFAULT 'KES',
  payment_reference text,
  payment_status text NOT NULL DEFAULT 'pending',
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.service_provider_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active ads" ON public.service_provider_ads
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own ads" ON public.service_provider_ads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ads" ON public.service_provider_ads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads" ON public.service_provider_ads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_service_provider_ads_updated_at
  BEFORE UPDATE ON public.service_provider_ads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();