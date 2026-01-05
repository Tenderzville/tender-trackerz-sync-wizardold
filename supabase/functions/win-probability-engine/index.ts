import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kenya inflation rates (CBK historical data)
const INFLATION_RATES: Record<number, number> = {
  2019: 5.2, 2020: 5.4, 2021: 6.1, 2022: 7.6, 2023: 7.7, 2024: 6.9, 2025: 5.5, 2026: 5.0
};

const CURRENT_YEAR = 2026;

interface WinProbabilityResult {
  tenderId: number;
  tenderTitle: string;
  winProbability: number;
  confidence: number;
  percentageError: number;
  estimatedBidRange: {
    low: number;
    optimal: number;
    high: number;
    inflationAdjusted: boolean;
  };
  historicalComparison: {
    similarContractsCount: number;
    avgAwardedAmount: number;
    avgInflationAdjusted: number;
    priceVariance: number;
    commonWinnerTypes: string[];
  };
  competitionLevel: string;
  factors: {
    categoryMatch: number;
    locationMatch: number;
    budgetFit: number;
    historicalTrend: number;
    competitionIntensity: number;
  };
  disclaimer: string;
}

// Adjust amount for inflation to current year
function adjustToCurrentYear(amount: number, fromYear: number): number {
  let adjusted = amount;
  for (let year = fromYear; year < CURRENT_YEAR; year++) {
    const rate = INFLATION_RATES[year] || 5.0;
    adjusted *= (1 + rate / 100);
  }
  return Math.round(adjusted);
}

// Extract year from date
function getYear(dateStr: string | null): number {
  if (!dateStr) return CURRENT_YEAR - 1;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : CURRENT_YEAR - 1;
}

