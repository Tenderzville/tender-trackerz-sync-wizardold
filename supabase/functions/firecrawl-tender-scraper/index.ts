import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenderData {
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  deadline: string;
  budgetEstimate?: number;
  requirements?: string[];
  sourceUrl: string;
  scrapedFrom: string;
  tenderNumber?: string;
  contactEmail?: string;
  contactPhone?: string;
}

interface ScrapeResult {
  source: string;
  tenders: TenderData[];
  error?: string;
}

/**
 * Tender scraper using REAL APIs and verified URL formats:
 * 
 * 1. tenders.go.ke - Has a PUBLIC JSON API at /api/active-tenders
 *    Individual tender URL: https://tenders.go.ke/tenders/{id}  (VERIFIED WORKING)
 * 
 * 2. egpkenya.go.ke - Scraped via Firecrawl, tender IDs extracted
 *    Individual tender URL: SPA, uses search param
 * 
 * 3. mygov.go.ke - Scraped via Firecrawl
 * 
 * 4. ppra.go.ke - Contract awards scraped via Firecrawl
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source } = await req.json().catch(() => ({ source: 'all' }));

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: ScrapeResult[] = [];
    let totalProcessed = 0;
    let totalSaved = 0;

    // ============================================================
    // SOURCE 1: tenders.go.ke - DIRECT PUBLIC API (no Firecrawl needed!)
    // ============================================================
    if (source === 'all' || source === 'tenders.go.ke') {
      console.log('Fetching from tenders.go.ke PUBLIC API...');
      try {
        const apiTenders = await fetchFromTendersGoKeAPI();
        results.push({ source: 'tenders.go.ke', tenders: apiTenders });

        for (const tender of apiTenders) {
          totalProcessed++;
          const saved = await saveTenderIfNew(supabase, tender);
          if (saved) totalSaved++;
        }
      } catch (err) {
        console.error('tenders.go.ke API error:', err);
        results.push({ source: 'tenders.go.ke', tenders: [], error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }

    // ============================================================
    // SOURCE 2: egpkenya.go.ke - Firecrawl scrape
    // ============================================================
    if (source === 'all' || source === 'egpkenya') {
      const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
      if (FIRECRAWL_API_KEY) {
        console.log('Scraping egpkenya.go.ke via Firecrawl...');
        try {
          const egpTenders = await scrapeWithFirecrawl('egpkenya', 'https://egpkenya.go.ke/tender', FIRECRAWL_API_KEY);
          results.push({ source: 'egpkenya', tenders: egpTenders });

          for (const tender of egpTenders) {
            totalProcessed++;
            const saved = await saveTenderIfNew(supabase, tender);
            if (saved) totalSaved++;
          }
        } catch (err) {
          console.error('egpkenya scrape error:', err);
          results.push({ source: 'egpkenya', tenders: [], error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }

    // ============================================================
    // SOURCE 3: mygov.go.ke - Firecrawl scrape
    // ============================================================
    if (source === 'all' || source === 'mygov') {
      const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
      if (FIRECRAWL_API_KEY) {
        console.log('Scraping mygov.go.ke via Firecrawl...');
        try {
          const mygovTenders = await scrapeWithFirecrawl('mygov', 'https://www.mygov.go.ke/all-tenders', FIRECRAWL_API_KEY);
          results.push({ source: 'mygov', tenders: mygovTenders });

          for (const tender of mygovTenders) {
            totalProcessed++;
            const saved = await saveTenderIfNew(supabase, tender);
            if (saved) totalSaved++;
          }
        } catch (err) {
          console.error('mygov scrape error:', err);
          results.push({ source: 'mygov', tenders: [], error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }

    // ============================================================
    // SOURCE 4: ppra.go.ke - Firecrawl scrape
    // ============================================================
    if (source === 'all' || source === 'ppra') {
      const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
      if (FIRECRAWL_API_KEY) {
        console.log('Scraping ppra.go.ke via Firecrawl...');
        try {
          const ppraTenders = await scrapeWithFirecrawl('ppra', 'https://ppra.go.ke/contract-awards/', FIRECRAWL_API_KEY);
          results.push({ source: 'ppra', tenders: ppraTenders });

          for (const tender of ppraTenders) {
            totalProcessed++;
            const saved = await saveTenderIfNew(supabase, tender);
            if (saved) totalSaved++;
          }
        } catch (err) {
          console.error('ppra scrape error:', err);
          results.push({ source: 'ppra', tenders: [], error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scraped ${results.length} sources. Processed ${totalProcessed} tenders, saved ${totalSaved} new tenders.`,
        results,
        stats: { totalProcessed, totalSaved },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in firecrawl-tender-scraper:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================================
// tenders.go.ke PUBLIC API - Direct JSON, no scraping needed
// Verified: https://tenders.go.ke/api/active-tenders returns JSON
// Verified: https://tenders.go.ke/tenders/{id} is the working deep link
// ============================================================
async function fetchFromTendersGoKeAPI(): Promise<TenderData[]> {
  const tenders: TenderData[] = [];

  // Fetch multiple pages to get more tenders
  for (let page = 1; page <= 3; page++) {
    const apiUrl = `https://tenders.go.ke/api/active-tenders?perpage=50&page=${page}`;
    console.log(`Fetching tenders.go.ke API page ${page}...`);

    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`tenders.go.ke API returned ${response.status}`);
      break;
    }

    const json = await response.json();
    const items = json.data || [];

    for (const item of items) {
      // CRITICAL: The verified working deep-link format
      const sourceUrl = `https://tenders.go.ke/tenders/${item.id}`;

      const category = mapProcurementCategory(
        item.procurement_category?.title || item.procurement_category?.code || ''
      );

      const deadline = item.close_at
        ? new Date(item.close_at).toISOString().split('T')[0]
        : getFutureDate(30);

      // Extract location from PE county if available
      const location = item.pe?.city || item.pe?.physical_address || 'Kenya';

      tenders.push({
        title: item.title || 'Untitled Tender',
        description: item.description || `${item.title} - Procurement by ${item.pe?.name || 'Government of Kenya'}`,
        organization: item.pe?.name || 'Government of Kenya',
        category,
        location,
        deadline,
        budgetEstimate: item.tender_fee > 0 ? item.tender_fee : 0,
        scrapedFrom: 'tenders.go.ke',
        sourceUrl,  // VERIFIED deep link: https://tenders.go.ke/tenders/{id}
        tenderNumber: item.tender_ref || undefined,
        contactEmail: item.pe?.email || undefined,
        contactPhone: item.pe?.telephone || undefined,
      });
    }

    console.log(`Page ${page}: extracted ${items.length} tenders`);

    // Stop if we've reached the last page
    if (page >= (json.last_page || 1)) break;
  }

  return tenders;
}

// ============================================================
// Firecrawl-based scraping for other sources
// ============================================================
async function scrapeWithFirecrawl(
  source: string,
  url: string,
  apiKey: string
): Promise<TenderData[]> {
  const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!scrapeResponse.ok) {
    const errorText = await scrapeResponse.text();
    throw new Error(`Firecrawl error for ${source}: ${errorText}`);
  }

  const scrapeData = await scrapeResponse.json();
  const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';

  if (markdown.length < 100) {
    console.log(`Not enough content from ${source}`);
    return [];
  }

  return await parseWithAI(source, markdown);
}

async function parseWithAI(source: string, markdown: string): Promise<TenderData[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return [];

  const baseUrl = source === 'mygov' ? 'https://www.mygov.go.ke'
    : source === 'ppra' ? 'https://ppra.go.ke'
    : 'https://egpkenya.go.ke';

  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a data extraction expert. Extract tender/procurement information from Kenyan government websites. Return ONLY valid JSON array.`
          },
          {
            role: 'user',
            content: `Extract all tenders from this ${source} government website content. Return a JSON array.

Each tender must have:
- title (required): EXACT tender title/description as written
- organization (required): EXACT procuring entity name as written
- category: One of: Construction, ICT, Consultancy, Supply, Transport, Healthcare, Education, Agriculture, Environment, Other
- location: County or region in Kenya (default: "Nairobi" if not specified)
- deadline: Date in YYYY-MM-DD format (estimate 30 days from now if not specified)
- tenderNumber: Official reference/tender number if available
- description: Brief description
- tenderId: The numeric tender ID if visible (e.g., "Tender ID : 13401" → 13401)
- sourceLink: Specific URL path to this tender if visible

IMPORTANT: Extract verbatim. Do NOT generate or paraphrase.

CONTENT:
${markdown.substring(0, 8000)}

Return ONLY a valid JSON array. If no tenders, return []`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) return [];

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';

    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[1] || jsonMatch[0];

    const parsed = JSON.parse(jsonStr.trim());

    return parsed.map((t: any) => {
      // Build the best possible source URL
      let sourceUrl: string;

      if (source === 'egpkenya' && t.tenderId) {
        // eGP Kenya uses tender IDs but it's an SPA - search is more reliable
        sourceUrl = `https://egpkenya.go.ke/tender`;
      } else if (t.sourceLink?.startsWith('http')) {
        sourceUrl = t.sourceLink;
      } else if (t.sourceLink?.startsWith('/')) {
        sourceUrl = `${baseUrl}${t.sourceLink}`;
      } else if (t.tenderNumber) {
        // For eGP Kenya, link to the main page (it's an SPA)
        sourceUrl = `https://egpkenya.go.ke/tender`;
      } else {
        sourceUrl = baseUrl;
      }

      return {
        title: t.title || 'Untitled Tender',
        description: t.description || `${t.title} - Procurement by ${t.organization}`,
        organization: t.organization || 'Government of Kenya',
        category: validateCategory(t.category),
        location: t.location || 'Nairobi',
        deadline: validateDate(t.deadline),
        budgetEstimate: 0, // Never fabricate budgets
        scrapedFrom: source,
        sourceUrl,
        tenderNumber: t.tenderNumber,
        requirements: [],
      };
    });
  } catch (error) {
    console.error('AI parsing error:', error);
    return [];
  }
}

// ============================================================
// Save tender to database, checking for duplicates
// ============================================================
async function saveTenderIfNew(supabase: any, tender: TenderData): Promise<boolean> {
  // Check for duplicates by title OR tender_number
  const { data: existing } = await supabase
    .from('tenders')
    .select('id')
    .or(
      `title.eq.${tender.title}` +
      (tender.tenderNumber ? `,tender_number.eq.${tender.tenderNumber}` : '')
    )
    .maybeSingle();

  if (existing) {
    // Update source_url if the existing one is broken
    if (tender.sourceUrl && tender.sourceUrl.includes('tenders.go.ke/tenders/')) {
      await supabase
        .from('tenders')
        .update({ source_url: tender.sourceUrl })
        .eq('id', existing.id);
      console.log(`Updated URL for existing tender: ${tender.title.substring(0, 50)}...`);
    }
    return false;
  }

  const { error: insertError } = await supabase
    .from('tenders')
    .insert({
      title: tender.title,
      description: tender.description,
      organization: tender.organization,
      category: tender.category,
      location: tender.location,
      deadline: tender.deadline,
      budget_estimate: tender.budgetEstimate || null,
      requirements: tender.requirements || [],
      source_url: tender.sourceUrl,
      scraped_from: tender.scrapedFrom,
      tender_number: tender.tenderNumber,
      contact_email: tender.contactEmail,
      contact_phone: tender.contactPhone,
      status: 'active',
    });

  if (!insertError) {
    console.log(`Saved: ${tender.title.substring(0, 50)}... → ${tender.sourceUrl}`);
    return true;
  } else {
    console.error('Insert error:', insertError);
    return false;
  }
}

// ============================================================
// Utility functions
// ============================================================
function mapProcurementCategory(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('work')) return 'Construction';
  if (lower.includes('good')) return 'Supply';
  if (lower.includes('consultancy')) return 'Consultancy';
  if (lower.includes('non consultancy') || lower.includes('non-consultancy')) return 'Other';
  if (lower.includes('ict') || lower.includes('software') || lower.includes('technology')) return 'ICT';
  return 'Other';
}

function validateCategory(category: string): string {
  const valid = ['Construction', 'ICT', 'Consultancy', 'Supply', 'Transport', 'Healthcare', 'Education', 'Agriculture', 'Environment', 'Other'];
  if (valid.includes(category)) return category;

  const map: Record<string, string> = {
    'it': 'ICT', 'technology': 'ICT', 'software': 'ICT',
    'building': 'Construction', 'infrastructure': 'Construction', 'works': 'Construction',
    'goods': 'Supply', 'equipment': 'Supply',
    'services': 'Consultancy', 'medical': 'Healthcare',
    'school': 'Education', 'training': 'Education',
  };

  const lower = (category || '').toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (lower.includes(key)) return value;
  }
  return 'Other';
}

function validateDate(dateStr: string): string {
  if (!dateStr) return getFutureDate(30);
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return getFutureDate(30);
    if (date < new Date()) return getFutureDate(30);
    return date.toISOString().split('T')[0];
  } catch {
    return getFutureDate(30);
  }
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
