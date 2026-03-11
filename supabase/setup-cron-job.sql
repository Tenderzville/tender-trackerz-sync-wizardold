-- Automated Tender Scraper Cron Job Setup
-- Runs TWICE daily: 8 AM EAT (5 AM UTC) and 8 PM EAT (5 PM UTC)
-- This ensures fresh tenders are scraped and pushed to Telegram automatically.

-- First, remove old job if it exists
SELECT cron.unschedule('automated-tender-scraper');

-- Schedule morning run: 8 AM EAT = 5 AM UTC
SELECT cron.schedule(
  'automated-tender-scraper-morning',
  '0 5 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/automated-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"scheduled": true, "source": "cron", "run": "morning"}'::jsonb
    ) as request_id;
  $$
);

-- Schedule evening run: 8 PM EAT = 5 PM UTC
SELECT cron.schedule(
  'automated-tender-scraper-evening',
  '0 17 * * *',
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/automated-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"scheduled": true, "source": "cron", "run": "evening"}'::jsonb
    ) as request_id;
  $$
);

-- Verify cron jobs
SELECT * FROM cron.job WHERE jobname LIKE 'automated-tender-scraper%';
