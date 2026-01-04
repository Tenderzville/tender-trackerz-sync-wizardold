import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface HistoricalAward {
  tender_number?: string;
  title: string;
  organization: string;
  category: string;
  location?: string;
  original_budget?: number;
  awarded_amount?: number;
  winner_name?: string;
  winner_type?: string;
  bid_count?: number;
  award_date?: string;
  tender_type?: string;
  procurement_method?: string;
  source_url?: string;
  scraped_from: string;
}

// Scrape e-GP Kenya Award Notices
async function scrapeEgpAwards(): Promise<HistoricalAward[]> {
  const awards: HistoricalAward[] = [];
  
  if (!firecrawlApiKey) {
    console.log('No Firecrawl API key, skipping e-GP awards');
    return awards;
  }

  try {
    // e-GP Kenya has award notices section
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://eprocure.go.ke/award-notices',
        formats: ['markdown', 'html'],
        waitFor: 5000,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.log('e-GP awards scrape failed:', await response.text());
      return awards;
    }

    const data = await response.json();
    const content = data.data?.markdown || data.data?.html || '';
    
    // Parse award notices from content
    const parsedAwards = parseAwardNotices(content, 'egp_kenya');
    awards.push(...parsedAwards);
    
    console.log(`Scraped ${awards.length} awards from e-GP Kenya`);
  } catch (error) {
    console.error('Error scraping e-GP awards:', error);
  }

  return awards;
}

// Scrape PPRA Published Awards
async function scrapePpraAwards(): Promise<HistoricalAward[]> {
  const awards: HistoricalAward[] = [];
  
  if (!firecrawlApiKey) {
    console.log('No Firecrawl API key, skipping PPRA awards');
    return awards;
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://ppra.go.ke/contract-awards/',
        formats: ['markdown', 'html'],
        waitFor: 5000,
        timeout: 30000,
      }),
    });

    if (!response.ok) {
      console.log('PPRA awards scrape failed:', await response.text());
      return awards;
    }

    const data = await response.json();
    const content = data.data?.markdown || data.data?.html || '';
    
    const parsedAwards = parseAwardNotices(content, 'ppra');
    awards.push(...parsedAwards);
    
    console.log(`Scraped ${awards.length} awards from PPRA`);
  } catch (error) {
    console.error('Error scraping PPRA awards:', error);
  }

  return awards;
}

// Parse award content into structured data
function parseAwardNotices(content: string, source: string): HistoricalAward[] {
  const awards: HistoricalAward[] = [];
  
  if (!content) return awards;

  // Split by common delimiters for award entries
  const sections = content.split(/(?:Award Notice|Contract Award|Tender Award|Notification of Award)/i);
  
  for (const section of sections) {
    if (section.length < 50) continue; // Skip empty sections
    
    // Extract tender number
    const tenderNumMatch = section.match(/(?:Tender|Reference|Contract)\s*(?:No|Number|#)?[:\s]*([A-Z]{2,}[-/][A-Z0-9/-]+)/i);
    
    // Extract title
    const titleMatch = section.match(/(?:Title|Subject|Description|For)[:\s]*([^\n]+)/i);
    
    // Extract organization
    const orgMatch = section.match(/(?:Procuring Entity|Organization|Ministry|Authority|County)[:\s]*([^\n]+)/i);
    
    // Extract awarded amount
    const amountMatch = section.match(/(?:Contract Amount|Award Amount|Contract Value|KES|Kshs?)[:\s]*([0-9,]+(?:\.[0-9]+)?)/i);
    
    // Extract winner
    const winnerMatch = section.match(/(?:Awarded to|Winner|Successful Bidder|Contractor)[:\s]*([^\n]+)/i);
    
    // Extract date
    const dateMatch = section.match(/(?:Award Date|Date of Award|Contract Date)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})/i);
    
    // Extract bid count
    const bidCountMatch = section.match(/(?:Number of Bids|Bidders|Tenders Received)[:\s]*(\d+)/i);
    
    // Extract category from title or explicit field
    const categoryMatch = section.match(/(?:Category|Sector|Type)[:\s]*([^\n]+)/i);
    
    // Extract location
    const locationMatch = section.match(/(?:Location|County|Region)[:\s]*([^\n]+)/i);

    if (titleMatch || tenderNumMatch) {
      const title = titleMatch?.[1]?.trim() || `Award ${tenderNumMatch?.[1]}`;
      const organization = orgMatch?.[1]?.trim() || extractOrganization(section);
      
      if (title && organization) {
        const award: HistoricalAward = {
          tender_number: tenderNumMatch?.[1]?.trim(),
          title: title.substring(0, 500),
          organization: organization.substring(0, 255),
          category: inferCategory(title, categoryMatch?.[1]),
          location: locationMatch?.[1]?.trim()?.substring(0, 100) || inferLocation(section),
          awarded_amount: parseAmount(amountMatch?.[1]),
          winner_name: winnerMatch?.[1]?.trim()?.substring(0, 255),
          winner_type: inferWinnerType(winnerMatch?.[1] || ''),
          bid_count: bidCountMatch ? parseInt(bidCountMatch[1]) : undefined,
          award_date: parseDateString(dateMatch?.[1]),
          tender_type: inferTenderType(section),
          procurement_method: inferProcurementMethod(section),
          source_url: source === 'egp_kenya' ? 'https://eprocure.go.ke/award-notices' : 'https://ppra.go.ke/contract-awards/',
          scraped_from: source,
        };
        
        awards.push(award);
      }
    }
  }

  return awards;
}

