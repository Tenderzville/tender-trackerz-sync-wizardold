import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Tender Scraper - delegates to firecrawl-tender-scraper for real data extraction.
 * NO synthetic/backup data generation - strictly real data only.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json().catch(() => ({}));
    const source = body.source || 'all';

    console.log(`Tender scraper invoked for source: ${source}`);
    console.log('Delegating to firecrawl-tender-scraper for real data extraction...');

    // Delegate to the Firecrawl-based scraper which handles:
    // - MyGov (mygov.go.ke)
    // - tenders.go.ke
    // - e-GP Kenya (egpkenya.go.ke)
    // - PPRA (ppra.go.ke)
    const { data, error } = await supabaseClient.functions.invoke('firecrawl-tender-scraper', {
      body: { source },
    });

    if (error) {
      console.error('Error from firecrawl-tender-scraper:', error);
      throw error;
    }

    const savedCount = data?.stats?.totalSaved || 0;
    console.log(`Firecrawl scraper result: ${savedCount} new tenders saved`);

    // If new tenders were saved, send Telegram notifications
    if (savedCount > 0) {
      console.log('Sending Telegram notifications for new tenders...');
      try {
        await supabaseClient.functions.invoke('telegram-tender-notify', {
          body: { count: savedCount },
        });
      } catch (tgErr) {
        console.error('Telegram notification failed (non-blocking):', tgErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...data,
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
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});
