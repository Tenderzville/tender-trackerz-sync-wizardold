-- Create automation_logs table for tracking edge function executions
CREATE TABLE public.automation_logs (
  id SERIAL PRIMARY KEY,
  function_name VARCHAR NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',
  result_data JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage automation logs" 
ON public.automation_logs 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view automation logs" 
ON public.automation_logs 
FOR SELECT 
USING (true);

-- Create trigger function to update completion timestamp and duration
CREATE OR REPLACE FUNCTION public.update_automation_log_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status AND NEW.status IN ('completed', 'failed') THEN
    NEW.completed_at = now();
    NEW.duration_ms = EXTRACT(EPOCH FROM (now() - NEW.executed_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_automation_log_completion
  BEFORE UPDATE ON public.automation_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_automation_log_completion();