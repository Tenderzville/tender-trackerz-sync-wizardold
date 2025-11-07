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

    const { operation, data: rfqData } = await req.json();

    switch (operation) {
      case 'create-rfq': {
        const { data, error } = await supabaseClient
          .from('rfqs')
          .insert({
            ...rfqData,
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-rfq': {
        const { id, ...updates } = rfqData;
        const { data, error } = await supabaseClient
          .from('rfqs')
          .update(updates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete-rfq': {
        const { id } = rfqData;
        const { error } = await supabaseClient
          .from('rfqs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'submit-quote': {
        const { data, error } = await supabaseClient
          .from('rfq_quotes')
          .insert({
            ...rfqData,
            supplier_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Create notification for RFQ creator
        const { data: rfq } = await supabaseClient
          .from('rfqs')
          .select('user_id, title')
          .eq('id', rfqData.rfq_id)
          .single();

        if (rfq) {
          await supabaseClient
            .from('user_alerts')
            .insert({
              user_id: rfq.user_id,
              type: 'rfq_quote',
              title: 'New Quote Received',
              message: `A supplier has submitted a quote for your RFQ: ${rfq.title}`,
              data: { rfq_id: rfqData.rfq_id, quote_id: data.id },
            });
        }

        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update-quote': {
        const { id, ...updates } = rfqData;
        const { data, error } = await supabaseClient
          .from('rfq_quotes')
          .update(updates)
          .eq('id', id)
          .eq('supplier_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'accept-quote': {
        const { quote_id, rfq_id } = rfqData;
        
        // Verify user owns the RFQ
        const { data: rfq } = await supabaseClient
          .from('rfqs')
          .select('*')
          .eq('id', rfq_id)
          .eq('user_id', user.id)
          .single();

        if (!rfq) {
          return new Response(JSON.stringify({ error: 'RFQ not found or unauthorized' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update quote status
        const { data, error } = await supabaseClient
          .from('rfq_quotes')
          .update({ status: 'accepted' })
          .eq('id', quote_id)
          .select()
          .single();

        if (error) throw error;

        // Update RFQ status
        await supabaseClient
          .from('rfqs')
          .update({ status: 'awarded' })
          .eq('id', rfq_id);

        // Notify supplier
        await supabaseClient
          .from('user_alerts')
          .insert({
            user_id: data.supplier_id,
            type: 'quote_accepted',
            title: 'Quote Accepted!',
            message: `Your quote for RFQ has been accepted!`,
            data: { rfq_id, quote_id },
          });

        return new Response(JSON.stringify({ data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list-rfqs': {
        const { filters = {}, limit = 50, offset = 0 } = rfqData || {};
        let query = supabaseClient
          .from('rfqs')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (filters.my_rfqs) {
          query = query.eq('user_id', user.id);
        }
        if (filters.category) {
          query = query.eq('category', filters.category);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return new Response(JSON.stringify({ data, count }), {
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
