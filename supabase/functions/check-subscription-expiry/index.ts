import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    console.log(`Running subscription expiry check for ${todayStr}`);

    // Find expired subscriptions
    const { data: expiredSubs, error: expiredError } = await supabase
      .from('profiles')
      .select('id, email, first_name, subscription_type, subscription_end_date')
      .eq('subscription_status', 'active')
      .lt('subscription_end_date', todayStr);

    if (expiredError) {
      throw expiredError;
    }

    console.log(`Found ${expiredSubs?.length || 0} expired subscriptions`);

    // Update expired subscriptions
    if (expiredSubs && expiredSubs.length > 0) {
      const expiredIds = expiredSubs.map(s => s.id);
      
      await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'expired',
          subscription_type: 'free',
          updated_at: new Date().toISOString()
        })
        .in('id', expiredIds);

      // Create expiry notifications
      for (const sub of expiredSubs) {
        await supabase.from('user_alerts').insert({
          user_id: sub.id,
          type: 'subscription_expired',
          title: 'Subscription Expired',
          message: `Your ${sub.subscription_type} subscription has expired. Renew now to continue accessing premium features.`,
          is_read: false,
          data: { subscription_type: sub.subscription_type }
        });
      }
    }

    // Find subscriptions expiring in 7 days
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

    const { data: expiringSoon } = await supabase
      .from('profiles')
      .select('id, email, first_name, subscription_type, subscription_end_date')
      .eq('subscription_status', 'active')
      .gte('subscription_end_date', todayStr)
      .lte('subscription_end_date', sevenDaysStr);

    console.log(`Found ${expiringSoon?.length || 0} subscriptions expiring within 7 days`);

    // Send renewal reminders (only if not already sent today)
    if (expiringSoon && expiringSoon.length > 0) {
      for (const sub of expiringSoon) {
        // Check if reminder already sent today
        const { data: existingAlert } = await supabase
          .from('user_alerts')
          .select('id')
          .eq('user_id', sub.id)
          .eq('type', 'subscription_expiring')
          .gte('created_at', todayStr)
          .limit(1);

        if (!existingAlert || existingAlert.length === 0) {
          const daysRemaining = Math.ceil(
            (new Date(sub.subscription_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await supabase.from('user_alerts').insert({
            user_id: sub.id,
            type: 'subscription_expiring',
            title: 'Subscription Expiring Soon',
            message: `Your ${sub.subscription_type} subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}. Renew now to avoid service interruption.`,
            is_read: false,
            data: { 
              subscription_type: sub.subscription_type,
              days_remaining: daysRemaining,
              expiry_date: sub.subscription_end_date
            }
          });
        }
      }
    }

    // Find subscriptions expiring in 3 days (more urgent)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    const { data: expiringVerySOon } = await supabase
      .from('profiles')
      .select('id, email, first_name, subscription_type, subscription_end_date')
      .eq('subscription_status', 'active')
      .gte('subscription_end_date', todayStr)
      .lte('subscription_end_date', threeDaysStr);

    // Log results
    await supabase.from('automation_logs').insert({
      function_name: 'check-subscription-expiry',
      status: 'completed',
      result_data: {
        expired_count: expiredSubs?.length || 0,
        expiring_7_days: expiringSoon?.length || 0,
        expiring_3_days: expiringVerySOon?.length || 0,
        checked_at: todayStr
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription check completed',
        stats: {
          expired: expiredSubs?.length || 0,
          expiring_soon: expiringSoon?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Subscription check error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
