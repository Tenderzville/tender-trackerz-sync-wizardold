-- CRITICAL SECURITY FIXES
-- Priority 1: Fix data exposure vulnerabilities

-- 1. Fix profiles table - restrict to own profile only
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Fix AI analyses - restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view AI analyses" ON public.ai_analyses;
CREATE POLICY "Authenticated users can view AI analyses" 
ON public.ai_analyses 
FOR SELECT 
TO authenticated
USING (true);

-- 3. Fix automation logs - restrict to admins only
DROP POLICY IF EXISTS "Anyone can view automation logs" ON public.automation_logs;
CREATE POLICY "Only admins can view automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Fix tender analytics - keep public but ensure it's intentional
-- (This one stays public as it contains non-sensitive aggregated data)