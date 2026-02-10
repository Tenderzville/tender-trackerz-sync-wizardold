-- Fix source URLs that use the broken /detail/ format to use /search?keyword= format instead
UPDATE public.tenders 
SET source_url = 'https://tenders.go.ke/website/tender/search?keyword=' || tender_number
WHERE source_url LIKE '%/website/tender/search/item/detail/%'
  AND tender_number IS NOT NULL;