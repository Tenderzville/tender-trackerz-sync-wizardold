UPDATE public.tenders
SET budget_estimate = NULL,
    updated_at = now()
WHERE scraped_from = 'tenders.go.ke'
  AND budget_estimate IS NOT NULL;
