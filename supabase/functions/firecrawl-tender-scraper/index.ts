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
  sourceUrl?: string;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source } = await req.json().catch(() => ({ source: 'all' }));
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: ScrapeResult[] = [];
    let totalProcessed = 0;
    let totalSaved = 0;

    // Define sources to scrape
    const sources = [
      {
        name: 'mygov',
        url: 'https://www.mygov.go.ke/all-tenders',
        enabled: source === 'all' || source === 'mygov',
      },
      {
        name: 'tenders.go.ke',
        url: 'https://tenders.go.ke/',
        enabled: source === 'all' || source === 'tenders.go.ke',
      },
      {
        name: 'egpkenya',
        url: 'https://egpkenya.go.ke/tender',
        enabled: source === 'all' || source === 'egpkenya',
      },
      {
        name: 'ppra',
        url: 'https://ppra.go.ke/contract-awards/',
        enabled: source === 'all' || source === 'ppra',
      },
    ];

    for (const src of sources.filter(s => s.enabled)) {
      console.log(`Scraping ${src.name} from ${src.url}`);
      
      try {
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: src.url,
            formats: ['markdown', 'html'],
            onlyMainContent: true,
            waitFor: 3000,
          }),
        });

        if (!scrapeResponse.ok) {
          const errorText = await scrapeResponse.text();
          console.error(`Error scraping ${src.name}:`, errorText);
          results.push({ source: src.name, tenders: [], error: errorText });
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const markdown = scrapeData.data?.markdown || scrapeData.markdown || '';
        const html = scrapeData.data?.html || scrapeData.html || '';
        
        console.log(`Scraped ${src.name}, got ${markdown.length} chars of markdown`);

        // Parse tenders from the scraped content
        const tenders = await parseTendersFromContent(src.name, markdown, html, FIRECRAWL_API_KEY);
        results.push({ source: src.name, tenders });

        // Save valid tenders to database
        for (const tender of tenders) {
          totalProcessed++;
          
          // Check for duplicates
          const { data: existing } = await supabase
            .from('tenders')
            .select('id')
            .or(`title.eq.${tender.title},source_url.eq.${tender.sourceUrl || ''}`)
            .maybeSingle();

          if (!existing) {
            const { error: insertError } = await supabase
              .from('tenders')
              .insert({
                title: tender.title,
                description: tender.description,
                organization: tender.organization,
                category: tender.category,
                location: tender.location,
                deadline: tender.deadline,
                budget_estimate: tender.budgetEstimate,
                requirements: tender.requirements || [],
                source_url: tender.sourceUrl,
                scraped_from: tender.scrapedFrom,
                tender_number: tender.tenderNumber,
                contact_email: tender.contactEmail,
                contact_phone: tender.contactPhone,
                status: 'active',
              });

            if (!insertError) {
              totalSaved++;
              console.log(`Saved tender: ${tender.title.substring(0, 50)}...`);
            } else {
              console.error('Insert error:', insertError);
            }
          } else {
            console.log(`Duplicate found: ${tender.title.substring(0, 50)}...`);
          }
        }
      } catch (srcError) {
        console.error(`Error processing ${src.name}:`, srcError);
        results.push({ 
          source: src.name, 
          tenders: [], 
          error: srcError instanceof Error ? srcError.message : 'Unknown error' 
        });
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
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function parseTendersFromContent(
  source: string, 
  markdown: string, 
  html: string,
  apiKey: string
): Promise<TenderData[]> {
  // Use AI to extract structured tender data from the content
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || markdown.length < 100) {
    console.log('Not enough content or no AI key, using pattern matching');
    return extractTendersWithPatterns(source, markdown, html);
  }

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
            content: `Extract all tenders from this ${source} government website content. Return a JSON array of tenders.

Each tender should have:
- title (required): The EXACT tender title/description as written on the page
- organization (required): The EXACT procuring entity name as written
- category: One of: Construction, ICT, Consultancy, Supply, Transport, Healthcare, Education, Agriculture, Environment, Other
- location: County or region in Kenya (default: "Nairobi" if not specified)
- deadline: Date in YYYY-MM-DD format (estimate 30 days from now if not specified)
- budgetEstimate: Number in KES (estimate if not specified based on tender type)
- tenderNumber: Official reference/tender number if available
- description: Brief description of what's being procured
- sourceLink: The SPECIFIC URL or link path to this individual tender page if visible in the content (e.g., /tender/12345 or https://tenders.go.ke/tender/12345). Return null if no specific link found.

IMPORTANT: Extract the EXACT title and organization name verbatim. Do NOT generate or paraphrase.

CONTENT TO PARSE:
${markdown.substring(0, 8000)}

Respond ONLY with a valid JSON array. Example:
[{"title":"Supply of Office Equipment","organization":"Ministry of Finance","category":"Supply","location":"Nairobi","deadline":"2025-02-15","budgetEstimate":5000000,"tenderNumber":"MOF/ONT/001/2025","sourceLink":"/tender/12345"}]

If no tenders found, return empty array: []`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      console.error('AI extraction failed:', response.status);
      return extractTendersWithPatterns(source, markdown, html);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    // Parse JSON from response
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }
    
    const tenders = JSON.parse(jsonStr.trim());
    
    // Add source info and validate
    const baseUrl = source === 'mygov' ? 'https://www.mygov.go.ke' 
      : source === 'ppra' ? 'https://ppra.go.ke' 
      : 'https://tenders.go.ke';
    
    return tenders.map((t: any) => {
      // Build specific source URL - priority: explicit link > tender number search > base
      let specificUrl = baseUrl;
      if (t.sourceLink && t.sourceLink.startsWith('http')) {
        specificUrl = t.sourceLink;
      } else if (t.sourceLink && t.sourceLink.startsWith('/')) {
        specificUrl = `${baseUrl}${t.sourceLink}`;
      } else if (t.tenderNumber) {
        // Always construct a specific URL using the tender number
        specificUrl = `https://tenders.go.ke/website/tender/search/item/detail/${encodeURIComponent(t.tenderNumber)}`;
      }

      return {
        title: t.title || 'Untitled Tender',
        description: t.description || `${t.title} - Procurement opportunity from ${t.organization}`,
        organization: t.organization || 'Government of Kenya',
        category: validateCategory(t.category),
        location: t.location || 'Nairobi',
        deadline: validateDate(t.deadline),
        budgetEstimate: t.budgetEstimate || estimateBudget(t.category),
        scrapedFrom: source,
        sourceUrl: specificUrl,
        tenderNumber: t.tenderNumber,
        requirements: t.requirements || [],
      };
    });
  } catch (error) {
    console.error('AI parsing error:', error);
    return extractTendersWithPatterns(source, markdown, html);
  }
}

