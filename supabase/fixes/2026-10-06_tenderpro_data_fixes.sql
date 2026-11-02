-- TenderPro data fixes, 6 Oct 2026
-- Run in the Supabase SQL editor (NOT a migration: review the preview counts first).
-- All fixes are idempotent and only touch rows that match the old bugs.
-- Preview counts on 7 Oct 2026: A = 1,673 rows, B = 9 rows, C = 428 rows.

-- ---------------------------------------------------------------
-- PREVIEW (run these first)
-- ---------------------------------------------------------------
-- A) AI estimates that were invented (the old KES 1,000,000 fallback x 0.8 / 1.2)
SELECT count(*) AS fake_estimates
FROM public.ai_analyses a
JOIN public.tenders t ON t.id = a.tender_id
WHERE (t.budget_estimate IS NULL OR t.budget_estimate = 0)
  AND a.estimated_value_min = 800000
  AND a.estimated_value_max = 1200000;

-- B) Transport / cargo tenders mislabelled "Consultancy"
SELECT id, title, category
FROM public.tenders
WHERE category = 'Consultancy'
  AND title ~* '\m(transport|clearing|forwarding|cargo|freight|haulage|logistics|courier|shipping)\M'
  AND title !~* '(consult|advisory|feasibility|\mstudy\M)';

-- ---------------------------------------------------------------
-- FIX A: clear invented estimates (the app now shows "No budget published")
-- ---------------------------------------------------------------
UPDATE public.ai_analyses a
SET estimated_value_min = NULL,
    estimated_value_max = NULL,
    confidence_score    = NULL
FROM public.tenders t
WHERE t.id = a.tender_id
  AND (t.budget_estimate IS NULL OR t.budget_estimate = 0)
  AND a.estimated_value_min = 800000
  AND a.estimated_value_max = 1200000;

-- ---------------------------------------------------------------
-- FIX B: re-label mis-categorised transport tenders
-- ---------------------------------------------------------------
UPDATE public.tenders
SET category = 'Transport'
WHERE category = 'Consultancy'
  AND title ~* '\m(transport|clearing|forwarding|cargo|freight|haulage|logistics|courier|shipping)\M'
  AND title !~* '(consult|advisory|feasibility|\mstudy\M)';

-- ---------------------------------------------------------------
-- FIX C (optional): expired tenders still marked active
-- 428 tenders have status = 'active' but a deadline in the past. The patched
-- Browse page and dashboard already ignore them (they filter on deadline), but
-- alerts, Telegram or any other code that reads status = 'active' would not.
-- ---------------------------------------------------------------
-- PREVIEW
SELECT count(*) AS active_but_expired
FROM public.tenders
WHERE status = 'active' AND deadline < current_date;

UPDATE public.tenders
SET status = 'expired'
WHERE status = 'active'
  AND deadline < current_date;
