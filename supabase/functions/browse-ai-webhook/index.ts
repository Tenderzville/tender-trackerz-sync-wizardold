import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const HEADERLESS_BROWSE_AI_SOURCES = new Set(['mygov']);
const DEFAULT_MIN_PREP_DAYS = 14;
// Per-source overrides — MyGov tenders are often posted with shorter windows;
// allow 10 days so they reach the live feed instead of being silently dropped.
const SOURCE_MIN_PREP_DAYS: Record<string, number> = {
  mygov: 10,
};
function getMinPrepDays(source: string): number {
  return SOURCE_MIN_PREP_DAYS[source] ?? DEFAULT_MIN_PREP_DAYS;
}

/**
 * Inbound webhook for Browse AI (or similar scrapers) to push tender data.
 * Usage from Browse AI: POST https://mwggjriyxxknotymfsvp.supabase.co/functions/v1/browse-ai-webhook?source=mygov
 * Header: x-webhook-secret: <secret from webhook_endpoints table>
 *
 * Accepts flexible payload shapes:
 *  - { capturedTexts: {...}, capturedLists: {...} }   (Browse AI format)
 *  - { tenders: [ {...}, {...} ] }                      (generic)
 *  - { task: {...}, robot: {...}, ... }                 (Browse AI task webhook)
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const url = new URL(req.url);
  const sourceParam = url.searchParams.get('source') || 'browse-ai';
  const providedSecret = req.headers.get('x-webhook-secret') || url.searchParams.get('secret') || '';
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

  let payload: any = {};
  try { payload = await req.json(); } catch { payload = {}; }

  // Validate secret against webhook_endpoints
  const { data: endpoint } = await supabase
    .from('webhook_endpoints')
    .select('id, secret, is_active, source, total_received')
    .eq('source', sourceParam)
    .eq('is_active', true)
    .maybeSingle();

  const allowHeaderlessBrowseAi = HEADERLESS_BROWSE_AI_SOURCES.has(sourceParam) && !providedSecret;
  if (!endpoint || (!allowHeaderlessBrowseAi && endpoint.secret !== providedSecret)) {
    await supabase.from('webhook_ingestion_log').insert({
      source: sourceParam, payload, status: 'unauthorized',
      error_message: 'Invalid or missing webhook secret', ip_address: ip,
    });
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Normalize payload into tender records
  const items = extractTenders(payload);
  let saved = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      const normalized = normalizeTender(item, sourceParam);
      if (!normalized.title || !normalized.deadline) continue;
      if (!hasMinimumPreparationWindow(normalized.deadline)) continue;

      // Skip if already exists (by tender_number or title+org)
      const { data: existing } = await supabase
        .from('tenders').select('id')
        .or(`tender_number.eq.${normalized.tender_number || '__none__'},and(title.eq.${normalized.title.replace(/,/g,'')},organization.eq.${normalized.organization})`)
        .maybeSingle();
      if (existing) continue;

      const { error } = await supabase.from('tenders').insert(normalized);
      if (error) errors.push(error.message); else saved++;
    } catch (e: any) {
      errors.push(e.message);
    }
  }

  // Update endpoint stats
  await supabase.from('webhook_endpoints').update({
    last_received_at: new Date().toISOString(),
    total_received: ((endpoint as any).total_received ?? 0) + items.length,
  }).eq('id', endpoint.id);

  await supabase.from('webhook_ingestion_log').insert({
    source: sourceParam, endpoint_id: endpoint.id, payload,
    status: errors.length ? 'partial' : 'success',
    items_processed: items.length, items_saved: saved,
    error_message: errors.length ? errors.slice(0, 5).join('; ') : null,
    ip_address: ip,
  });

  // Trigger Telegram notification for new tenders
  if (saved > 0) {
    supabase.functions.invoke('telegram-tender-notify', { body: { count: saved } })
      .catch(e => console.error('TG notify failed:', e));
  }

  return new Response(JSON.stringify({
    success: true, source: sourceParam, items_received: items.length, items_saved: saved,
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});

function extractTenders(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.tenders)) return payload.tenders;
  if (Array.isArray(payload.items)) return payload.items;
  // Browse AI shape
  if (payload.task?.capturedLists) {
    const lists = payload.task.capturedLists;
    const firstKey = Object.keys(lists)[0];
    if (firstKey && Array.isArray(lists[firstKey])) return lists[firstKey];
  }
  if (payload.capturedLists) {
    const firstKey = Object.keys(payload.capturedLists)[0];
    if (firstKey && Array.isArray(payload.capturedLists[firstKey])) return payload.capturedLists[firstKey];
  }
  if (payload.capturedTexts) return [payload.capturedTexts];
  return [];
}

function normalizeTender(raw: any, source: string) {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      for (const variant of [k, k.toLowerCase(), k.toUpperCase(), k.replace(/_/g, ' ')]) {
        if (raw[variant] != null && raw[variant] !== '') return raw[variant];
      }
    }
    return null;
  };
  const parseBudget = (v: any): number | null => {
    if (v == null) return null;
    const n = Number(String(v).replace(/[^0-9.]/g, ''));
    if (!isFinite(n) || n <= 50000) return null; // reject fees mistakenly tagged as budget
    return Math.round(n);
  };
  const parseDate = (v: any): string | null => {
    if (!v) return null;
    const d = new Date(v);
    return isFinite(d.getTime()) ? d.toISOString().split('T')[0] : null;
  };
  return {
    title: pick('title', 'tender_title', 'name')?.toString().slice(0, 500),
    description: pick('description', 'details', 'summary')?.toString() || pick('title')?.toString() || '',
    organization: pick('organization', 'org', 'procuring_entity', 'entity', 'ministry')?.toString() || 'Unknown',
    category: pick('category', 'sector', 'type')?.toString() || 'General',
    location: pick('location', 'county', 'region')?.toString() || 'Kenya',
    deadline: parseDate(pick('deadline', 'closing_date', 'submission_deadline', 'close_date')),
    budget_estimate: parseBudget(pick('budget', 'budget_estimate', 'estimated_value', 'value')) ?? 0,
    tender_number: pick('tender_number', 'tender_no', 'reference', 'ref')?.toString().slice(0, 100),
    source_url: pick('url', 'source_url', 'link')?.toString(),
    scraped_from: source,
    publish_date: parseDate(pick('publish_date', 'published_date', 'date_published')) || new Date().toISOString().split('T')[0],
    status: 'active',
  };
}

function hasMinimumPreparationWindow(deadline: string): boolean {
  const threshold = new Date();
  threshold.setHours(0, 0, 0, 0);
  threshold.setDate(threshold.getDate() + MIN_SUPPLIER_PREP_DAYS);
  return deadline >= threshold.toISOString().split('T')[0];
}
