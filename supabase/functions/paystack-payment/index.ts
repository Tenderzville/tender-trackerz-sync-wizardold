import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-version, x-paystack-signature',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset, x-api-version',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===== RATE LIMITING (in-memory for edge function performance) =====
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT = 30; // 30 requests per minute
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(identifier: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now - entry.windowStart > RATE_WINDOW_MS) {
    rateLimitMap.set(identifier, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

// ===== WEBHOOK SIGNATURE VERIFICATION (HMAC SHA-512) =====
async function verifyPaystackSignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature || !paystackSecretKey) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(paystackSecretKey),
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const hex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return hex === signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// ===== STRUCTURED ERROR LOGGING =====
async function logError(functionName: string, error: any, req?: Request, userId?: string) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    const ipAddress = req?.headers.get('x-forwarded-for') || null;

    await supabase.from('error_logs').insert({
      function_name: functionName,
      error_message: errorMessage,
      error_stack: errorStack,
      request_metadata: { url: req?.url, method: req?.method },
      severity: 'error',
      user_id: userId,
      ip_address: ipAddress,
    });
  } catch (logEx) {
    console.error('Failed to log error:', logEx);
  }
}

// Subscription plans in KES (amount in kobo = KES * 100)
const PLANS: Record<string, any> = {
  pro: { name: 'Pro', amount: 50000, interval: 'monthly', tier_level: 1, features: ['unlimited_alerts', 'ai_analysis', 'save_unlimited', 'consortium', 'rfq_3'] },
  business: { name: 'Business', amount: 150000, interval: 'monthly', tier_level: 2, features: ['all_pro', 'unlimited_rfq', 'marketplace', 'api_access', 'white_label'] },
  pro_annual: { name: 'Pro Annual', amount: 480000, interval: 'annually', tier_level: 1, features: ['unlimited_alerts', 'ai_analysis', 'save_unlimited', 'consortium', 'rfq_3'] },
  business_annual: { name: 'Business Annual', amount: 1440000, interval: 'annually', tier_level: 2, features: ['all_pro', 'unlimited_rfq', 'marketplace', 'api_access', 'white_label'] },
};

function getPlanTierLevel(planType: string | null): number {
  if (!planType) return 0;
  if (planType === 'business') return 2;
  if (planType === 'pro') return 1;
  return 0;
}

