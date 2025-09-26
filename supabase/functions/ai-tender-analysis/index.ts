import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AnalysisRequest {
  tenderId: number;
}

// Simple analysis without HuggingFace dependency for now
const analyzeWithBasicLogic = (tender: any) => {
  // Basic estimation based on budget and category
  const baseWinRate = 65; // Default win probability
  const categoryMultipliers: Record<string, number> = {
    'construction': 0.9,
    'consulting': 1.1,
    'supplies': 1.0,
    'services': 1.05,
    'technology': 0.95
  };
  
  const multiplier = categoryMultipliers[tender.category?.toLowerCase()] || 1.0;
  const winProbability = Math.min(95, Math.max(15, Math.round(baseWinRate * multiplier)));
  
  // Estimate value based on budget with some variance
  const budgetEstimate = tender.budget_estimate || 1000000;
  const minValue = Math.round(budgetEstimate * 0.8);
  const maxValue = Math.round(budgetEstimate * 1.2);
  
  const recommendations = generateRecommendations(tender, winProbability);
  
  return {
    win_probability: winProbability,
    estimated_value_min: minValue,
    estimated_value_max: maxValue,
    confidence_score: 75,
    recommendations
  };
};

const generateRecommendations = (tender: any, winProbability: number): string[] => {
  const recommendations: string[] = [];
  
  // Base recommendations
  recommendations.push('Focus on demonstrating relevant experience');
  recommendations.push('Highlight cost-effectiveness in proposal');
  recommendations.push('Ensure all requirements are addressed');
  
  // Category-specific recommendations
  if (tender.category) {
    const category = tender.category.toLowerCase();
    if (category.includes('construction')) {
      recommendations.push('Emphasize safety record and certifications');
    } else if (category.includes('consulting')) {
      recommendations.push('Showcase team expertise and methodology');
    } else if (category.includes('technology')) {
      recommendations.push('Demonstrate innovation and scalability');
    }
  }
  
  // Budget-based recommendations
  if (tender.budget_estimate) {
    if (tender.budget_estimate > 10000000) {
      recommendations.push('Consider strategic partnerships for large-scale delivery');
    } else if (tender.budget_estimate < 1000000) {
      recommendations.push('Focus on efficient delivery and competitive pricing');
    }
  }
  
  // Win probability recommendations
  if (winProbability < 50) {
    recommendations.push('Consider unique value propositions to improve competitiveness');
  } else if (winProbability > 80) {
    recommendations.push('Leverage strong position for premium pricing');
  }
  
  return recommendations.slice(0, 5);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId }: AnalysisRequest = await req.json();
    
    console.log(`Starting AI analysis for tender ${tenderId}`);

    // Get tender details
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();

    if (tenderError || !tender) {
      throw new Error(`Tender not found: ${tenderError?.message}`);
    }

    // Check if analysis already exists
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('tender_id', tenderId)
      .single();

    if (existingAnalysis) {
      console.log(`Returning existing analysis for tender ${tenderId}`);
      return new Response(JSON.stringify(existingAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Perform analysis using basic logic
    console.log('Performing tender analysis...');
    const analysisResult = analyzeWithBasicLogic(tender);

    // Save analysis to database
    const { data: savedAnalysis, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        tender_id: tenderId,
        win_probability: analysisResult.win_probability,
        estimated_value_min: analysisResult.estimated_value_min,
        estimated_value_max: analysisResult.estimated_value_max,
        confidence_score: analysisResult.confidence_score,
        recommendations: analysisResult.recommendations,
        analysis_data: analysisResult,
        model_version: 'basic-v1'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving analysis:', saveError);
      throw new Error(`Failed to save analysis: ${saveError.message}`);
    }

    console.log(`Analysis completed for tender ${tenderId}`);

    return new Response(JSON.stringify(savedAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ai-tender-analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});