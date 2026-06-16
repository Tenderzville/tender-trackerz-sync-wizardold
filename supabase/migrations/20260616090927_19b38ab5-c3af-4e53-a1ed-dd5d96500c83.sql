ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS linkedin_posted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_tenders_linkedin_posted_at ON public.tenders (linkedin_posted_at);