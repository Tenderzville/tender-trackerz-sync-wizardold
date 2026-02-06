import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserPreferences {
  sectors: string[];
  counties: string[];
  budget_min: number | null;
  budget_max: number | null;
  keywords: string[];
  eligibility_types: string[];
  notification_email: boolean;
  notification_push: boolean;
  notification_sms: boolean;
}

interface TenderMatch {
  tender: any;
  matchScore: number;
  matchReasons: string[];
  matchLevel: 'High Chance' | 'Good Fit' | 'Moderate' | 'Low Fit';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, userId } = await req.json();
    console.log(`Smart matcher: action=${action}, userId=${userId}`);

    if (action === 'match-tenders') {
      // Get user preferences from dedicated table
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Also get inferred preferences from saved tenders
      const { data: savedTenders } = await supabase
        .from('saved_tenders')
        .select('tenders(*)')
        .eq('user_id', userId)
        .limit(50);

      // Build preference profile
      const preferences: UserPreferences = {
        sectors: userPrefs?.sectors || [],
        counties: userPrefs?.counties || [],
        budget_min: userPrefs?.budget_min,
        budget_max: userPrefs?.budget_max,
        keywords: userPrefs?.keywords || [],
        eligibility_types: userPrefs?.eligibility_types || [],
        notification_email: userPrefs?.notification_email ?? true,
        notification_push: userPrefs?.notification_push ?? true,
        notification_sms: userPrefs?.notification_sms ?? false,
      };

      // Infer additional preferences from saved tenders
      const inferredCategories = new Set(preferences.sectors);
      const inferredLocations = new Set(preferences.counties);
      const inferredKeywords = new Set(preferences.keywords.map(k => k.toLowerCase()));

      savedTenders?.forEach((st: any) => {
        if (st.tenders?.category) inferredCategories.add(st.tenders.category);
        if (st.tenders?.location) inferredLocations.add(st.tenders.location);
        // Extract keywords from saved tender titles
        const words = st.tenders?.title?.toLowerCase().split(/\s+/) || [];
        words.filter((w: string) => w.length > 5).forEach((w: string) => inferredKeywords.add(w));
      });

      console.log(`User preferences: ${inferredCategories.size} categories, ${inferredLocations.size} locations, ${inferredKeywords.size} keywords`);

      // Get all active tenders
      const { data: tenders, error } = await supabase
        .from('tenders')
        .select('*')
        .eq('status', 'active')
        .gte('deadline', new Date().toISOString().split('T')[0])
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Smart matching algorithm
      const matches: TenderMatch[] = [];

      for (const tender of tenders || []) {
        let matchScore = 0;
        const matchReasons: string[] = [];

        // 1. Category/Sector match (30 points)
        if (inferredCategories.has(tender.category)) {
          matchScore += 30;
          matchReasons.push(`Sector match: ${tender.category}`);
        }

        // 2. Location/County match (25 points)
        if (inferredLocations.has(tender.location)) {
          matchScore += 25;
          matchReasons.push(`Location: ${tender.location}`);
        }

        // 3. Budget range match (20 points)
        const budget = tender.budget_estimate || 0;
        const budgetMin = preferences.budget_min || 0;
        const budgetMax = preferences.budget_max || Infinity;
        
        if (budget >= budgetMin && budget <= budgetMax) {
          matchScore += 20;
          matchReasons.push(`Budget: KES ${(budget / 1000000).toFixed(1)}M (within range)`);
        } else if (budget > 0) {
          // Partial match if close to range
          const distanceFromRange = budget < budgetMin 
            ? (budgetMin - budget) / budgetMin 
            : (budget - budgetMax) / budgetMax;
          if (distanceFromRange < 0.3) {
            matchScore += 10;
            matchReasons.push(`Budget close to preferences`);
          }
        }

        // 4. Keyword match (15 points per keyword, max 30)
        const tenderText = `${tender.title} ${tender.description} ${tender.organization}`.toLowerCase();
        let keywordMatches = 0;
        for (const keyword of inferredKeywords) {
          if (tenderText.includes(keyword) && keywordMatches < 2) {
            matchScore += 15;
            keywordMatches++;
            if (keywordMatches === 1) {
              matchReasons.push(`Keyword match: "${keyword}"`);
            }
          }
        }

        // 5. Deadline urgency scoring
        const daysUntilDeadline = Math.ceil(
          (new Date(tender.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        
        if (daysUntilDeadline <= 7 && daysUntilDeadline > 0) {
          matchScore += 15;
          matchReasons.push(`🔥 Urgent: ${daysUntilDeadline} days left`);
        } else if (daysUntilDeadline <= 14) {
          matchScore += 10;
          matchReasons.push(`⏰ ${daysUntilDeadline} days remaining`);
        }

        // 6. Organization reputation boost (if they've saved from same org before)
        const savedFromSameOrg = savedTenders?.some(
          (st: any) => st.tenders?.organization === tender.organization
        );
        if (savedFromSameOrg) {
          matchScore += 10;
          matchReasons.push(`Previously interested in ${tender.organization}`);
        }

        // 7. Recency bonus for newly posted tenders
        const hoursOld = (Date.now() - new Date(tender.created_at).getTime()) / (1000 * 60 * 60);
        if (hoursOld <= 24) {
          matchScore += 10;
          matchReasons.push(`🆕 Posted today`);
        } else if (hoursOld <= 72) {
          matchScore += 5;
          matchReasons.push(`Recently posted`);
        }

        // Determine match level
        let matchLevel: TenderMatch['matchLevel'];
        if (matchScore >= 80) {
          matchLevel = 'High Chance';
        } else if (matchScore >= 55) {
          matchLevel = 'Good Fit';
        } else if (matchScore >= 35) {
          matchLevel = 'Moderate';
        } else {
          matchLevel = 'Low Fit';
        }

        // Only include matches with reasonable scores
        if (matchScore >= 25) {
          matches.push({ tender, matchScore, matchReasons, matchLevel });
        }
      }

      // Sort by match score
      matches.sort((a, b) => b.matchScore - a.matchScore);

      console.log(`Found ${matches.length} matching tenders for user`);

      // Create alerts for top matches (new ones only)
      const alertsCreated: number[] = [];
      for (const match of matches.slice(0, 10)) {
        if (match.matchScore < 40) continue; // Only alert for good+ matches

        // Check if alert already exists
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
              title: `${match.matchLevel}: ${match.tender.title.substring(0, 60)}...`,
              message: match.matchReasons.slice(0, 3).join(' • '),
              data: {
                tender_id: match.tender.id,
                match_score: match.matchScore,
                match_level: match.matchLevel,
                match_reasons: match.matchReasons,
                tender_deadline: match.tender.deadline,
                tender_budget: match.tender.budget_estimate,
              },
              is_read: false,
            })
            .select('id')
            .single();

          if (!alertError && alert) {
            alertsCreated.push(alert.id);
            console.log(`Created alert for tender: ${match.tender.id}`);
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          totalTenders: tenders?.length || 0,
          matchesFound: matches.length,
          alertsCreated: alertsCreated.length,
          preferences: {
            categories: Array.from(inferredCategories),
            locations: Array.from(inferredLocations),
            keywordCount: inferredKeywords.size,
          },
          topMatches: matches.slice(0, 20).map(m => ({
            id: m.tender.id,
            title: m.tender.title,
            organization: m.tender.organization,
            category: m.tender.category,
            location: m.tender.location,
            deadline: m.tender.deadline,
            budget: m.tender.budget_estimate,
            score: m.matchScore,
            level: m.matchLevel,
            reasons: m.matchReasons,
            source_url: m.tender.source_url,
          })),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'run-for-all-users') {
      // Run matching for all users with preferences
      const { data: allUsers } = await supabase
        .from('user_preferences')
        .select('user_id')
        .or('notification_email.eq.true,notification_push.eq.true');

      let totalAlerts = 0;
      const processedUsers: string[] = [];

      for (const user of allUsers || []) {
        try {
          // Recursive call for each user
          const matchResult = await supabase.functions.invoke('smart-tender-matcher', {
            body: { action: 'match-tenders', userId: user.user_id },
          });

          if (matchResult.data?.alertsCreated) {
            totalAlerts += matchResult.data.alertsCreated;
            processedUsers.push(user.user_id);
          }
        } catch (userError) {
          console.error(`Error processing user ${user.user_id}:`, userError);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          usersProcessed: processedUsers.length,
          totalAlertsCreated: totalAlerts,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action. Use: match-tenders, run-for-all-users' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in smart-tender-matcher:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
