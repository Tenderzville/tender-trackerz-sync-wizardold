import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedTender {
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  budget_estimate?: number;
  deadline: string;
  tender_number?: string;
  requirements?: string[];
  contact_email?: string;
  source_url?: string;
  scraped_from: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { source } = await req.json();
    
    console.log(`Starting tender scraping for source: ${source || 'all'}`);
    
    let scrapedTenders: ScrapedTender[] = [];

    if (!source || source === 'tenders.go.ke') {
      scrapedTenders = scrapedTenders.concat(await scrapeTendersGoKe());
    }

    if (!source || source === 'mygov') {
      scrapedTenders = scrapedTenders.concat(await scrapeMyGov());
    }

    // Save scraped tenders to database
    const savedTenders = [];
    
    for (const tender of scrapedTenders) {
      try {
        // Check if tender already exists
        const { data: existingTender } = await supabaseClient
          .from('tenders')
          .select('id')
          .eq('tender_number', tender.tender_number)
          .single();

        if (!existingTender) {
          const { data, error } = await supabaseClient
            .from('tenders')
            .insert([tender])
            .select()
            .single();

          if (error) {
            console.error('Error saving tender:', error);
          } else {
            savedTenders.push(data);
          }
        }
      } catch (error) {
        console.error('Error processing tender:', error);
      }
    }

    console.log(`Scraping completed. Processed ${scrapedTenders.length} tenders, saved ${savedTenders.length} new ones.`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: scrapedTenders.length,
        saved: savedTenders.length,
        tenders: savedTenders
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in tender scraper:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});

async function scrapeTendersGoKe(): Promise<ScrapedTender[]> {
  const tenders: ScrapedTender[] = [];
  
  try {
    console.log('Scraping tenders.go.ke...');
    const response = await fetch('https://tenders.go.ke/api/ocds/tenders?fy=2024-2025', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; TenderAlert/1.0)',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch tenders.go.ke:', response.status);
      return [];
    }

    const data = await response.json();
    
    if (data?.data && Array.isArray(data.data)) {
      for (const item of data.data) {
        try {
          const tender: ScrapedTender = {
            title: item.tender_name || item.title || '',
            description: item.tender_description || item.description || '',
            organization: item.procuring_entity || item.organization || '',
            category: item.tender_category || item.category || 'General',
            location: item.county || item.location || 'Kenya',
            budget_estimate: parseFloat(item.tender_value) || null,
            deadline: item.closing_date || item.deadline || '',
            tender_number: item.tender_no || item.reference_number || '',
            requirements: [],
            contact_email: item.contact_person || '',
            source_url: 'https://tenders.go.ke/',
            scraped_from: 'tenders.go.ke'
          };

          if (tender.title && tender.deadline) {
            tenders.push(tender);
          }
        } catch (error) {
          console.error('Error parsing tender from tenders.go.ke:', error);
        }
      }
    }

    console.log(`Found ${tenders.length} tenders from tenders.go.ke`);
    return tenders;
  } catch (error) {
    console.error('Error scraping tenders.go.ke:', error);
    return [];
  }
}

async function scrapeMyGov(): Promise<ScrapedTender[]> {
  // Note: MyGov scraping would require a more sophisticated approach
  // For now, return empty array as it requires browser automation
  console.log('MyGov scraping not implemented in edge function (requires Puppeteer)');
  return [];
}