function extractOrganization(text: string): string {
  // Look for common Kenyan government entities
  const orgs = [
    'Ministry of', 'County Government', 'Kenya Rural Roads Authority', 'Kenya Urban Roads Authority',
    'Kenya Ports Authority', 'Kenya Airways', 'Kenya Power', 'KETRACO', 'KEMSA', 'NTSA', 'NEMA',
    'KWS', 'KPLC', 'KRA', 'CBK', 'KURA', 'KERRA', 'KeNHA', 'KICD', 'KNEC', 'TSC'
  ];
  
  for (const org of orgs) {
    if (text.includes(org)) {
      const match = text.match(new RegExp(`(${org}[^,\n]*?)(?:,|\n|$)`, 'i'));
      if (match) return match[1].trim();
    }
  }
  
  return 'Government of Kenya';
}

function inferCategory(title: string, explicit?: string): string {
  if (explicit) return explicit.trim().substring(0, 100);
  
  const lower = title.toLowerCase();
  if (lower.includes('road') || lower.includes('construction') || lower.includes('building')) return 'Construction';
  if (lower.includes('medical') || lower.includes('health') || lower.includes('hospital') || lower.includes('pharmaceutical')) return 'Medical';
  if (lower.includes('ict') || lower.includes('software') || lower.includes('computer') || lower.includes('technology')) return 'Technology';
  if (lower.includes('supply') || lower.includes('furniture') || lower.includes('stationery')) return 'Supplies';
  if (lower.includes('consult') || lower.includes('advisory') || lower.includes('study')) return 'Consultancy';
  if (lower.includes('security') || lower.includes('guard')) return 'Security';
  if (lower.includes('transport') || lower.includes('vehicle') || lower.includes('fleet')) return 'Transport';
  if (lower.includes('water') || lower.includes('sanitation') || lower.includes('sewage')) return 'Water';
  if (lower.includes('energy') || lower.includes('power') || lower.includes('electricity')) return 'Energy';
  if (lower.includes('education') || lower.includes('school') || lower.includes('training')) return 'Education';
  if (lower.includes('agriculture') || lower.includes('farm') || lower.includes('livestock')) return 'Agriculture';
  
  return 'General';
}

function inferLocation(text: string): string {
  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Kiambu', 'Machakos',
    'Nyeri', 'Meru', 'Kakamega', 'Kisii', 'Garissa', 'Turkana', 'Bungoma', 'Uasin Gishu'
  ];
  
  for (const county of counties) {
    if (text.toLowerCase().includes(county.toLowerCase())) return county;
  }
  
  return 'Kenya';
}

