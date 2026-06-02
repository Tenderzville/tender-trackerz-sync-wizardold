
SELECT cron.unschedule('verify-tender-sources-nightly') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname='verify-tender-sources-nightly'
);
SELECT cron.schedule(
  'verify-tender-sources-nightly',
  '0 23 * * *',
  $$ SELECT net.http_post(
       url := 'https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/verify-tender-sources',
       headers := '{"Content-Type":"application/json","apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13Z2dqcml5eHhrbm90eW1mc3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0OTc4MjIsImV4cCI6MjA2NDA3MzgyMn0.ksDROGnFHmiIW9ij1HuisTFRBm91F35MEfpIGwThT7Y"}'::jsonb,
       body := '{"trigger":"cron"}'::jsonb
     ); $$
);
