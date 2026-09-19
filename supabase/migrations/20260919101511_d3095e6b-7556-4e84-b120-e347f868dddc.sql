CREATE OR REPLACE FUNCTION public.tender_dedup_key(_source_url text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _source_url IS NULL OR btrim(_source_url) = '' THEN NULL
    ELSE lower(regexp_replace(regexp_replace(split_part(split_part(btrim(_source_url), '#', 1), '?', 1), '^http://', 'https://'), '/+$', ''))
  END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS tenders_dedup_key_unique
  ON public.tenders (public.tender_dedup_key(source_url))
  WHERE source_url IS NOT NULL AND btrim(source_url) <> '';

CREATE OR REPLACE FUNCTION public.reconcile_duplicate_tenders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed integer := 0;
BEGIN
  CREATE TEMP TABLE _dedup_map ON COMMIT DROP AS
  WITH normalized AS (
    SELECT id,
      row_number() OVER (
        PARTITION BY public.tender_dedup_key(source_url)
        ORDER BY (source_verified_at IS NOT NULL) DESC,
                 (tender_number IS NOT NULL AND btrim(tender_number) <> '') DESC,
                 (description IS NOT NULL AND length(description) > 100) DESC,
                 created_at ASC NULLS LAST, id ASC
      ) AS rn,
      first_value(id) OVER (
        PARTITION BY public.tender_dedup_key(source_url)
        ORDER BY (source_verified_at IS NOT NULL) DESC,
                 (tender_number IS NOT NULL AND btrim(tender_number) <> '') DESC,
                 (description IS NOT NULL AND length(description) > 100) DESC,
                 created_at ASC NULLS LAST, id ASC
      ) AS keep_id
    FROM public.tenders
    WHERE source_url IS NOT NULL AND btrim(source_url) <> ''
  )
  SELECT id AS duplicate_id, keep_id FROM normalized WHERE rn > 1;

  UPDATE public.tenders keeper
  SET telegram_notified_at = merged.telegram_notified_at,
      linkedin_posted_at = merged.linkedin_posted_at,
      source_verified_at = merged.source_verified_at
  FROM (
    SELECT m.keep_id,
      max(t.telegram_notified_at) AS telegram_notified_at,
      max(t.linkedin_posted_at) AS linkedin_posted_at,
      max(t.source_verified_at) AS source_verified_at
    FROM _dedup_map m
    JOIN public.tenders t ON t.id = m.duplicate_id OR t.id = m.keep_id
    GROUP BY m.keep_id
  ) merged
  WHERE keeper.id = merged.keep_id;

  DELETE FROM public.saved_tenders s USING _dedup_map m
  WHERE s.tender_id = m.duplicate_id
    AND EXISTS (SELECT 1 FROM public.saved_tenders k WHERE k.user_id = s.user_id AND k.tender_id = m.keep_id);
  UPDATE public.saved_tenders s SET tender_id = m.keep_id FROM _dedup_map m WHERE s.tender_id = m.duplicate_id;

  INSERT INTO public.ai_analyses (tender_id, estimated_value_min, estimated_value_max, win_probability, recommendations, confidence_score, analysis_data, model_version, created_at)
  SELECT DISTINCT ON (m.keep_id) m.keep_id, a.estimated_value_min, a.estimated_value_max, a.win_probability, a.recommendations, a.confidence_score, a.analysis_data, a.model_version, a.created_at
  FROM _dedup_map m
  JOIN public.ai_analyses a ON a.tender_id = m.duplicate_id
  WHERE NOT EXISTS (SELECT 1 FROM public.ai_analyses k WHERE k.tender_id = m.keep_id)
  ORDER BY m.keep_id, a.created_at DESC NULLS LAST;

  UPDATE public.tender_analytics kept
  SET views_count = COALESCE(kept.views_count,0) + COALESCE(d.views_count,0),
      saves_count = COALESCE(kept.saves_count,0) + COALESCE(d.saves_count,0),
      applications_count = COALESCE(kept.applications_count,0) + COALESCE(d.applications_count,0),
      last_viewed = GREATEST(kept.last_viewed, d.last_viewed)
  FROM (
    SELECT m.keep_id, sum(COALESCE(a.views_count,0)) views_count, sum(COALESCE(a.saves_count,0)) saves_count,
           sum(COALESCE(a.applications_count,0)) applications_count, max(a.last_viewed) last_viewed
    FROM _dedup_map m JOIN public.tender_analytics a ON a.tender_id = m.duplicate_id GROUP BY m.keep_id
  ) d
  WHERE kept.tender_id = d.keep_id;

  UPDATE public.consortiums c SET tender_id = m.keep_id FROM _dedup_map m WHERE c.tender_id = m.duplicate_id;
  UPDATE public.tender_posters p SET tender_id = m.keep_id FROM _dedup_map m WHERE p.tender_id = m.duplicate_id;
  UPDATE public.version_tracking v SET entity_id = m.keep_id FROM _dedup_map m WHERE lower(v.entity_type) IN ('tender','tenders') AND v.entity_id = m.duplicate_id;

  WITH del AS (
    DELETE FROM public.tenders t USING _dedup_map m WHERE t.id = m.duplicate_id RETURNING t.id
  )
  SELECT count(*) INTO removed FROM del;

  INSERT INTO public.automation_logs (function_name, status, result_data, executed_at, completed_at)
  VALUES ('reconcile-duplicate-tenders', 'completed', jsonb_build_object('duplicates_removed', removed), now(), now());

  DROP TABLE IF EXISTS _dedup_map;
  RETURN removed;
END;
$$;

REVOKE ALL ON FUNCTION public.reconcile_duplicate_tenders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reconcile_duplicate_tenders() TO service_role;