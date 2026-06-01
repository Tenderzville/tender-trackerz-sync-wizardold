// Nightly sweep: re-fetch each tender source URL and mark its verification status.
// Run via pg_cron daily; admin can also trigger manually.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH = 50;
const TIMEOUT_MS = 8000;

async function checkUrl(url: string): Promise<'verified' | 'unverified'> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(t);
    if (res.ok) return 'verified';
    if (res.status === 405 || res.status === 403) {
      // Some servers block HEAD — retry with GET
      const controller2 = new AbortController();
      const t2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
      const r2 = await fetch(url, { method: 'GET', redirect: 'follow', signal: controller2.signal });
      clearTimeout(t2);
      return r2.ok ? 'verified' : 'unverified';
    }
    return 'unverified';
  } catch {
    return 'unverified';
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Pick rows whose verification is missing or older than 7 days.
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error } = await supabase
    .from('tenders')
    .select('id, source_url')
    .not('source_url', 'is', null)
    .eq('status', 'active')
    .or(`source_verified_at.is.null,source_verified_at.lt.${cutoff}`)
    .limit(BATCH);

  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let verified = 0, unverified = 0;
  for (const row of rows ?? []) {
    if (!row.source_url) continue;
    const status = await checkUrl(row.source_url);
    if (status === 'verified') verified++; else unverified++;
    await supabase.from('tenders').update({
      source_status: status,
      source_verified_at: new Date().toISOString(),
    }).eq('id', row.id);
  }

  return new Response(JSON.stringify({ ok: true, checked: rows?.length ?? 0, verified, unverified }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
