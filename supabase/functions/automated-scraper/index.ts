import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Automated Scraper - orchestrates tender scraping and notifications.
 * Called by pg_cron at 8 AM and 8 PM EAT daily.
 * Delegates to firecrawl-tender-scraper then triggers Telegram notifications.
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

    console.log('Starting automated tender scraping via firecrawl...');

    // Use the firecrawl-based scraper for real data from all sources
    const { data, error } = await supabaseClient.functions.invoke('firecrawl-tender-scraper', {
      body: { source: 'all' },
    });

    if (error) {
      console.error('Error calling firecrawl-tender-scraper:', error);
      throw error;
    }

    const savedCount = data?.stats?.totalSaved || 0;
    console.log('Scraping result:', JSON.stringify(data));

    // Log the automation run
    await supabaseClient
      .from('automation_logs')
      .insert([{
        function_name: 'automated-scraper',
        status: 'completed',
        result_data: data,
        executed_at: new Date().toISOString(),
      }]);

    // Send Telegram notifications for new tenders
    if (savedCount > 0) {
      console.log(`Triggering Telegram notifications for ${savedCount} new tenders...`);
      try {
        const { data: tgData, error: tgError } = await supabaseClient.functions.invoke('telegram-tender-notify', {
          body: { count: savedCount },
        });
        if (tgError) {
          console.error('Telegram notification error (non-blocking):', tgError);
        } else {
          console.log('Telegram notification result:', tgData);
        }
      } catch (tgErr) {
        console.error('Telegram notification failed (non-blocking):', tgErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Automated scraping completed. ${savedCount} new tenders saved.`,
        result: data,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in automated scraper:', error);

    // Log the error
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      await supabaseClient
        .from('automation_logs')
        .insert([{
          function_name: 'automated-scraper',
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error occurred',
          executed_at: new Date().toISOString(),
        }]);
    } catch (_) { /* best effort logging */ }

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
