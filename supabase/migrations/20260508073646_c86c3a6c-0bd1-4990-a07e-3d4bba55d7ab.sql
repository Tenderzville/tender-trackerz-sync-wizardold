CREATE OR REPLACE FUNCTION public.enforce_tender_supplier_prep_window()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline IS NOT NULL
     AND NEW.deadline < (CURRENT_DATE + 14)
     AND COALESCE(NEW.status, 'active') = 'active' THEN
    NEW.status := 'short_window';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_tender_supplier_prep_window_trigger ON public.tenders;
CREATE TRIGGER enforce_tender_supplier_prep_window_trigger
BEFORE INSERT OR UPDATE OF deadline, status ON public.tenders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_tender_supplier_prep_window();

UPDATE public.tenders
SET status = 'short_window', updated_at = now()
WHERE status = 'active'
  AND deadline < (CURRENT_DATE + 14);