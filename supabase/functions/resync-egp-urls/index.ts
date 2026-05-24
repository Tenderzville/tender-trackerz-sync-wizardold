// Bulk resync of eGP Kenya tender source URLs to the new search query format.
// Admin-only. POST { dryRun?: boolean }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BASE = 'https://egpkenya.go.ke/tender';

function buildUrl(tenderNumber?: string | null): string {
  if (!tenderNumber) return BASE;
  return `${BASE}?search=${encodeURIComponent(tenderNumber)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
  );

  // Verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  const { data: roleRow } = await admin
    .from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let dryRun = false;
  try { const body = await req.json(); dryRun = !!body?.dryRun; } catch {}

  const { data: rows, error } = await admin
    .from('tenders')
    .select('id, tender_number, source_url')
    .eq('scraped_from', 'egpkenya')
    .limit(5000);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let scanned = 0, updated = 0, skipped = 0;
  const samples: any[] = [];

  for (const row of rows ?? []) {
    scanned++;
    const desired = buildUrl(row.tender_number);
    if (row.source_url === desired) { skipped++; continue; }
    if (samples.length < 10) samples.push({ id: row.id, from: row.source_url, to: desired });
    if (!dryRun) {
      const { error: upErr } = await admin.from('tenders').update({ source_url: desired }).eq('id', row.id);
      if (!upErr) updated++;
    } else {
      updated++; // count what would be updated
    }
  }

  return new Response(JSON.stringify({
    success: true, dryRun, scanned, updated, skipped, samples,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