// Calculate standard deviation for variance
function calculateStdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - mean, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tender_id, category, location, budget_estimate } = await req.json();
    
    if (!tender_id) {
      throw new Error('tender_id is required');
    }

    // Get tender details
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tender_id)
      .single();

    if (tenderError || !tender) {
      throw new Error('Tender not found');
    }

    const tenderCategory = category || tender.category;
    const tenderLocation = location || tender.location;
    const tenderBudget = budget_estimate || tender.budget_estimate || 0;

    // Query historical awards for similar tenders
    let query = supabase
      .from('historical_tender_awards')
      .select('*')
      .eq('category', tenderCategory);

    // Add location filter if specific
    if (tenderLocation && tenderLocation !== 'Kenya') {
      query = query.or(`location.eq.${tenderLocation},location.eq.Kenya`);
    }

    const { data: historicalData, error: histError } = await query.limit(500);

    if (histError) {
      console.error('Historical query error:', histError);
    }

    const historicalAwards = historicalData || [];

    // Calculate inflation-adjusted amounts
    const adjustedAmounts = historicalAwards
      .filter(h => h.awarded_amount && h.awarded_amount > 0)
      .map(h => ({
        original: h.awarded_amount,
        adjusted: adjustToCurrentYear(h.awarded_amount, getYear(h.award_date)),
        year: getYear(h.award_date),
        winnerType: h.winner_type,
        competitionLevel: h.competition_level,
      }));

    // Calculate statistics
    const avgOriginal = adjustedAmounts.length > 0
      ? adjustedAmounts.reduce((sum, a) => sum + a.original, 0) / adjustedAmounts.length
      : 0;

    const avgAdjusted = adjustedAmounts.length > 0
      ? adjustedAmounts.reduce((sum, a) => sum + a.adjusted, 0) / adjustedAmounts.length
      : 0;

    const priceStdDev = calculateStdDev(adjustedAmounts.map(a => a.adjusted));
    const priceVariance = avgAdjusted > 0 ? (priceStdDev / avgAdjusted) * 100 : 30;

    // Calculate estimated bid range with margin
    const marginOfError = 0.15; // 15% base margin
    const inflationUncertainty = 0.05; // 5% additional for inflation
    const totalUncertainty = marginOfError + inflationUncertainty;

    const optimalBid = avgAdjusted > 0 ? avgAdjusted : tenderBudget;
    const lowBid = Math.round(optimalBid * (1 - totalUncertainty));
    const highBid = Math.round(optimalBid * (1 + totalUncertainty));

    // Winner type distribution
    const winnerTypeCounts: Record<string, number> = {};
    adjustedAmounts.forEach(a => {
      winnerTypeCounts[a.winnerType || 'unknown'] = (winnerTypeCounts[a.winnerType || 'unknown'] || 0) + 1;
    });
    const commonWinnerTypes = Object.entries(winnerTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    // Competition level analysis
    const competitionCounts = { low: 0, medium: 0, high: 0 };
    adjustedAmounts.forEach(a => {
      const level = a.competitionLevel || 'medium';
      competitionCounts[level as keyof typeof competitionCounts]++;
    });
    const dominantCompetition = Object.entries(competitionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'medium';

    // Calculate win probability factors (0-100 scale)
    const categoryMatchScore = historicalAwards.length > 0 ? 80 : 40;
    
    const locationMatches = historicalAwards.filter(h => 
      h.location === tenderLocation || h.location === 'Kenya'
    ).length;
    const locationMatchScore = historicalAwards.length > 0 
      ? Math.min(90, (locationMatches / historicalAwards.length) * 100)
      : 50;

    const budgetFitScore = tenderBudget > 0 && avgAdjusted > 0
      ? Math.max(20, 100 - Math.abs((tenderBudget - avgAdjusted) / avgAdjusted) * 50)
      : 50;

    const historicalTrendScore = adjustedAmounts.length >= 10 ? 75 
      : adjustedAmounts.length >= 5 ? 60 
      : adjustedAmounts.length >= 2 ? 45 
      : 30;

    const competitionScore = dominantCompetition === 'low' ? 80 
      : dominantCompetition === 'medium' ? 55 
      : 35;

    // Weighted win probability
    const winProbability = Math.round(
      categoryMatchScore * 0.25 +
      locationMatchScore * 0.20 +
      budgetFitScore * 0.20 +
      historicalTrendScore * 0.20 +
      competitionScore * 0.15
    );

    // Confidence based on data availability
    const confidence = Math.min(95, Math.max(30, 
      30 + (adjustedAmounts.length * 2) + (priceVariance < 30 ? 20 : 0)
    ));

    // Percentage error calculation
    const percentageError = Math.round(
      totalUncertainty * 100 + (priceVariance / 2) + (100 - confidence) / 5
    );

    const result: WinProbabilityResult = {
      tenderId: tender_id,
      tenderTitle: tender.title,
      winProbability: Math.min(95, Math.max(5, winProbability)),
      confidence,
      percentageError: Math.min(50, Math.max(10, percentageError)),
      estimatedBidRange: {
        low: lowBid,
        optimal: Math.round(optimalBid),
        high: highBid,
        inflationAdjusted: true,
      },
      historicalComparison: {
        similarContractsCount: adjustedAmounts.length,
        avgAwardedAmount: Math.round(avgOriginal),
        avgInflationAdjusted: Math.round(avgAdjusted),
        priceVariance: Math.round(priceVariance),
        commonWinnerTypes,
      },
      competitionLevel: dominantCompetition,
      factors: {
        categoryMatch: categoryMatchScore,
        locationMatch: Math.round(locationMatchScore),
        budgetFit: Math.round(budgetFitScore),
        historicalTrend: historicalTrendScore,
        competitionIntensity: competitionScore,
      },
      disclaimer: `⚠️ DISCLAIMER: These estimates are based on ${adjustedAmounts.length} historical contracts and include a ±${percentageError}% margin of error. Amounts are adjusted for inflation using CBK rates. This is NOT financial advice. Actual tender outcomes depend on many factors including technical capabilities, pricing strategy, competition, and evaluation criteria. ALWAYS conduct your own due diligence and consult professionals before bidding. TenderAlert Pro is not liable for any decisions made based on these estimates.`,
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Win probability error:', error);
    
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
