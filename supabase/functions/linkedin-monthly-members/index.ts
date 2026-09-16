// Monthly LinkedIn post welcoming new TenderAlert members.
//
// Only members who explicitly opted in (profiles.linkedin_tag_opt_in = true)
// are named / linked in the post. Everyone else is counted anonymously.
//
// Trigger: POST { dryRun?: boolean, sinceDays?: number, limit?: number }

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/linkedin';
const APP_URL = 'https://tenderproapp.tenderzville-portal.co.ke/';

const HASHTAGS = [
  '#KenyaTenders',
  '#Procurement',
  '#SMEKenya',
  '#AGPO',
  '#PublicProcurement',
  '#TenderAlert',
  '#KenyaBusiness',
].join(' ');

interface MemberRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  location: string | null;
  linkedin_profile_url: string | null;
  linkedin_tag_opt_in: boolean;
  created_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const LINKEDIN_API_KEY = Deno.env.get('LINKEDIN_API_KEY');
    if (!LOVABLE_API_KEY || !LINKEDIN_API_KEY) {
      return json({ success: false, error: 'LinkedIn connector not configured.' }, 500);
    }

    let body: { dryRun?: boolean; sinceDays?: number; limit?: number } = {};
    try { body = await req.json(); } catch { /* empty body allowed */ }
    const dryRun = body.dryRun === true;
    const sinceDays = Math.min(Math.max(body.sinceDays ?? 30, 1), 90);
    const limit = Math.min(Math.max(body.limit ?? 25, 1), 40);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const since = new Date(Date.now() - sinceDays * 86400000).toISOString();

    const { count: totalNew } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since);

    const { data: optedIn, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company, location, linkedin_profile_url, linkedin_tag_opt_in, created_at')
      .eq('linkedin_tag_opt_in', true)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;

    const members = (optedIn || []) as MemberRow[];
    if (members.length === 0 && (totalNew ?? 0) === 0) {
      return json({ success: true, message: 'No new members this period', posted: 0 });
    }

    const text = buildPostText(members, totalNew ?? members.length);
    if (dryRun) return json({ success: true, dryRun: true, preview: text, named: members.length });

    const meRes = await fetch(`${GATEWAY}/v2/userinfo`, {
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'X-Connection-Api-Key': LINKEDIN_API_KEY },
    });
    if (!meRes.ok) {
      return json({ success: false, error: `LinkedIn userinfo failed [${meRes.status}]: ${await meRes.text()}` }, 502);
    }
    const me = await meRes.json();
    if (!me?.sub) return json({ success: false, error: 'Could not resolve LinkedIn member id' }, 502);

    const postRes = await fetch(`${GATEWAY}/v2/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': LINKEDIN_API_KEY,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${me.sub}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'ARTICLE',
            media: [{
              status: 'READY',
              originalUrl: APP_URL,
              title: { text: 'TenderAlert Pro — Kenya Tender Alerts' },
              description: { text: 'Daily MyGov, eGP, PPRA & county tender alerts for Kenyan suppliers.' },
            }],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!postRes.ok) {
      return json({ success: false, error: `LinkedIn post failed [${postRes.status}]: ${await postRes.text()}` }, 502);
    }
    const postJson = await postRes.json().catch(() => ({}));

    if (members.length) {
      await supabase
        .from('profiles')
        .update({ linkedin_tagged_at: new Date().toISOString() })
        .in('id', members.map((m) => m.id));
    }

    return json({ success: true, posted: 1, named: members.length, total_new: totalNew, post_id: postJson?.id ?? null });
  } catch (e) {
    console.error('linkedin-monthly-members error:', e);
    return json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function displayName(m: MemberRow): string {
  const name = [m.first_name, m.last_name].filter(Boolean).join(' ').trim();
  if (name && m.company) return `${name} — ${m.company}`;
  return name || m.company || 'A new member';
}

function buildPostText(members: MemberRow[], totalNew: number): string {
  const month = new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const header =
    `🎉 Welcome to our new TenderAlert members — ${month}\n\n` +
    `${totalNew} Kenyan suppliers, contractors and consultants joined us this month to track MyGov, eGP, PPRA and county tenders in one place.\n`;

  const named = members.length
    ? `\nA special welcome to those who asked to be mentioned:\n` +
      members
        .map((m) => {
          const line = `• ${displayName(m)}${m.location ? ` (${m.location})` : ''}`;
          return m.linkedin_profile_url ? `${line}\n  ${m.linkedin_profile_url}` : line;
        })
        .join('\n')
    : '';

  const cta =
    `\n\n— — —\n` +
    `🤝 Buyers and partners: these are verified businesses actively bidding. Connect with them.\n` +
    `🚀 Not on TenderAlert yet? Daily tender alerts are free: ${APP_URL}\n` +
    `🔁 Share this with a supplier who should be seeing these opportunities.\n` +
    `ℹ️ Members are only named here when they opt in from their settings.\n\n` +
    HASHTAGS;

  return header + named + cta;
}
