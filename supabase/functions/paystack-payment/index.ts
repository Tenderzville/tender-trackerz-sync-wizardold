import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Subscription plans in KES
const PLANS = {
  pro: {
    name: 'Pro',
    amount: 260000, // KES 2,600 in kobo
    interval: 'monthly',
    features: ['unlimited_alerts', 'ai_analysis', 'save_unlimited', 'consortium', 'rfq_3'],
  },
  business: {
    name: 'Business',
    amount: 650000, // KES 6,500 in kobo
    interval: 'monthly',
    features: ['all_pro', 'unlimited_rfq', 'marketplace', 'api_access', 'white_label'],
  },
  pro_annual: {
    name: 'Pro Annual',
    amount: 2496000, // KES 24,960 (20% off)
    interval: 'annually',
    features: ['unlimited_alerts', 'ai_analysis', 'save_unlimited', 'consortium', 'rfq_3'],
  },
  business_annual: {
    name: 'Business Annual',
    amount: 6240000, // KES 62,400 (20% off)
    interval: 'annually',
    features: ['all_pro', 'unlimited_rfq', 'marketplace', 'api_access', 'white_label'],
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'initialize': {
        // Initialize a payment transaction
        const { email, plan, user_id, callback_url } = params;
        
        if (!email || !plan || !user_id) {
          throw new Error('email, plan, and user_id are required');
        }

        const planDetails = PLANS[plan as keyof typeof PLANS];
        if (!planDetails) {
          throw new Error('Invalid plan');
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            amount: planDetails.amount,
            currency: 'KES',
            callback_url: callback_url || `${req.headers.get('origin')}/subscription/callback`,
            metadata: {
              user_id,
              plan,
              plan_name: planDetails.name,
              custom_fields: [
                {
                  display_name: 'Plan',
                  variable_name: 'plan',
                  value: planDetails.name,
                },
              ],
            },
          }),
        });

        const data = await response.json();
        
        if (!data.status) {
          throw new Error(data.message || 'Failed to initialize payment');
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              authorization_url: data.data.authorization_url,
              access_code: data.data.access_code,
              reference: data.data.reference,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        // Verify a completed payment
        const { reference } = params;
        
        if (!reference) {
          throw new Error('reference is required');
        }

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${paystackSecretKey}`,
          },
        });

        const data = await response.json();
        
        if (!data.status) {
          throw new Error(data.message || 'Verification failed');
        }

        if (data.data.status === 'success') {
          // Update user subscription
          const metadata = data.data.metadata;
          const plan = metadata?.plan || 'pro';
          const userId = metadata?.user_id;

          if (userId) {
            const subscriptionType = plan.includes('business') ? 'business' : 'pro';
            const now = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.includes('annual') ? 12 : 1));

            await supabase
              .from('profiles')
              .update({
                subscription_type: subscriptionType,
                subscription_status: 'active',
                subscription_start_date: now.toISOString(),
                subscription_end_date: endDate.toISOString(),
              })
              .eq('id', userId);

            // Log the payment
            await supabase.from('automation_logs').insert({
              function_name: 'paystack-payment',
              status: 'completed',
              result_data: {
                action: 'subscription_activated',
                user_id: userId,
                plan: subscriptionType,
                amount: data.data.amount,
                reference,
              },
            });
          }

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                status: 'success',
                plan: metadata?.plan,
                amount: data.data.amount / 100,
                currency: data.data.currency,
                message: 'Subscription activated successfully!',
              },
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            error: `Payment ${data.data.status}`,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      case 'webhook': {
        // Handle Paystack webhooks
        const event = params;
        
        if (event.event === 'charge.success') {
          const metadata = event.data?.metadata;
          const userId = metadata?.user_id;
          const plan = metadata?.plan;

          if (userId && plan) {
            const subscriptionType = plan.includes('business') ? 'business' : 'pro';
            const now = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.includes('annual') ? 12 : 1));

            await supabase
              .from('profiles')
              .update({
                subscription_type: subscriptionType,
                subscription_status: 'active',
                subscription_start_date: now.toISOString(),
                subscription_end_date: endDate.toISOString(),
              })
              .eq('id', userId);
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'check_access': {
        // Check if user has active subscription
        const { user_id } = params;
        
        if (!user_id) {
          throw new Error('user_id is required');
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_type, subscription_status, subscription_end_date')
          .eq('id', user_id)
          .single();

        if (!profile) {
          return new Response(
            JSON.stringify({ success: true, data: { has_access: false, reason: 'no_profile' } }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const hasAccess = 
          profile.subscription_status === 'active' &&
          ['pro', 'business'].includes(profile.subscription_type || '') &&
          (!profile.subscription_end_date || new Date(profile.subscription_end_date) > new Date());

        return new Response(
          JSON.stringify({
            success: true,
            data: {
              has_access: hasAccess,
              subscription_type: profile.subscription_type,
              subscription_status: profile.subscription_status,
              expires: profile.subscription_end_date,
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Paystack error:', error);
    
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
