import { supabase } from '@/integrations/supabase/client';

/**
 * Log an outbound link click. Fire-and-forget — never block navigation.
 */
export function trackOutboundClick(params: {
  destination: string;
  source: string; // 'footer' | 'banner' | 'sourceke_page' | 'telegram' | etc.
  campaign?: string;
}) {
  try {
    const { destination, source, campaign } = params;
    supabase.auth.getUser().then(({ data }) => {
      supabase.from('outbound_link_clicks').insert({
        destination,
        source,
        campaign: campaign ?? null,
        user_id: data.user?.id ?? null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
        referrer: typeof document !== 'undefined' ? document.referrer || null : null,
      }).then(() => {});
    });
  } catch {
    // swallow
  }
}
