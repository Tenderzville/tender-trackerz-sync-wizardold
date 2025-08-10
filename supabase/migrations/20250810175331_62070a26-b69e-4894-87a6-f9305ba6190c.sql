-- Fix linter warning: ensure stable search_path for trigger function
ALTER FUNCTION public.update_automation_log_completion()
  SET search_path TO public;