function extractTendersWithPatterns(source: string, markdown: string, html: string): TenderData[] {
  const tenders: TenderData[] = [];
  
  const baseUrl = source === 'mygov' ? 'https://www.mygov.go.ke' 
    : source === 'ppra' ? 'https://ppra.go.ke' 
    : source === 'egpkenya' ? 'https://egpkenya.go.ke'
    : 'https://tenders.go.ke';

  // Try to extract links from HTML for specific tender URLs
  const linkPattern = /<a[^>]+href=["']([^"']*(?:tender|bid|procurement)[^"']*)["'][^>]*>([^<]+)<\/a>/gi;
  const htmlLinks = new Map<string, string>();
  let linkMatch;
  while ((linkMatch = linkPattern.exec(html)) !== null) {
    const href = linkMatch[1];
    const text = linkMatch[2].trim();
    if (text.length > 10) {
      const fullUrl = href.startsWith('http') ? href : `${baseUrl}${href.startsWith('/') ? '' : '/'}${href}`;
      htmlLinks.set(text.toLowerCase().substring(0, 50), fullUrl);
    }
  }

  // Pattern-based extraction for common tender formats
  const tenderPatterns = [
    /(?:tender|procurement|supply|provision|construction|consultancy)\s+(?:for|of)\s+([^|.\n]+)/gi,
    /(?:invitation\s+to\s+(?:tender|bid|quote))[:\s]+([^|.\n]+)/gi,
  ];

  for (const pattern of tenderPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 10) {
        const title = match[1].trim().substring(0, 200);
        // Try to find a matching link
        const matchedLink = htmlLinks.get(title.toLowerCase().substring(0, 50));

        tenders.push({
          title,
          description: `Procurement opportunity: ${title}`,
          organization: 'Government of Kenya',
          category: 'Other',
          location: 'Nairobi',
          deadline: getFutureDate(30),
          budgetEstimate: undefined,
          scrapedFrom: source,
          sourceUrl: matchedLink || baseUrl,
        });
      }
    }
  }

  // Limit to prevent duplicates
  return tenders.slice(0, 10);
}

function validateCategory(category: string): string {
  const validCategories = ['Construction', 'ICT', 'Consultancy', 'Supply', 'Transport', 'Healthcare', 'Education', 'Agriculture', 'Environment', 'Other'];
  if (validCategories.includes(category)) return category;
  
  // Map common variations
  const categoryMap: Record<string, string> = {
    'it': 'ICT', 'technology': 'ICT', 'software': 'ICT', 'hardware': 'ICT',
    'building': 'Construction', 'infrastructure': 'Construction', 'roads': 'Construction',
    'goods': 'Supply', 'equipment': 'Supply', 'materials': 'Supply',
    'services': 'Consultancy', 'professional': 'Consultancy',
    'medical': 'Healthcare', 'hospital': 'Healthcare', 'pharmaceutical': 'Healthcare',
    'school': 'Education', 'training': 'Education',
  };
  
  const lowerCategory = (category || '').toLowerCase();
  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) return value;
  }
  
  return 'Other';
}

function validateDate(dateStr: string): string {
  if (!dateStr) return getFutureDate(30);
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return getFutureDate(30);
    if (date < new Date()) return getFutureDate(30); // If past, set future date
    return date.toISOString().split('T')[0];
  } catch {
    return getFutureDate(30);
  }
}

function estimateBudget(category: string): number {
  const budgetRanges: Record<string, [number, number]> = {
    'Construction': [10000000, 100000000],
    'ICT': [2000000, 50000000],
    'Consultancy': [1000000, 20000000],
    'Supply': [500000, 30000000],
    'Transport': [3000000, 40000000],
    'Healthcare': [5000000, 80000000],
    'Education': [2000000, 25000000],
    'Other': [1000000, 20000000],
  };
  
  const range = budgetRanges[category] || budgetRanges['Other'];
  return Math.floor(range[0] + Math.random() * (range[1] - range[0]));
}

function getFutureDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}
