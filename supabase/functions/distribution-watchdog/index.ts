// Distribution watchdog: ensures Telegram + LinkedIn posts keep running.
// Triggered by pg_cron every 3 hours. Invokes downstream functions when stale.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const now = Date.now();
  const results: Record<string, unknown> = {};

  // Telegram: stale if last successful run > 24h
  const { data: lastTg } = await supabase
    .from('automation_logs')
    .select('executed_at,status')
    .eq('function_name', 'telegram-tender-notify')
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const tgStale = !lastTg?.executed_at || (now - new Date(lastTg.executed_at).getTime()) > 24 * 3600 * 1000;
  results.telegram = { last: lastTg?.executed_at ?? null, stale: tgStale };
  if (tgStale) {
    const r = await fetch(`${supabaseUrl}/functions/v1/telegram-tender-notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ source: 'watchdog' }),
    });
    results.telegram_triggered = { status: r.status };
  }

  // LinkedIn: stale if newest linkedin_posted_at > 96h
  const { data: lastLi } = await supabase
    .from('tenders')
    .select('linkedin_posted_at')
    .not('linkedin_posted_at', 'is', null)
    .order('linkedin_posted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const liStale = !lastLi?.linkedin_posted_at || (now - new Date(lastLi.linkedin_posted_at).getTime()) > 96 * 3600 * 1000;
  results.linkedin = { last: lastLi?.linkedin_posted_at ?? null, stale: liStale };
  if (liStale) {
    const r = await fetch(`${supabaseUrl}/functions/v1/linkedin-tender-post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ source: 'watchdog', limit: 5 }),
    });
    results.linkedin_triggered = { status: r.status };
  }

  // Scraper: stale if last run > 12h
  const { data: lastScrape } = await supabase
    .from('automation_logs')
    .select('executed_at')
    .order('executed_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const scrapeStale = !lastScrape?.executed_at || (now - new Date(lastScrape.executed_at).getTime()) > 12 * 3600 * 1000;
  results.scraper = { last: lastScrape?.executed_at ?? null, stale: scrapeStale };
  if (scrapeStale) {
    const r = await fetch(`${supabaseUrl}/functions/v1/automated-scraper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
      body: JSON.stringify({ source: 'watchdog' }),
    });
    results.scraper_triggered = { status: r.status };
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
