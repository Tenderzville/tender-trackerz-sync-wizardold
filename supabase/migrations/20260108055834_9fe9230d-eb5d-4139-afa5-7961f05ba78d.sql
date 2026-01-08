-- Purge unverifiable tenders (fake/generic source URLs without specific tender pages)
DELETE FROM ai_analyses WHERE tender_id IN (
  SELECT id FROM tenders 
  WHERE source_url IS NULL 
     OR source_url = '' 
     OR source_url = 'https://tenders.go.ke/'
     OR tender_number IS NULL
);

DELETE FROM saved_tenders WHERE tender_id IN (
  SELECT id FROM tenders 
  WHERE source_url IS NULL 
     OR source_url = '' 
     OR source_url = 'https://tenders.go.ke/'
     OR tender_number IS NULL
);

DELETE FROM tender_analytics WHERE tender_id IN (
  SELECT id FROM tenders 
  WHERE source_url IS NULL 
     OR source_url = '' 
     OR source_url = 'https://tenders.go.ke/'
     OR tender_number IS NULL
);

DELETE FROM tenders 
WHERE source_url IS NULL 
   OR source_url = '' 
   OR source_url = 'https://tenders.go.ke/'
   OR tender_number IS NULL;

-- Add comment explaining what happened
COMMENT ON TABLE tenders IS 'Only contains tenders with verifiable source_url and tender_number. Fake/unverifiable tenders were purged on 2026-01-08.';