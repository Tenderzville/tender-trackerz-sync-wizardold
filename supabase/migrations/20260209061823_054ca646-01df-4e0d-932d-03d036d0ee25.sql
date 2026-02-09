-- Update existing tenders to have specific source URLs using tender_number
UPDATE public.tenders
SET source_url = CASE
  WHEN scraped_from = 'egpkenya' AND tender_number IS NOT NULL 
    THEN 'https://tenders.go.ke/website/tender/search/item/detail/' || tender_number
  WHEN scraped_from = 'mygov' AND tender_number IS NOT NULL 
    THEN 'https://www.mygov.go.ke/?s=' || encode(convert_to(tender_number, 'UTF8'), 'escape')
  WHEN scraped_from = 'ppra' AND tender_number IS NOT NULL 
    THEN 'https://ppra.go.ke/?s=' || encode(convert_to(tender_number, 'UTF8'), 'escape')
  ELSE source_url
END
WHERE tender_number IS NOT NULL 
  AND (source_url IS NULL OR source_url IN ('https://tenders.go.ke/', 'https://tenders.go.ke', 'https://egpkenya.go.ke', 'https://www.mygov.go.ke', 'https://ppra.go.ke'));