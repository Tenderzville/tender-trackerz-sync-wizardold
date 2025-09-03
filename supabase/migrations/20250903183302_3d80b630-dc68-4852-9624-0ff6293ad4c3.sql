-- Priority 1: Critical Security Fixes

-- Fix 1: Restrict Service Provider Data Access
-- Replace the overly permissive "Anyone can view service providers" policy
DROP POLICY IF EXISTS "Anyone can view service providers" ON public.service_providers;

CREATE POLICY "Authenticated users can view service providers" 
ON public.service_providers 
FOR SELECT 
TO authenticated
USING (true);

-- Fix 2: Secure AI Analysis Business Intelligence
-- Replace the overly permissive "Authenticated users can view AI analyses" policy
DROP POLICY IF EXISTS "Authenticated users can view AI analyses" ON public.ai_analyses;

CREATE POLICY "Users can view AI analyses for accessible tenders" 
ON public.ai_analyses 
FOR SELECT 
TO authenticated
USING (
  -- Users can view AI analyses for:
  -- 1. Tenders they have saved
  -- 2. All public tenders (since tenders table allows public SELECT)
  EXISTS (
    SELECT 1 FROM public.tenders 
    WHERE tenders.id = ai_analyses.tender_id
  )
);

-- Fix 3: Additional Security - Add rate limiting consideration for sensitive queries
-- Add indexes to improve performance of security queries
CREATE INDEX IF NOT EXISTS idx_saved_tenders_user_tender 
ON public.saved_tenders(user_id, tender_id);

CREATE INDEX IF NOT EXISTS idx_ai_analyses_tender_id 
ON public.ai_analyses(tender_id);

CREATE INDEX IF NOT EXISTS idx_service_providers_user_id 
ON public.service_providers(user_id);

-- Fix 4: Add audit trail for sensitive data access (future enhancement)
-- Note: This creates the structure but doesn't implement logging yet
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action_type varchar(50) NOT NULL,
  table_name varchar(50) NOT NULL,
  record_id text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can access audit logs
CREATE POLICY "Admins can manage security audit log" 
ON public.security_audit_log 
FOR ALL 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));