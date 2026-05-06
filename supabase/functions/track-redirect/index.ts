// Public redirect endpoint that logs an outbound click then 302s to the destination.
// Used in Telegram messages so we can attribute opens to the channel.
// Example: https://<ref>.supabase.co/functions/v1/track-redirect?to=https://sourcekeapp.tenderzville-portal.co.ke/&src=telegram&c=tender_alert
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_HOSTS = new Set([
  'sourcekeapp.tenderzville-portal.co.ke',
  'tenderzville-portal.co.ke',
  't.me',
]);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const to = url.searchParams.get('to');
  const src = url.searchParams.get('src') || 'telegram';
  const campaign = url.searchParams.get('c') || null;

  if (!to) return new Response('Missing ?to', { status: 400 });

  let target: URL;
  try { target = new URL(to); } catch { return new Response('Invalid URL', { status: 400 }); }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return new Response('Destination not allowed', { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  // Fire-and-forget log
  supabase.from('outbound_link_clicks').insert({
    destination: target.toString(),
    source: src,
    campaign,
    user_agent: req.headers.get('user-agent'),
    referrer: req.headers.get('referer'),
    ip_address: (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || null,
  }).then(() => {}).catch(() => {});

  return new Response(null, {
    status: 302,
    headers: { Location: target.toString(), 'Cache-Control': 'no-store' },
  });
});
