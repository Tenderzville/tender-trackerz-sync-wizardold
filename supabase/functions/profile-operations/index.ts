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

    const { operation, data: profileData } = await req.json();

    switch (operation) {
      case 'get': {
        const { data, error } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { data, error } = await supabaseClient
          .from('profiles')
          .update(profileData)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-subscription': {
        const { subscription_type, subscription_status, paypal_subscription_id } = profileData;
        
        const updates: any = {
          subscription_type,
          subscription_status,
          updated_at: new Date().toISOString(),
        };

        if (paypal_subscription_id) {
          updates.paypal_subscription_id = paypal_subscription_id;
        }

        if (subscription_status === 'active') {
          updates.subscription_start_date = new Date().toISOString();
          // Set end date to 1 month from now
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          updates.subscription_end_date = endDate.toISOString();
        }

        const { data, error } = await supabaseClient
          .from('profiles')
          .update(updates)
          .eq('id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add-loyalty-points': {
        const { points } = profileData;
        
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('loyalty_points')
          .eq('id', user.id)
          .single();

        const currentPoints = profile?.loyalty_points || 0;
        
        const { data, error } = await supabaseClient
          .from('profiles')
          .update({ 
            loyalty_points: currentPoints + points,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select()
          .single();

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
