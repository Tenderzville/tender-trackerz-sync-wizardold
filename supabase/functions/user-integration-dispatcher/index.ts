import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function deliver(it: any, event: string, payload: Record<string, unknown>) {
  const body = JSON.stringify({
    event,
    user_id: it.user_id,
    integration_id: it.id,
    timestamp: new Date().toISOString(),
    ...payload,
  });
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (it.api_key) headers['Authorization'] = `Bearer ${it.api_key}`;
  try {
    const r = await fetch(it.webhook_url, { method: 'POST', headers, body });
    return { ok: r.ok, status: r.status, detail: r.ok ? 'delivered' : `HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, status: 0, detail: e instanceof Error ? e.message : 'network error' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const admin = createClient(url, serviceKey);

    const { action, integration_id, event, payload, user_id } = await req.json();

    // user-triggered TEST
    if (action === 'test') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ ok: false, error: 'auth required' }, 401);
      const authClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user } } = await authClient.auth.getUser();
      if (!user) return json({ ok: false, error: 'invalid session' }, 401);

      const { data: it } = await admin.from('user_integrations').select('*').eq('id', integration_id).eq('user_id', user.id).maybeSingle();
      if (!it) return json({ ok: false, error: 'not found' }, 404);

      const result = await deliver(it, 'test.ping', {
        tender: {
          id: 0, title: 'Sample tender — Provision of stationery',
          organization: 'Demo Procuring Entity', category: 'Goods',
          location: 'Nairobi', deadline: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
          budget_estimate: 0, source_url: 'https://tenders.go.ke', tender_number: 'DEMO/0001/2025-26',
        },
      });

      await admin.from('user_integrations').update({
        last_triggered_at: new Date().toISOString(),
        last_status: result.detail,
        last_error: result.ok ? null : result.detail,
        delivery_count: it.delivery_count + (result.ok ? 1 : 0),
        failure_count: it.failure_count + (result.ok ? 0 : 1),
      }).eq('id', it.id);

      return json(result);
    }

    // server-to-server FAN-OUT (called by smart-tender-matcher etc.)
    if (action === 'dispatch') {
      if (!user_id || !event) return json({ ok: false, error: 'user_id and event required' }, 400);
      const { data: integrations } = await admin
        .from('user_integrations')
        .select('*')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .contains('events', [event]);

      const results: any[] = [];
      for (const it of integrations || []) {
        const r = await deliver(it, event, payload || {});
        results.push({ id: it.id, ...r });
        await admin.from('user_integrations').update({
          last_triggered_at: new Date().toISOString(),
          last_status: r.detail,
          last_error: r.ok ? null : r.detail,
          delivery_count: it.delivery_count + (r.ok ? 1 : 0),
          failure_count: it.failure_count + (r.ok ? 0 : 1),
        }).eq('id', it.id);
      }
      return json({ ok: true, dispatched: results.length, results });
    }

    return json({ ok: false, error: 'invalid action' }, 400);
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message : 'unknown' }, 500);
  }
});