function parseAmount(amountStr?: string): number | undefined {
  if (!amountStr) return undefined;
  const cleaned = amountStr.replace(/[,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

function parseDateString(dateStr?: string): string | undefined {
  if (!dateStr) return undefined;
  
  // Try to parse various date formats
  const parts = dateStr.split(/[-/]/);
  if (parts.length === 3) {
    // Determine year position
    let year = parts.find(p => p.length === 4);
    if (!year) {
      year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    }
    // Return in YYYY-MM-DD format
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  
  return undefined;
}

function inferWinnerType(winner: string): string {
  const lower = winner.toLowerCase();
  if (lower.includes('consortium') || lower.includes('joint venture') || lower.includes('jv')) return 'consortium';
  if (lower.includes('youth') || lower.includes('young')) return 'youth';
  if (lower.includes('women') || lower.includes('female')) return 'women';
  if (lower.includes('pwd') || lower.includes('disabled')) return 'pwd';
  if (lower.includes('sme') || lower.includes('small') || lower.includes('micro')) return 'sme';
  if (lower.includes('ltd') || lower.includes('limited') || lower.includes('plc')) return 'large_enterprise';
  return 'sme';
}

function inferTenderType(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('restricted') || lower.includes('invitation')) return 'restricted';
  if (lower.includes('direct') || lower.includes('single source')) return 'direct';
  if (lower.includes('framework') || lower.includes('standing')) return 'framework';
  if (lower.includes('agpo') || lower.includes('access to government')) return 'agpo';
  return 'open';
}

function inferProcurementMethod(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('rfq') || lower.includes('request for quotation')) return 'Request for Quotation';
  if (lower.includes('rfp') || lower.includes('request for proposal')) return 'Request for Proposal';
  if (lower.includes('expression of interest') || lower.includes('eoi')) return 'Expression of Interest';
  if (lower.includes('framework')) return 'Framework Agreement';
  return 'Open Tender';
}

// Save awards to database
async function saveAwards(awards: HistoricalAward[]): Promise<{ inserted: number; duplicates: number }> {
  let inserted = 0;
  let duplicates = 0;

  for (const award of awards) {
    try {
      // Calculate additional analytics fields
      let priceTobudgetRatio: number | undefined;
      if (award.original_budget && award.awarded_amount) {
        priceTobudgetRatio = award.awarded_amount / award.original_budget;
      }
      
      let competitionLevel = 'medium';
      if (award.bid_count) {
        if (award.bid_count < 3) competitionLevel = 'low';
        else if (award.bid_count > 7) competitionLevel = 'high';
      }

      const { error } = await supabase
        .from('historical_tender_awards')
        .insert({
          ...award,
          price_to_budget_ratio: priceTobudgetRatio,
          competition_level: competitionLevel,
        });

      if (error) {
        if (error.code === '23505') {
          duplicates++;
        } else {
          console.error('Error inserting award:', error);
        }
      } else {
        inserted++;
      }
    } catch (err) {
      console.error('Error saving award:', err);
    }
  }

  return { inserted, duplicates };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source = 'all' } = await req.json().catch(() => ({}));
    
    console.log(`Starting historical awards scrape for source: ${source}`);
    
    let allAwards: HistoricalAward[] = [];
    
    if (source === 'all' || source === 'egp_kenya') {
      const egpAwards = await scrapeEgpAwards();
      allAwards.push(...egpAwards);
    }
    
    if (source === 'all' || source === 'ppra') {
      const ppraAwards = await scrapePpraAwards();
      allAwards.push(...ppraAwards);
    }
    
    // Save to database
    const { inserted, duplicates } = await saveAwards(allAwards);
    
    // Log automation
    await supabase.from('automation_logs').insert({
      function_name: 'historical-awards-scraper',
      status: 'completed',
      result_data: {
        source,
        total_scraped: allAwards.length,
        inserted,
        duplicates,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Historical awards scraper completed`,
        data: {
          total_scraped: allAwards.length,
          inserted,
          duplicates,
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in historical awards scraper:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
