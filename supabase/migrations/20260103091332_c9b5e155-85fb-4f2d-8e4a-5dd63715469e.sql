-- Delete all synthetic tenders (cascade through related tables)
DELETE FROM saved_tenders WHERE tender_id IN (SELECT id FROM tenders WHERE scraped_from LIKE '%synthetic%');
DELETE FROM ai_analyses WHERE tender_id IN (SELECT id FROM tenders WHERE scraped_from LIKE '%synthetic%');
DELETE FROM tender_analytics WHERE tender_id IN (SELECT id FROM tenders WHERE scraped_from LIKE '%synthetic%');
DELETE FROM tenders WHERE scraped_from LIKE '%synthetic%';

-- Create user_preferences table for tender matching criteria
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sectors TEXT[] DEFAULT '{}',
  counties TEXT[] DEFAULT '{}',
  budget_min NUMERIC DEFAULT 0,
  budget_max NUMERIC DEFAULT NULL,
  keywords TEXT[] DEFAULT '{}',
  eligibility_types TEXT[] DEFAULT '{}',
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences" ON public.user_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();