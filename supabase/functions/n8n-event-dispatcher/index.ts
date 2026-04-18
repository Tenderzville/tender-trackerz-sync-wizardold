import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Outbound dispatcher: sends events to all active outbound_webhooks (e.g., n8n).
 * Call from app code or other edge functions:
 *   supabase.functions.invoke('n8n-event-dispatcher', { body: { event_type: 'tender.created', data: {...} } })
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let body: any = {};
  try { body = await req.json(); } catch {}
  const { event_type, data } = body;
  if (!event_type) {
    return new Response(JSON.stringify({ error: 'event_type required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { data: hooks } = await supabase
    .from('outbound_webhooks')
    .select('id, url, event_types, total_sent')
    .eq('is_active', true);

  const matching = (hooks || []).filter(h =>
    !h.event_types || h.event_types.length === 0 || h.event_types.includes(event_type) || h.event_types.includes('*')
  );

  const results = await Promise.allSettled(matching.map(async (h) => {
    const res = await fetch(h.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type, data, timestamp: new Date().toISOString() }),
    });
    await supabase.from('outbound_webhooks').update({
      last_triggered_at: new Date().toISOString(),
      total_sent: (h.total_sent || 0) + 1,
    }).eq('id', h.id);
    return { id: h.id, status: res.status };
  }));

  return new Response(JSON.stringify({
    success: true, event_type, dispatched: results.length,
    results: results.map(r => r.status === 'fulfilled' ? r.value : { error: String(r.reason) }),
  }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
