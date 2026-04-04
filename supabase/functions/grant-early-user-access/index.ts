import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FOUNDING_MEMBER_LIMIT = 100;
const FREE_PERIOD_DAYS = 365; // 1 year free for first 100 users

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, action, email } = await req.json().catch(() => ({}));

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Action: check_status - Check founding member availability
    if (action === 'check_status') {
      const { count: foundingCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_founding_member', true);

      return new Response(
        JSON.stringify({
          success: true,
          founding_member_count: foundingCount || 0,
          spots_remaining: FOUNDING_MEMBER_LIMIT - (foundingCount || 0),
          is_available: (foundingCount || 0) < FOUNDING_MEMBER_LIMIT
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');

    if (!authHeader || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: adminRole, error: adminCheckError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', authData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (adminCheckError || !adminRole) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate target identity for grant actions
    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current founding member count
    const { count: foundingCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('is_founding_member', true);

    const currentCount = foundingCount || 0;
    console.log(`Founding members: ${currentCount}/${FOUNDING_MEMBER_LIMIT}`);

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;

    let profileQuery = supabase
      .from('profiles')
      .select('*');

    if (normalizedEmail) {
      profileQuery = profileQuery.ilike('email', normalizedEmail);
    } else {
      profileQuery = profileQuery.eq('id', user_id);
    }

    const { data: profile } = await profileQuery.single();

    if (!profile) {
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already is a founding member
    if (profile.is_founding_member) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'User is already a Founding Member',
          is_founding_member: true,
          founding_member_number: currentCount,
          expires_at: profile.founding_member_expires_at,
          spots_remaining: FOUNDING_MEMBER_LIMIT - currentCount
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if spots available
    if (currentCount >= FOUNDING_MEMBER_LIMIT) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Founding Members program is full. All 100 spots have been claimed.',
          is_founding_member: false,
          spots_remaining: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify business requirements
    // Business must have company name filled
    if (!profile.company || profile.company.trim().length < 2) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'verification_required',
          message: 'Company name is required for Founding Member access. Please complete your profile.',
          is_founding_member: false,
          spots_remaining: FOUNDING_MEMBER_LIMIT - currentCount
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Grant Founding Member access
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + FREE_PERIOD_DAYS);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_founding_member: true,
        is_early_user: true, // Backward compatibility
        founding_member_granted_at: now.toISOString(),
        founding_member_expires_at: expiresAt.toISOString(),
        company_verified: true,
        verified_at: now.toISOString(),
        subscription_type: 'pro',
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: expiresAt.toISOString(),
        subscription_locked: true, // Lock to prevent downgrade during free month
        lock_reason: 'founding_member_free_period',
        updated_at: now.toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      throw updateError;
    }

    // Log subscription history
    await supabase.from('subscription_history').insert({
      user_id: profile.id,
      action: 'founding_member_granted',
      from_plan: profile.subscription_type || 'free',
      to_plan: 'pro',
      amount: 0,
      currency: 'KES',
      metadata: {
        founding_member_number: currentCount + 1,
        free_period_days: FREE_PERIOD_DAYS,
        expires_at: expiresAt.toISOString()
      }
    });

    // Create welcome notification
    await supabase.from('user_alerts').insert({
      user_id: profile.id,
      type: 'founding_member_welcome',
      title: '🏆 Welcome, Founding Member!',
      message: `Congratulations! You're Founding Member #${currentCount + 1} of ${FOUNDING_MEMBER_LIMIT}! You've received 1 YEAR FREE Pro access. After your free year, you'll be prompted to subscribe to continue enjoying premium features.`,
      is_read: false,
      data: {
        founding_member_number: currentCount + 1,
        free_until: expiresAt.toISOString(),
        free_period_days: FREE_PERIOD_DAYS
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Founding Member access granted!',
        is_founding_member: true,
        user_id: profile.id,
        email: profile.email,
        founding_member_number: currentCount + 1,
        spots_remaining: FOUNDING_MEMBER_LIMIT - currentCount - 1,
        expires_at: expiresAt.toISOString(),
        free_period_days: FREE_PERIOD_DAYS,
        subscription: {
          type: 'pro',
          status: 'active',
          end_date: expiresAt.toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Founding member grant error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
