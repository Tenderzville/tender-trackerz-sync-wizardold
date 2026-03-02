
-- 1. Add consortium member document/certificate fields
ALTER TABLE public.consortium_members 
  ADD COLUMN IF NOT EXISTS document_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certificate_names text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS certificate_expiry_dates date[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS contribution_details text;

-- 2. Update handle_new_user trigger to store business_type from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, company, business_type)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$;

-- 3. Fix remaining broken tender source URLs
UPDATE public.tenders 
SET source_url = 'https://tenders.go.ke/website/tender/search?keyword=' || tender_number
WHERE (source_url IS NULL OR source_url LIKE '%/detail/%' OR source_url IN ('https://tenders.go.ke/', 'https://tenders.go.ke', 'https://egpkenya.go.ke'))
  AND tender_number IS NOT NULL;
