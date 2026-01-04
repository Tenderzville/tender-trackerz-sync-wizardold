-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule Firecrawl scraper to run twice daily (8 AM and 8 PM Kenya time = UTC+3)
SELECT cron.schedule(
  'automated-tender-scraper-morning',
  '0 5 * * *', -- 5 AM UTC = 8 AM EAT
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/firecrawl-tender-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"source": "all", "scheduled": true}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'automated-tender-scraper-evening',
  '0 17 * * *', -- 5 PM UTC = 8 PM EAT
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/firecrawl-tender-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"source": "all", "scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Schedule smart matching to run after each scraping (30 min later)
SELECT cron.schedule(
  'smart-tender-matching-morning',
  '30 5 * * *', -- 5:30 AM UTC = 8:30 AM EAT
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/smart-tender-matcher',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"action": "run-for-all-users"}'::jsonb
    ) as request_id;
  $$
);

SELECT cron.schedule(
  'smart-tender-matching-evening',
  '30 17 * * *', -- 5:30 PM UTC = 8:30 PM EAT
  $$
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/smart-tender-matcher',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
      body:='{"action": "run-for-all-users"}'::jsonb
    ) as request_id;
  $$
);