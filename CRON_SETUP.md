# Automated Tender Scraping Setup

## Overview
The TenderAlert Pro system includes automated daily scraping of tenders from government websites. This is managed through PostgreSQL's `pg_cron` extension in Supabase.

## Cron Job Schedule
- **Frequency**: Daily at 2:00 AM (Kenya time)
- **Function**: `automated-scraper` edge function
- **Job Name**: `automated-tender-scraper`

## Setup Instructions

### 1. Enable Required Extensions (Already Done)
The following extensions have been enabled:
- `pg_cron` - For scheduled jobs
- `pg_net` - For HTTP requests from database

### 2. Create the Cron Job

#### Option A: Using Supabase Dashboard
1. Go to [SQL Editor](https://supabase.com/dashboard/project/mwggjriyxxknotymfsvp/sql/new)
2. Copy and paste the contents of `supabase/setup-cron-job.sql`
3. Click "Run" to execute

#### Option B: Using Supabase CLI
```bash
supabase db execute -f supabase/setup-cron-job.sql
```

### 3. Verify Cron Job is Running
Check the cron job status:
```sql
SELECT * FROM cron.job WHERE jobname = 'automated-tender-scraper';
```

Check recent executions:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'automated-tender-scraper')
ORDER BY start_time DESC 
LIMIT 10;
```

## Cron Schedule Syntax
The cron job uses standard cron syntax: `minute hour day month weekday`

Current schedule: `0 2 * * *` (Every day at 2 AM)

### Common Schedules
- Every hour: `0 * * * *`
- Every 6 hours: `0 */6 * * *`
- Every day at midnight: `0 0 * * *`
- Every Monday at 9 AM: `0 9 * * 1`
- Twice daily (6 AM & 6 PM): `0 6,18 * * *`

## Modifying the Schedule

To change the schedule:

```sql
-- Unschedule the existing job
SELECT cron.unschedule('automated-tender-scraper');

-- Create new schedule with different timing
SELECT cron.schedule(
  'automated-tender-scraper',
  '0 */12 * * *', -- Example: Every 12 hours
  $$ 
  SELECT
    net.http_post(
      url:='https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/automated-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{"scheduled": true, "source": "cron"}'::jsonb
    ) as request_id;
  $$
);
```

## Monitoring

### Admin Dashboard
Visit `/admin/dashboard` to monitor:
- Automation logs showing scraper execution history
- Success/failure rates
- Execution duration
- Error messages

### Database Logs
Check the `automation_logs` table:
```sql
SELECT * FROM automation_logs 
WHERE function_name = 'automated-scraper' 
ORDER BY executed_at DESC 
LIMIT 20;
```

### Edge Function Logs
View logs in Supabase Dashboard:
[Edge Function Logs](https://supabase.com/dashboard/project/mwggjriyxxknotymfsvp/functions/automated-scraper/logs)

## Troubleshooting

### Cron Job Not Running
1. Verify extensions are enabled:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. Check for errors in job runs:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed'
ORDER BY start_time DESC;
```

3. Verify the edge function is deployed and working:
   - Test manually from Admin Dashboard
   - Check edge function logs for errors

### Scraper Failing
1. Check automation_logs for error messages
2. Verify source websites are accessible
3. Check if website structure has changed (requires scraper update)
4. Review edge function logs for detailed error traces

## Security Notes
- The anon key is used for the HTTP request (it's public by design)
- Edge function has `verify_jwt = false` for cron access
- Actual scraping operations use proper authentication internally
- Audit logs track all scraper executions

## Manual Trigger
To manually trigger the scraper without waiting for cron:
1. Visit Admin Dashboard (`/admin/dashboard`)
2. Click "Run Scraper" button
3. Monitor progress in automation logs

Or use Supabase CLI:
```bash
supabase functions invoke automated-scraper --data '{"manual_trigger": true}'
```

## Disabling Automation
To temporarily disable automated scraping:
```sql
SELECT cron.unschedule('automated-tender-scraper');
```

To re-enable, run the setup script again.
