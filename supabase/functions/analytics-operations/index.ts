import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { operation, data: analyticsData } = await req.json();

    switch (operation) {
      case 'track-tender-view': {
        const { tender_id } = analyticsData;
        
        // Get or create analytics record
        const { data: existing } = await supabaseClient
          .from('tender_analytics')
          .select('*')
          .eq('tender_id', tender_id)
          .single();

        if (existing) {
          const { error } = await supabaseClient
            .from('tender_analytics')
            .update({
              views_count: existing.views_count + 1,
              last_viewed: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from('tender_analytics')
            .insert({
              tender_id,
              views_count: 1,
              last_viewed: new Date().toISOString(),
            });

          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'track-tender-save': {
        const { tender_id } = analyticsData;
        
        const { data: existing } = await supabaseClient
          .from('tender_analytics')
          .select('*')
          .eq('tender_id', tender_id)
          .single();

        if (existing) {
          const { error } = await supabaseClient
            .from('tender_analytics')
            .update({
              saves_count: existing.saves_count + 1,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id);

          if (error) throw error;
        } else {
          const { error } = await supabaseClient
            .from('tender_analytics')
            .insert({
              tender_id,
              saves_count: 1,
            });

          if (error) throw error;
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-dashboard-stats': {
        // Get user's saved tenders count
        const { count: savedCount } = await supabaseClient
          .from('saved_tenders')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get active tenders count
        const { count: activeTendersCount } = await supabaseClient
          .from('tenders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get user's RFQs count
        const { count: rfqCount } = await supabaseClient
          .from('rfqs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Get user's consortiums count
        const { count: consortiumCount } = await supabaseClient
          .from('consortium_members')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        return new Response(JSON.stringify({
          data: {
            savedTenders: savedCount || 0,
            activeTenders: activeTendersCount || 0,
            rfqs: rfqCount || 0,
            consortiums: consortiumCount || 0,
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get-trending-tenders': {
        const { data, error } = await supabaseClient
          .from('tender_analytics')
          .select(`
            *,
            tenders (*)
          `)
          .order('views_count', { ascending: false })
          .limit(10);

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid operation' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