const API_VERSION = 'v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    if (!paystackSecretKey) {
      throw new Error('PAYSTACK_SECRET_KEY not configured');
    }

    // Clone body for signature verification (webhook needs raw body)
    const rawBody = await req.text();
    let parsedBody: any;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ success: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-API-Version': API_VERSION },
      });
    }

    const { action, ...params } = parsedBody;

    // ===== RATE LIMITING (skip for webhooks — Paystack retries) =====
    if (action !== 'webhook') {
      const rl = checkRateLimit(ipAddress);
      if (!rl.allowed) {
        return new Response(JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'Retry-After': '60',
            'X-API-Version': API_VERSION,
          },
        });
      }
    }

    const responseHeaders = { ...corsHeaders, 'Content-Type': 'application/json', 'X-API-Version': API_VERSION };

    switch (action) {
      // ========== AD PAYMENT ==========
      case 'initialize_ad_payment': {
        const { email, user_id, ad_id, amount, callback_url } = params;
        if (!email || !user_id || !ad_id) throw new Error('email, user_id, and ad_id are required');

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${paystackSecretKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            amount: amount || 100000,
            currency: 'KES',
            callback_url: callback_url || `${req.headers.get('origin')}/marketplace`,
            metadata: { user_id, ad_id, payment_type: 'ad_payment', custom_fields: [{ display_name: 'Ad Payment', variable_name: 'ad_id', value: String(ad_id) }] },
          }),
        });
        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'Failed to initialize payment');

        return new Response(JSON.stringify({ success: true, data: { authorization_url: data.data.authorization_url, reference: data.data.reference } }), { headers: responseHeaders });
      }

      case 'verify_ad_payment': {
        const { reference } = params;
        if (!reference) throw new Error('reference is required');

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
        });
        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'Verification failed');

        if (data.data.status === 'success') {
          const adId = data.data.metadata?.ad_id;
          const userId = data.data.metadata?.user_id;
          if (adId) {
            await supabase.from('service_provider_ads').update({
              payment_status: 'paid',
              payment_reference: reference,
            }).eq('id', Number(adId));

            const { data: admins } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
            for (const admin of admins || []) {
              await supabase.from('user_alerts').insert({
                user_id: admin.user_id,
                type: 'ad_payment_received',
                title: '💰 Ad Payment Received',
                message: `A service provider has paid KSh 1,000 for ad #${adId}. Please review and activate it.`,
                is_read: false,
                data: { ad_id: adId, reference, paid_by: userId },
              });
            }

            if (userId) {
              await supabase.from('user_alerts').insert({
                user_id: userId,
                type: 'ad_payment_confirmed',
                title: '✅ Ad Payment Confirmed',
                message: `Your payment of KSh 1,000 for ad #${adId} was successful. An admin will review and activate your ad shortly.`,
                is_read: false,
                data: { ad_id: adId, reference },
              });
            }
          }
          return new Response(JSON.stringify({ success: true, data: { status: 'success', message: 'Payment confirmed. Admin will activate your ad.' } }), { headers: responseHeaders });
        }

        return new Response(JSON.stringify({ success: false, error: `Payment ${data.data.status}` }), { headers: responseHeaders, status: 400 });
      }

      // ========== SUBSCRIPTION PAYMENT ==========
      case 'initialize': {
        const { email, plan, user_id, callback_url } = params;
        if (!email || !plan || !user_id) throw new Error('email, plan, and user_id are required');

        const planDetails = PLANS[plan];
        if (!planDetails) throw new Error('Invalid plan');

        const { data: profile } = await supabase.from('profiles').select('subscription_locked, lock_reason, subscription_type, is_founding_member, founding_member_expires_at').eq('id', user_id).single();

        if (profile?.subscription_locked && profile?.lock_reason === 'founding_member_free_period') {
          const expiresAt = new Date(profile.founding_member_expires_at);
          if (expiresAt > new Date()) throw new Error(`You're a Founding Member with free access until ${expiresAt.toLocaleDateString()}.`);
        }

        const currentTier = getPlanTierLevel(profile?.subscription_type);
        if (currentTier > planDetails.tier_level && profile?.subscription_type !== 'free') {
          throw new Error(`Downgrades are not allowed. Contact support.`);
        }

        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${paystackSecretKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            amount: planDetails.amount,
            currency: 'KES',
            callback_url: callback_url || `${req.headers.get('origin')}/subscription/callback`,
            metadata: { user_id, plan, plan_name: planDetails.name, tier_level: planDetails.tier_level, custom_fields: [{ display_name: 'Plan', variable_name: 'plan', value: planDetails.name }] },
          }),
        });

        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'Failed to initialize payment');

        await supabase.from('subscription_history').insert({ user_id, action: 'payment_initialized', from_plan: profile?.subscription_type || 'free', to_plan: plan.includes('business') ? 'business' : 'pro', amount: planDetails.amount / 100, currency: 'KES', payment_reference: data.data.reference, metadata: { plan, access_code: data.data.access_code } });

        return new Response(JSON.stringify({ success: true, data: { authorization_url: data.data.authorization_url, access_code: data.data.access_code, reference: data.data.reference } }), { headers: responseHeaders });
      }

      case 'verify': {
        const { reference } = params;
        if (!reference) throw new Error('reference is required');

        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: { 'Authorization': `Bearer ${paystackSecretKey}` },
        });
        const data = await response.json();
        if (!data.status) throw new Error(data.message || 'Verification failed');

        if (data.data.status === 'success') {
          const metadata = data.data.metadata;

          if (metadata?.payment_type === 'ad_payment') {
            const adId = metadata?.ad_id;
            if (adId) {
              await supabase.from('service_provider_ads').update({ payment_status: 'paid', payment_reference: reference }).eq('id', Number(adId));
            }
            return new Response(JSON.stringify({ success: true, data: { status: 'success', message: 'Ad payment confirmed. Admin will activate your ad.' } }), { headers: responseHeaders });
          }

          const plan = metadata?.plan || 'pro';
          const userId = metadata?.user_id;

          if (userId) {
            const subscriptionType = plan.includes('business') ? 'business' : 'pro';
            const now = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.includes('annual') ? 12 : 1));

            const { data: currentProfile } = await supabase.from('profiles').select('subscription_type, is_founding_member').eq('id', userId).single();

            await supabase.from('profiles').update({
              subscription_type: subscriptionType,
              subscription_status: 'active',
              subscription_start_date: now.toISOString(),
              subscription_end_date: endDate.toISOString(),
              subscription_locked: false,
              lock_reason: null,
              paystack_customer_code: data.data.customer?.customer_code,
              is_founding_member: false,
              founding_member_expires_at: null,
            }).eq('id', userId);

            await supabase.from('subscription_history').insert({ user_id: userId, action: 'subscription_activated', from_plan: currentProfile?.subscription_type || 'free', to_plan: subscriptionType, amount: data.data.amount / 100, currency: data.data.currency, payment_reference: reference, metadata: { plan, paystack_reference: reference, customer_code: data.data.customer?.customer_code } });

            const receiptNumber = `TPA-${Date.now().toString(36).toUpperCase()}`;
            const amountPaid = data.data.amount / 100;
            await supabase.from('user_alerts').insert({ user_id: userId, type: 'payment_receipt', title: '🧾 Payment Receipt', message: `Receipt #${receiptNumber} - ${data.data.currency || 'KES'} ${amountPaid.toLocaleString()} paid for ${subscriptionType} plan. Valid until ${endDate.toLocaleDateString()}.`, is_read: false, data: { receipt_number: receiptNumber, amount: amountPaid, plan: subscriptionType, payment_reference: reference, subscription_end: endDate.toISOString() } });
            await supabase.from('user_alerts').insert({ user_id: userId, type: 'subscription_activated', title: '🎉 Subscription Activated!', message: `Your ${subscriptionType} subscription is now active until ${endDate.toLocaleDateString()}.`, is_read: false, data: { plan: subscriptionType, expires: endDate.toISOString() } });
          }

          return new Response(JSON.stringify({ success: true, data: { status: 'success', plan: metadata?.plan, amount: data.data.amount / 100, currency: data.data.currency, message: 'Subscription activated successfully!' } }), { headers: responseHeaders });
        }

        return new Response(JSON.stringify({ success: false, error: `Payment ${data.data.status}` }), { headers: responseHeaders, status: 400 });
      }

      // ========== WEBHOOK (with HMAC SHA-512 signature verification) ==========
      case 'webhook': {
        // Verify Paystack webhook signature
        const signature = req.headers.get('x-paystack-signature');
        const isValid = await verifyPaystackSignature(rawBody, signature);

        if (!isValid) {
          console.error('Invalid Paystack webhook signature');
          await logError('paystack-payment', 'Invalid webhook signature — possible attack', req);
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: responseHeaders });
        }

        const event = params;
        if (event.event === 'charge.success') {
          const metadata = event.data?.metadata;

          if (metadata?.payment_type === 'ad_payment') {
            const adId = metadata?.ad_id;
            if (adId) {
              await supabase.from('service_provider_ads').update({ payment_status: 'paid', payment_reference: event.data?.reference }).eq('id', Number(adId));
            }
            return new Response(JSON.stringify({ received: true }), { headers: responseHeaders });
          }

          const userId = metadata?.user_id;
          const plan = metadata?.plan;
          if (userId && plan) {
            const subscriptionType = plan.includes('business') ? 'business' : 'pro';
            const now = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + (plan.includes('annual') ? 12 : 1));

            await supabase.from('profiles').update({ subscription_type: subscriptionType, subscription_status: 'active', subscription_start_date: now.toISOString(), subscription_end_date: endDate.toISOString(), subscription_locked: false, lock_reason: null, is_founding_member: false }).eq('id', userId);
          }
        }

        return new Response(JSON.stringify({ received: true }), { headers: responseHeaders });
      }

      case 'check_access': {
        const { user_id } = params;
        if (!user_id) throw new Error('user_id is required');

        const { data: profile } = await supabase.from('profiles').select('subscription_type, subscription_status, subscription_end_date, is_founding_member, founding_member_expires_at, subscription_locked').eq('id', user_id).single();

        if (!profile) {
          return new Response(JSON.stringify({ success: true, data: { has_access: false, reason: 'no_profile' } }), { headers: responseHeaders });
        }

        const now = new Date();
        let hasAccess = false;
        let reason = 'no_subscription';

        if (profile.is_founding_member && profile.founding_member_expires_at) {
          const foundingExpires = new Date(profile.founding_member_expires_at);
          if (foundingExpires > now) { hasAccess = true; reason = 'founding_member'; }
        }

        if (!hasAccess && profile.subscription_status === 'active' && ['pro', 'business'].includes(profile.subscription_type || '')) {
          if (!profile.subscription_end_date || new Date(profile.subscription_end_date) > now) { hasAccess = true; reason = 'active_subscription'; }
        }

        return new Response(JSON.stringify({ success: true, data: { has_access: hasAccess, reason, subscription_type: profile.subscription_type, subscription_status: profile.subscription_status, expires: profile.subscription_end_date, is_founding_member: profile.is_founding_member, is_locked: profile.subscription_locked } }), { headers: responseHeaders });
      }

      case 'request_downgrade': {
        const { user_id, reason } = params;
        if (!user_id) throw new Error('user_id is required');

        await supabase.from('user_alerts').insert({ user_id, type: 'downgrade_request', title: '📋 Downgrade Request Received', message: 'Our support team will contact you within 24 hours.', is_read: false, data: { reason, requested_at: new Date().toISOString() } });

        return new Response(JSON.stringify({ success: true, message: 'Downgrade request submitted.' }), { headers: responseHeaders });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('Paystack error:', error);
    await logError('paystack-payment', error, req);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-API-Version': API_VERSION }, status: 500 });
  }
});
