CREATE OR REPLACE FUNCTION public.tender_dedup_key(_source_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _source_url IS NULL OR btrim(_source_url) = '' THEN NULL
    ELSE lower(regexp_replace(regexp_replace(split_part(split_part(btrim(_source_url), '#', 1), '?', 1), '^http://', 'https://'), '/+$', ''))
  END
$$;