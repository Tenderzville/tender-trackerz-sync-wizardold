import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserPreferences {
  sectors?: string[];
  counties?: string[];
  budgetMin?: number;
  budgetMax?: number;
  keywords?: string[];
  eligibility?: string[];
}

interface TenderMatch {
  tender: any;
  matchScore: number;
  matchReasons: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId, preferences } = await req.json();

    if (action === 'check-matches') {
      // Get user preferences
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get user's saved tender categories to infer preferences
      const { data: savedTenders } = await supabase
        .from('saved_tenders')
        .select('tenders(*)')
        .eq('user_id', userId)
        .limit(20);

      // Infer user preferences from saved tenders
      const inferredCategories = new Set<string>();
      const inferredLocations = new Set<string>();
      
      savedTenders?.forEach((st: any) => {
        if (st.tenders?.category) inferredCategories.add(st.tenders.category);
        if (st.tenders?.location) inferredLocations.add(st.tenders.location);
      });

      // Get new tenders from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const { data: newTenders, error } = await supabase
        .from('tenders')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Match tenders to user preferences
      const matches: TenderMatch[] = [];

      for (const tender of newTenders || []) {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // Category match
        if (inferredCategories.has(tender.category)) {
          matchScore += 30;
          matchReasons.push(`Matches your interest in ${tender.category}`);
        }

        // Location match
        if (inferredLocations.has(tender.location)) {
          matchScore += 25;
          matchReasons.push(`Located in ${tender.location}`);
        }

        // Budget range match (if preferences provided)
        if (preferences?.budgetMin && preferences?.budgetMax) {
          const budget = tender.budget_estimate || 0;
          if (budget >= preferences.budgetMin && budget <= preferences.budgetMax) {
            matchScore += 20;
            matchReasons.push('Within your budget range');
          }
        }

        // Keyword match
        if (preferences?.keywords?.length) {
          const tenderText = `${tender.title} ${tender.description}`.toLowerCase();
          for (const keyword of preferences.keywords) {
            if (tenderText.includes(keyword.toLowerCase())) {
              matchScore += 15;
              matchReasons.push(`Contains keyword: ${keyword}`);
              break;
            }
          }
        }

        // Add deadline urgency bonus
        const daysUntilDeadline = Math.ceil(
          (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          matchScore += 10;
          matchReasons.push(`Urgent: ${daysUntilDeadline} days left`);
        }

        if (matchScore >= 25) {
          matches.push({ tender, matchScore, matchReasons });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      // Create alerts for top matches
      const alertsCreated: number[] = [];
      for (const match of matches.slice(0, 5)) {
        const { data: existingAlert } = await supabase
          .from('user_alerts')
          .select('id')
          .eq('user_id', userId)
          .eq('type', 'tender_match')
          .contains('data', { tender_id: match.tender.id })
          .maybeSingle();

        if (!existingAlert) {
          const { data: alert, error: alertError } = await supabase
            .from('user_alerts')
            .insert({
              user_id: userId,
              type: 'tender_match',
              title: `New Matching Tender: ${match.tender.title.substring(0, 50)}...`,
              message: match.matchReasons.join('. '),
              data: {
                tender_id: match.tender.id,
                match_score: match.matchScore,
                match_reasons: match.matchReasons,
              },
            })
            .select('id')
            .single();

          if (!alertError && alert) {
            alertsCreated.push(alert.id);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          matchesFound: matches.length,
          alertsCreated: alertsCreated.length,
          topMatches: matches.slice(0, 5).map(m => ({
            id: m.tender.id,
            title: m.tender.title,
            score: m.matchScore,
            reasons: m.matchReasons,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get-alerts') {
      const { data: alerts, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, alerts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'mark-read') {
      const { alertId } = await req.json();
      
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in tender-notifications:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
