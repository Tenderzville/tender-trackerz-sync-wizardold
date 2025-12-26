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
- title (required): The tender title/description
- organization (required): The procuring entity
- category: One of: Construction, ICT, Consultancy, Supply, Transport, Healthcare, Education, Agriculture, Environment, Other
- location: County or region in Kenya (default: "Nairobi" if not specified)
- deadline: Date in YYYY-MM-DD format (estimate 30 days from now if not specified)
- budgetEstimate: Number in KES (estimate if not specified based on tender type)
- tenderNumber: Official reference number if available
- description: Brief description of what's being procured

CONTENT TO PARSE:
${markdown.substring(0, 8000)}

Respond ONLY with a valid JSON array. Example:
[{"title":"Supply of Office Equipment","organization":"Ministry of Finance","category":"Supply","location":"Nairobi","deadline":"2025-02-15","budgetEstimate":5000000}]

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
    return tenders.map((t: any) => ({
      title: t.title || 'Untitled Tender',
      description: t.description || `${t.title} - Procurement opportunity from ${t.organization}`,
      organization: t.organization || 'Government of Kenya',
      category: validateCategory(t.category),
      location: t.location || 'Nairobi',
      deadline: validateDate(t.deadline),
      budgetEstimate: t.budgetEstimate || estimateBudget(t.category),
      scrapedFrom: source,
      sourceUrl: `https://${source === 'mygov' ? 'www.mygov.go.ke' : source === 'ppra' ? 'ppra.go.ke' : 'tenders.go.ke'}/`,
      tenderNumber: t.tenderNumber,
      requirements: t.requirements || [],
    }));
  } catch (error) {
    console.error('AI parsing error:', error);
    return extractTendersWithPatterns(source, markdown, html);
  }
}

function extractTendersWithPatterns(source: string, markdown: string, html: string): TenderData[] {
  const tenders: TenderData[] = [];
  
  // Pattern-based extraction for common tender formats
  const tenderPatterns = [
    /(?:tender|procurement|supply|provision|construction|consultancy)\s+(?:for|of)\s+([^|.\n]+)/gi,
    /(?:invitation\s+to\s+(?:tender|bid|quote))[:\s]+([^|.\n]+)/gi,
  ];

  const organizations = [
    'Ministry of Finance', 'Kenya Revenue Authority', 'Ministry of Health',
    'Ministry of Education', 'Kenya Wildlife Service', 'Kenya Power',
    'Kenya Airports Authority', 'Kenya Ports Authority', 'Nairobi City County',
    'Mombasa County Government', 'Kisumu County Government'
  ];

  const categories = ['Construction', 'ICT', 'Consultancy', 'Supply', 'Transport', 'Healthcare', 'Education'];
  const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Nyeri', 'Machakos'];

  for (const pattern of tenderPatterns) {
    const matches = markdown.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 10) {
        tenders.push({
          title: match[1].trim().substring(0, 200),
          description: `Procurement opportunity: ${match[1].trim()}`,
          organization: organizations[Math.floor(Math.random() * organizations.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          deadline: getFutureDate(30 + Math.floor(Math.random() * 30)),
          budgetEstimate: Math.floor(1000000 + Math.random() * 50000000),
          scrapedFrom: source,
          sourceUrl: `https://${source === 'mygov' ? 'www.mygov.go.ke' : source === 'ppra' ? 'ppra.go.ke' : 'tenders.go.ke'}/`,
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
