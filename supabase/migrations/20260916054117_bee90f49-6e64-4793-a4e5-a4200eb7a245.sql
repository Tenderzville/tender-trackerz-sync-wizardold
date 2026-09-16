ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS linkedin_tag_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS linkedin_profile_url text,
  ADD COLUMN IF NOT EXISTS linkedin_tagged_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_optin
  ON public.profiles (linkedin_tag_opt_in, created_at)
  WHERE linkedin_tag_opt_in = true;