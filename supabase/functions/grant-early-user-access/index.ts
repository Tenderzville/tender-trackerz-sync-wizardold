import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EARLY_USER_LIMIT = 100;
const FREE_PERIOD_MONTHS = 12;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current early user count
    const { count: earlyUserCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_early_user', true);

    const currentCount = earlyUserCount || 0;
    console.log(`Current early user count: ${currentCount}/${EARLY_USER_LIMIT}`);

    // Check if user already has early user status
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, is_early_user, subscription_type, subscription_status')
      .eq('id', user_id)
      .single();

    if (existingProfile?.is_early_user) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User already has early user access',
          is_early_user: true,
          early_user_count: currentCount,
          spots_remaining: EARLY_USER_LIMIT - currentCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if spots available
    if (currentCount >= EARLY_USER_LIMIT) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Early user program is full. All 100 spots have been claimed.',
          is_early_user: false,
          early_user_count: currentCount,
          spots_remaining: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant early user access
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + FREE_PERIOD_MONTHS);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_early_user: true,
        subscription_type: 'pro',
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', user_id);

    if (updateError) {
      throw updateError;
    }

    // Create welcome notification
    await supabase.from('user_alerts').insert({
      user_id,
      type: 'early_user_welcome',
      title: '🎉 Welcome, Early Adopter!',
      message: `Congratulations! You're one of our first 100 users and have been granted FREE Pro access for 1 year! Enjoy all premium features including AI analysis, smart matching, and unlimited tender saves.`,
      is_read: false,
      data: { 
        early_user_number: currentCount + 1,
        free_until: endDate.toISOString()
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Early user access granted!',
        is_early_user: true,
        early_user_number: currentCount + 1,
        spots_remaining: EARLY_USER_LIMIT - currentCount - 1,
        free_until: endDate.toISOString(),
        subscription: {
          type: 'pro',
          status: 'active',
          end_date: endDate.toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Early user grant error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
