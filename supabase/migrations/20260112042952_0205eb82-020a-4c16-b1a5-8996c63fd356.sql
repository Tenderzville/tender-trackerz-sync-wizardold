-- Add founding member tracking columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_founding_member BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS founding_member_granted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS founding_member_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS company_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS paystack_customer_code TEXT,
ADD COLUMN IF NOT EXISTS paystack_subscription_code TEXT,
ADD COLUMN IF NOT EXISTS subscription_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_reason TEXT;

-- Create index for founding member queries
CREATE INDEX IF NOT EXISTS idx_profiles_founding_member ON public.profiles(is_founding_member) WHERE is_founding_member = true;

-- Create subscription history table for audit trail
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_plan TEXT,
  to_plan TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'KES',
  payment_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB
);

-- Enable RLS on subscription_history
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription history
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
FOR SELECT USING (auth.uid() = user_id);

-- Create founding_members_count function for quick count
CREATE OR REPLACE FUNCTION public.get_founding_members_count()
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::integer FROM profiles WHERE is_founding_member = true;
$$;