
-- 1. consortium_members: tighten SELECT
DROP POLICY IF EXISTS "Authenticated view consortium members" ON public.consortium_members;
CREATE POLICY "Members and creator view consortium members"
ON public.consortium_members FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR auth.uid() IN (SELECT created_by FROM public.consortiums WHERE id = consortium_id)
  OR auth.uid() IN (SELECT cm.user_id FROM public.consortium_members cm WHERE cm.consortium_id = consortium_members.consortium_id)
);

-- 2. version_tracking: tenders -> admin only
DROP POLICY IF EXISTS "View version tracking for own entities" ON public.version_tracking;
CREATE POLICY "View version tracking for own entities"
ON public.version_tracking FOR SELECT TO authenticated
USING (
  CASE entity_type
    WHEN 'tender'::text THEN public.has_role(auth.uid(), 'admin'::app_role)
    WHEN 'rfq'::text THEN auth.uid() IN (SELECT rfqs.user_id FROM rfqs WHERE rfqs.id = version_tracking.entity_id)
    WHEN 'profile'::text THEN (auth.uid())::text = (entity_id)::text
    WHEN 'quote'::text THEN auth.uid() IN (SELECT rfq_quotes.supplier_id FROM rfq_quotes WHERE rfq_quotes.id = version_tracking.entity_id)
    WHEN 'consortium'::text THEN auth.uid() IN (SELECT consortiums.created_by FROM consortiums WHERE consortiums.id = version_tracking.entity_id)
    ELSE false
  END
);

-- 3. RFQ financier columns: revoke SELECT, expose via SECURITY DEFINER function
REVOKE SELECT (financier_name, financier_contact, financier_details) ON public.rfqs FROM anon, authenticated;
REVOKE SELECT (financier_name, financier_contact, financier_details) ON public.rfq_quotes FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_rfq_financier(_rfq_id integer)
RETURNS TABLE(financier_name text, financier_contact text, financier_details text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.financier_name, r.financier_contact, r.financier_details
  FROM public.rfqs r
  WHERE r.id = _rfq_id AND r.user_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_rfq_financier(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rfq_financier(integer) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_quote_financier(_quote_id integer)
RETURNS TABLE(financier_name text, financier_contact text, financier_details text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT q.financier_name, q.financier_contact, q.financier_details
  FROM public.rfq_quotes q
  WHERE q.id = _quote_id AND q.supplier_id = auth.uid();
$$;
REVOKE EXECUTE ON FUNCTION public.get_quote_financier(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_quote_financier(integer) TO authenticated;

-- 4. user_integrations: hide api_key from regular SELECT
REVOKE SELECT (api_key) ON public.user_integrations FROM anon, authenticated;

-- 5. Restrict EXECUTE on SECURITY DEFINER helper/trigger functions
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_entries() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_audit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_founding_members_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_founding_members_count() TO authenticated;
