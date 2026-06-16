// Post a professional digest of new Kenyan tenders to the connected LinkedIn
// personal profile via the Lovable connector gateway.
//
// - Includes hashtags for discoverability
// - Includes the TenderAlert signup CTA + share-with-a-friend prompt
// - Tracks `linkedin_posted_at` on tenders to prevent double-posting
//
// Trigger: POST (optionally { tenderIds?: number[], limit?: number, dryRun?: boolean }).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY = 'https://connector-gateway.lovable.dev/linkedin';
const APP_URL = 'https://tenderproapp.tenderzville-portal.co.ke/';
const LOOKBACK_DAYS = 7;
const MIN_PREP_DAYS = 14;
const DEFAULT_LIMIT = 5;

const HASHTAGS = [
  '#KenyaTenders',
  '#Procurement',
  '#GovernmentTenders',
  '#TenderAlert',
  '#SupplyChainKE',
  '#AGPO',
  '#BidOpportunities',
  '#KenyaBusiness',
  '#SMEKenya',
  '#PublicProcurement',
].join(' ');

interface TenderRow {
  id: number;
  title: string;
  organization: string | null;
  category: string | null;
  location: string | null;
  deadline: string | null;
  budget_estimate: number | null;
  tender_number: string | null;
  source_url: string | null;
  scraped_from: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const LINKEDIN_API_KEY = Deno.env.get('LINKEDIN_API_KEY');

    if (!LOVABLE_API_KEY || !LINKEDIN_API_KEY) {
      return json({
        success: false,
        error: 'LinkedIn connector not configured. Connect LinkedIn in the Lovable Connectors panel.',
      }, 500);
    }

    let body: { tenderIds?: number[]; limit?: number; dryRun?: boolean } = {};
    try { body = await req.json(); } catch { /* allow empty body */ }
    const limit = Math.min(Math.max(body.limit ?? DEFAULT_LIMIT, 1), 10);
    const dryRun = body.dryRun === true;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Pick tenders
    const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const minDeadline = new Date();
    minDeadline.setHours(0, 0, 0, 0);
    minDeadline.setDate(minDeadline.getDate() + MIN_PREP_DAYS);
    const minDeadlineStr = minDeadline.toISOString().split('T')[0];

    let query = supabase
      .from('tenders')
      .select('id,title,organization,category,location,deadline,budget_estimate,tender_number,source_url,scraped_from')
      .eq('status', 'active')
      .is('linkedin_posted_at', null)
      .gte('created_at', cutoff)
      .gte('deadline', minDeadlineStr)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (body.tenderIds?.length) {
      query = supabase
        .from('tenders')
        .select('id,title,organization,category,location,deadline,budget_estimate,tender_number,source_url,scraped_from')
        .in('id', body.tenderIds)
        .limit(limit);
    }

    const { data: tenders, error } = await query;
    if (error) throw error;
    if (!tenders || tenders.length === 0) {
      return json({ success: true, message: 'No eligible tenders to post', sent: 0 });
    }

    // Resolve LinkedIn member URN (author) once per run
    const meRes = await fetch(`${GATEWAY}/v2/userinfo`, {
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': LINKEDIN_API_KEY,
      },
    });
    if (!meRes.ok) {
      const t = await meRes.text();
      return json({ success: false, error: `LinkedIn /v2/userinfo failed [${meRes.status}]: ${t}` }, 502);
    }
    const me = await meRes.json();
    const memberId: string | undefined = me?.sub;
    if (!memberId) {
      return json({ success: false, error: 'Could not resolve LinkedIn member ID (sub) from /v2/userinfo' }, 502);
    }
    const authorUrn = `urn:li:person:${memberId}`;

    const text = buildPostText(tenders as TenderRow[]);

    if (dryRun) {
      return json({ success: true, dryRun: true, preview: text, would_post_ids: tenders.map(t => t.id) });
    }

    const postRes = await fetch(`${GATEWAY}/v2/ugcPosts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': LINKEDIN_API_KEY,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                originalUrl: APP_URL,
                title: { text: 'TenderAlert Pro — Kenya Tender Alerts' },
                description: { text: 'Daily MyGov, eGP, PPRA & county tender alerts on Telegram, WhatsApp & Email.' },
              },
            ],
          },
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!postRes.ok) {
      const t = await postRes.text();
      return json({ success: false, error: `LinkedIn /v2/ugcPosts failed [${postRes.status}]: ${t}` }, 502);
    }

    const postJson = await postRes.json().catch(() => ({}));
    const postId = postJson?.id ?? null;

    await supabase
      .from('tenders')
      .update({ linkedin_posted_at: new Date().toISOString() })
      .in('id', tenders.map(t => t.id));

    return json({ success: true, sent: tenders.length, post_id: postId, posted_ids: tenders.map(t => t.id) });
  } catch (e) {
    console.error('linkedin-tender-post error:', e);
    return json({ success: false, error: e instanceof Error ? e.message : 'Unknown error' }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fmtKES(n: number | null): string {
  if (!n || n <= 0) return 'Budget: TBD';
  return `KES ${n.toLocaleString('en-KE')}`;
}

function fmtDate(d: string | null): string {
  if (!d) return 'TBD';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildPostText(tenders: TenderRow[]): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const header = `📢 New Kenyan Tender Opportunities — ${today}\n\n` +
    `Fresh procurement opportunities verified from MyGov, eGP Kenya, PPRA and county portals. ` +
    `All listings below have a minimum ${MIN_PREP_DAYS}-day preparation window so your team can bid properly.\n`;

  const items = tenders.map((t, i) => {
    const lines = [
      `\n${i + 1}. ${t.title}`,
      `🏢 ${t.organization ?? 'N/A'}`,
      `📍 ${t.location ?? 'Kenya'}  •  📂 ${t.category ?? 'General'}`,
      `💰 ${fmtKES(t.budget_estimate)}`,
      `📅 Deadline: ${fmtDate(t.deadline)}`,
    ];
    if (t.tender_number) lines.push(`📋 Ref: ${t.tender_number}`);
    if (t.source_url) lines.push(`🔗 ${t.source_url}`);
    return lines.join('\n');
  }).join('\n');

  const cta = `\n\n— — —\n` +
    `🚀 Get tender alerts like these every day — free.\n` +
    `Sign up: ${APP_URL}\n` +
    `🔁 Know a contractor, supplier or SME chasing tenders? Please share this post with them.\n` +
    `💬 Comment "TENDER" and I'll DM you the signup link.\n\n` +
    HASHTAGS;

  return header + items + cta;
}
