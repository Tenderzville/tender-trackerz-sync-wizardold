
-- 1) Tender source verification stamp
ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS source_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS source_status text NOT NULL DEFAULT 'unverified';
CREATE INDEX IF NOT EXISTS idx_tenders_source_status ON public.tenders(source_status);

-- 2) Web push subscriptions (FB/IG-style notifications)
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  UNIQUE (endpoint)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3) SECURITY FIXES

-- 3a) consortium_members: stop leaking PII to anon
DROP POLICY IF EXISTS "Anyone can view consortium members" ON public.consortium_members;
CREATE POLICY "Authenticated view consortium members"
  ON public.consortium_members FOR SELECT TO authenticated USING (true);

-- 3b) outbound_link_clicks: prevent attribution spoofing
DROP POLICY IF EXISTS "Anyone can log clicks" ON public.outbound_link_clicks;
CREATE POLICY "Anyone can log own clicks"
  ON public.outbound_link_clicks FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 3c) version_tracking: hide tender change history from anonymous
DROP POLICY IF EXISTS "Users can view version tracking for their entities" ON public.version_tracking;
CREATE POLICY "View version tracking for own entities"
  ON public.version_tracking FOR SELECT TO authenticated
  USING (
    CASE entity_type
      WHEN 'tender' THEN true
      WHEN 'rfq' THEN auth.uid() IN (SELECT user_id FROM public.rfqs WHERE id = version_tracking.entity_id)
      WHEN 'profile' THEN auth.uid()::text = entity_id::text
      WHEN 'quote' THEN auth.uid() IN (SELECT supplier_id FROM public.rfq_quotes WHERE id = version_tracking.entity_id)
      WHEN 'consortium' THEN auth.uid() IN (SELECT created_by FROM public.consortiums WHERE id = version_tracking.entity_id)
      ELSE false
    END
  );

-- 3d) service_providers: hide email/phone from the broad authenticated SELECT.
-- Public-facing reads now go through a view that excludes contact details.
DROP POLICY IF EXISTS "Auth users view service providers" ON public.service_providers;
CREATE POLICY "Owner or admin view full provider row"
  ON public.service_providers FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.service_providers_public
WITH (security_invoker = true) AS
SELECT id, user_id, name, specialization, description,
       profile_image, portfolio, certifications, availability,
       hourly_rate, rating, review_count, experience,
       website, linkedin, created_at, updated_at
FROM public.service_providers;
GRANT SELECT ON public.service_providers_public TO authenticated, anon;

-- 3e) user_integrations: stop returning api_key after creation
-- Revoke column-level SELECT on api_key from authenticated; service_role (used by dispatcher) keeps it.
REVOKE SELECT (api_key) ON public.user_integrations FROM authenticated;

-- 3f) webhook_endpoints: enforce that admins cannot read raw secret
-- Hash the secret in a separate column; raw column becomes write-only.
ALTER TABLE public.webhook_endpoints
  ADD COLUMN IF NOT EXISTS secret_hash text;
UPDATE public.webhook_endpoints
  SET secret_hash = encode(digest(secret, 'sha256'), 'hex')
  WHERE secret IS NOT NULL AND secret_hash IS NULL;
REVOKE SELECT (secret) ON public.webhook_endpoints FROM authenticated, anon;

-- 4) Lock down SECURITY DEFINER helpers so only the database itself / service role can call them.
-- RLS policies that invoke has_role() still work because policies bypass GRANT checks.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_founding_members_count() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_founding_members_count() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limit_entries() FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_entries() TO service_role;
