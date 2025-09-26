import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cron } from "https://deno.land/x/deno_cron@v1.0.0/cron.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting automated tender scraping...');
    
    // Call the tender-scraper function
    const { data, error } = await supabaseClient.functions.invoke('tender-scraper', {
      body: { source: 'all' }
    });

    if (error) {
      console.error('Error calling tender-scraper:', error);
      throw error;
    }

    console.log('Scraping result:', data);

    // Log the automation run
    await supabaseClient
      .from('automation_logs')
      .insert([{
        function_name: 'tender-scraper',
        status: 'completed',
        result_data: data,
        executed_at: new Date().toISOString()
      }]);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Automated scraping completed',
        result: data
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in automated scraper:', error);
    
    // Log the error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    await supabaseClient
      .from('automation_logs')
      .insert([{
        function_name: 'tender-scraper',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred',
        executed_at: new Date().toISOString()
      }]);

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

// Set up cron job to run daily at 6 AM UTC
cron('0 6 * * *', async () => {
  console.log('Daily tender scraping triggered by cron...');
  
  try {
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/automated-scraper`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trigger: 'cron' })
    });
    
    console.log('Cron scraping completed with status:', response.status);
  } catch (error) {
    console.error('Cron scraping failed:', error);
  }
});