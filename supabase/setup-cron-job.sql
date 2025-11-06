-- Automated Tender Scraper Cron Job Setup
-- This script sets up a daily cron job to automatically scrape tenders
-- Run this using: supabase db execute -f supabase/setup-cron-job.sql

-- Schedule: Every day at 2 AM (02:00:00)
-- Adjust the schedule as needed using cron syntax

SELECT cron.schedule(
  'automated-tender-scraper',
  '0 2 * * *', -- Every day at 2 AM
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/automated-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"scheduled": true, "source": "cron"}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'automated-tender-scraper';

-- To unschedule this job in the future, run:
-- SELECT cron.unschedule('automated-tender-scraper');
