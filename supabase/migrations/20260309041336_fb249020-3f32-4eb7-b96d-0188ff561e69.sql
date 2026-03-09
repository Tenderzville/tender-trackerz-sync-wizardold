
-- Rate limiting table for tracking API requests by IP/user
CREATE TABLE public.rate_limit_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  identifier text NOT NULL, -- IP address or user ID
  endpoint text NOT NULL,
  request_count integer NOT NULL DEFAULT 1,
  window_start timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_rate_limit_lookup ON public.rate_limit_entries (identifier, endpoint, window_start);

-- Auto-cleanup old entries (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_entries()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.rate_limit_entries WHERE window_start < now() - interval '1 hour';
$$;

-- Error monitoring / structured logging table
CREATE TABLE public.error_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  function_name text NOT NULL,
  error_message text NOT NULL,
  error_stack text,
  request_metadata jsonb DEFAULT '{}',
  severity text NOT NULL DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  user_id uuid,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_error_logs_function ON public.error_logs (function_name, created_at DESC);
CREATE INDEX idx_error_logs_severity ON public.error_logs (severity, created_at DESC);

-- RLS for both tables
ALTER TABLE public.rate_limit_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Rate limit: only service role can manage (edge functions use service role)
CREATE POLICY "Service role manages rate limits" ON public.rate_limit_entries
  FOR ALL USING (false) WITH CHECK (false);

-- Error logs: admins can view, service role inserts
CREATE POLICY "Admins can view error logs" ON public.error_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "No direct user writes to error logs" ON public.error_logs
  FOR INSERT WITH CHECK (false);
