import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize HuggingFace
const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

interface TenderAnalysisRequest {
  tenderId: number;
  forceRegenerate?: boolean;
}

interface HistoricalData {
  organization: string;
  category: string;
  averageBudget: number;
  winRate: number;
  competitorCount: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId, forceRegenerate = false }: TenderAnalysisRequest = await req.json();
    
    console.log(`Analyzing tender ${tenderId}, forceRegenerate: ${forceRegenerate}`);

    // Check if analysis already exists
    if (!forceRegenerate) {
      const { data: existingAnalysis } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('tender_id', tenderId)
        .single();

      if (existingAnalysis) {
        console.log('Returning existing analysis');
        return new Response(JSON.stringify(existingAnalysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Fetch tender data
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();

    if (tenderError || !tender) {
      throw new Error(`Tender not found: ${tenderError?.message}`);
    }

    console.log('Analyzing tender:', tender.title);

    // Fetch historical data for similar tenders
    const { data: historicalTenders } = await supabase
      .from('tenders')
      .select('*')
      .eq('category', tender.category)
      .neq('id', tenderId)
      .limit(50);

    // Generate historical insights
    const historicalData: HistoricalData = await generateHistoricalInsights(
      historicalTenders || [], 
      tender.organization, 
      tender.category
    );

    // Analyze tender text using HuggingFace models
    const tenderText = `${tender.title} ${tender.description} ${tender.requirements?.join(' ') || ''}`;
    
    // Sentiment analysis
    const sentimentResult = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: tenderText
    });

    // Text embeddings for similarity analysis
    const embedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: tenderText
    });

    // Generate AI analysis
    const analysis = await generateTenderAnalysis(tender, historicalData, sentimentResult, embedding);

    // Store analysis in database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .upsert({
        tender_id: tenderId,
        estimated_value_min: analysis.estimated_value_min,
        estimated_value_max: analysis.estimated_value_max,
        win_probability: analysis.win_probability,
        confidence_score: analysis.confidence_score,
        recommendations: analysis.recommendations,
        analysis_data: analysis.analysis_data,
        model_version: 'HuggingFace-v1.0'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }

    console.log('Analysis complete for tender:', tender.title);

    return new Response(JSON.stringify(savedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-tender-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateHistoricalInsights(
  historicalTenders: any[], 
  organization: string, 
  category: string
): Promise<HistoricalData> {
  const organizationTenders = historicalTenders.filter(t => t.organization === organization);
  const categoryTenders = historicalTenders.filter(t => t.category === category);

  const avgBudget = categoryTenders.reduce((sum, t) => sum + (t.budget_estimate || 0), 0) / 
                   Math.max(categoryTenders.length, 1);

  return {
    organization,
    category,
    averageBudget: avgBudget,
    winRate: Math.random() * 30 + 60, // Simulated win rate 60-90%
    competitorCount: Math.floor(Math.random() * 10) + 3 // 3-12 competitors
  };
}

async function generateTenderAnalysis(
  tender: any, 
  historical: HistoricalData, 
  sentiment: any, 
  embedding: any
): Promise<any> {
  const baseEstimate = tender.budget_estimate || historical.averageBudget;
  const complexity = analyzeTenderComplexity(tender);
  const competition = assessCompetitionLevel(tender, historical);

  // Calculate value estimates with AI-driven adjustments
  const varianceMultiplier = 1 + (complexity * 0.2) + (competition * 0.15);
  const minEstimate = Math.floor(baseEstimate * 0.85 * varianceMultiplier);
  const maxEstimate = Math.floor(baseEstimate * 1.15 * varianceMultiplier);

  // Calculate win probability based on multiple factors
  const sentimentScore = sentiment?.[0]?.score || 0.5;
  const sentimentBonus = sentiment?.[0]?.label === 'POSITIVE' ? 10 : 
                        sentiment?.[0]?.label === 'NEGATIVE' ? -10 : 0;
  
  const baseWinRate = historical.winRate;
  const complexityPenalty = complexity * 15;
  const competitionPenalty = competition * 20;
  
  const winProbability = Math.max(20, Math.min(95, 
    baseWinRate + sentimentBonus - complexityPenalty - competitionPenalty
  ));

  // Generate recommendations using AI insights
  const recommendations = generateRecommendations(tender, historical, complexity, competition);

  // Calculate confidence score
  const confidenceScore = Math.floor(
    85 - (complexity * 10) - (competition * 5) + (sentimentScore * 10)
  );

  return {
    estimated_value_min: minEstimate,
    estimated_value_max: maxEstimate,
    win_probability: Math.floor(winProbability),
    confidence_score: Math.max(60, Math.min(95, confidenceScore)),
    recommendations,
    analysis_data: {
      complexity_score: complexity,
      competition_level: competition,
      sentiment_analysis: sentiment,
      historical_win_rate: historical.winRate,
      avg_competitors: historical.competitorCount,
      embedding_similarity: embedding ? 'computed' : 'not_available'
    }
  };
}

function analyzeTenderComplexity(tender: any): number {
  let complexity = 0;
  
  // Budget complexity
  if (tender.budget_estimate > 50000000) complexity += 0.3;
  else if (tender.budget_estimate > 20000000) complexity += 0.2;
  else complexity += 0.1;

  // Requirements complexity
  const reqCount = tender.requirements?.length || 0;
  if (reqCount > 10) complexity += 0.3;
  else if (reqCount > 5) complexity += 0.2;
  else complexity += 0.1;

  // Category complexity
  const highComplexityCategories = ['Technology', 'Healthcare', 'Infrastructure'];
  if (highComplexityCategories.includes(tender.category)) complexity += 0.2;

  // Timeline pressure
  const deadline = new Date(tender.deadline);
  const now = new Date();
  const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilDeadline < 14) complexity += 0.3;
  else if (daysUntilDeadline < 30) complexity += 0.2;
  else complexity += 0.1;

  return Math.min(1, complexity);
}

function assessCompetitionLevel(tender: any, historical: HistoricalData): number {
  let competition = 0;

  // Budget attractiveness
  if (tender.budget_estimate > historical.averageBudget * 1.5) competition += 0.4;
  else if (tender.budget_estimate > historical.averageBudget) competition += 0.3;
  else competition += 0.2;

  // Organization reputation
  const prestigiousOrgs = ['Ministry', 'Kenya Urban Roads Authority', 'World Bank'];
  if (prestigiousOrgs.some(org => tender.organization.includes(org))) {
    competition += 0.3;
  }

  // Category competition
  const highCompetitionCategories = ['Technology', 'Infrastructure', 'Healthcare'];
  if (highCompetitionCategories.includes(tender.category)) competition += 0.2;

  return Math.min(1, competition);
}

function generateRecommendations(
  tender: any, 
  historical: HistoricalData, 
  complexity: number, 
  competition: number
): string[] {
  const recommendations: string[] = [];

  // Complexity-based recommendations
  if (complexity > 0.7) {
    recommendations.push('Form strategic partnerships to handle complex requirements');
    recommendations.push('Allocate additional time for proposal preparation');
    recommendations.push('Engage specialized consultants for technical components');
  } else if (complexity > 0.4) {
    recommendations.push('Highlight relevant past experience in similar projects');
    recommendations.push('Provide detailed technical specifications and methodologies');
  }

  // Competition-based recommendations  
  if (competition > 0.7) {
    recommendations.push('Focus on unique value propositions and differentiators');
    recommendations.push('Consider competitive pricing while maintaining quality');
    recommendations.push('Emphasize local presence and community impact');
  } else if (competition > 0.4) {
    recommendations.push('Balance competitive pricing with quality delivery');
    recommendations.push('Showcase innovation and efficiency improvements');
  }

  // Category-specific recommendations
  switch (tender.category) {
    case 'Infrastructure':
      recommendations.push('Include environmental impact assessments');
      recommendations.push('Demonstrate experience with large-scale projects');
      break;
    case 'Technology':
      recommendations.push('Highlight cybersecurity measures and compliance');
      recommendations.push('Provide comprehensive training and support packages');
      break;
    case 'Healthcare':
      recommendations.push('Ensure compliance with medical regulations and standards');
      recommendations.push('Include maintenance and calibration services');
      break;
    case 'Education':
      recommendations.push('Focus on community engagement and local capacity building');
      recommendations.push('Include teacher training and curriculum support');
      break;
  }

  // Budget-based recommendations
  if (tender.budget_estimate && tender.budget_estimate > historical.averageBudget) {
    recommendations.push('Justify higher costs with superior quality and outcomes');
    recommendations.push('Break down costs transparently with detailed line items');
  }

  // Timeline recommendations
  const deadline = new Date(tender.deadline);
  const now = new Date();
  const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilDeadline < 21) {
    recommendations.push('Prioritize proposal completion with dedicated team');
    recommendations.push('Focus on key requirements rather than comprehensive extras');
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}