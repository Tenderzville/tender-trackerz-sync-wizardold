-- Retry security fixes with simpler approach to avoid deadlocks
-- Step 1: Drop old policies
DO $$ 
BEGIN
    -- Drop service providers policies
    DROP POLICY IF EXISTS "Authenticated users can view service providers" ON public.service_providers;
    DROP POLICY IF EXISTS "Anyone can view service providers" ON public.service_providers;
    
    -- Drop consortium policies  
    DROP POLICY IF EXISTS "Anyone can view consortiums" ON public.consortiums;
    DROP POLICY IF EXISTS "Authenticated users can view consortiums" ON public.consortiums;
END $$;

-- Step 2: Create new secure policies
CREATE POLICY "Auth users view service providers" 
ON public.service_providers 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Auth users view consortiums" 
ON public.consortiums 
FOR SELECT 
TO authenticated
USING (true);

-- Step 3: Create audit function if not exists
CREATE OR REPLACE FUNCTION public.log_security_audit()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.security_audit_log (
      user_id,
      table_name,
      record_id,
      action_type,
      ip_address
    ) VALUES (
      auth.uid(),
      TG_TABLE_NAME,
      COALESCE(NEW.id::text, OLD.id::text),
      TG_OP,
      inet_client_addr()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't block operation
    RAISE WARNING 'Security audit log failed: %', SQLERRM;
  END;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 4: Add triggers only if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'service_providers_audit_trigger') THEN
        CREATE TRIGGER service_providers_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON public.service_providers
          FOR EACH ROW EXECUTE FUNCTION public.log_security_audit();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'profiles_audit_trigger') THEN
        CREATE TRIGGER profiles_audit_trigger
          AFTER INSERT OR UPDATE OR DELETE ON public.profiles
          FOR EACH ROW EXECUTE FUNCTION public.log_security_audit();
    END IF;
END $$;