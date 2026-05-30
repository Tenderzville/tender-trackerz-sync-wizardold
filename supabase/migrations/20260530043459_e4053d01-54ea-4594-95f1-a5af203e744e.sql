
CREATE TABLE public.user_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'webhook',
  webhook_url text NOT NULL,
  api_key text,
  events text[] NOT NULL DEFAULT ARRAY['tender.matched']::text[],
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz,
  last_status text,
  last_error text,
  delivery_count integer NOT NULL DEFAULT 0,
  failure_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own integrations"
  ON public.user_integrations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own integrations"
  ON public.user_integrations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own integrations"
  ON public.user_integrations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete own integrations"
  ON public.user_integrations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE TRIGGER user_integrations_updated_at
  BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_integrations_user ON public.user_integrations(user_id) WHERE is_active = true;
