-- Create table for managing webhook ingestion secrets (Browse AI, n8n, etc.)
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  source text NOT NULL,
  secret text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_received_at timestamp with time zone,
  total_received integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage webhook endpoints"
  ON public.webhook_endpoints FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Log inbound webhook payloads for debugging/audit
CREATE TABLE IF NOT EXISTS public.webhook_ingestion_log (
  id bigserial PRIMARY KEY,
  source text NOT NULL,
  endpoint_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE SET NULL,
  payload jsonb,
  status text NOT NULL DEFAULT 'received',
  items_processed integer DEFAULT 0,
  items_saved integer DEFAULT 0,
  error_message text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_ingestion_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view webhook logs"
  ON public.webhook_ingestion_log FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Outbound n8n webhook configuration (Lovable -> n8n)
CREATE TABLE IF NOT EXISTS public.outbound_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  event_types text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamp with time zone,
  total_sent integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.outbound_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage outbound webhooks"
  ON public.outbound_webhooks FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Backfill: clear suspicious budget values (≤ 50,000 KES treated as fee, not budget)
UPDATE public.tenders
SET budget_estimate = NULL
WHERE budget_estimate IS NOT NULL AND budget_estimate <= 50000;