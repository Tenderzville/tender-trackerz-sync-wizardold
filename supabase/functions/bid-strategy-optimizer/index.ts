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

interface OptimizationRequest {
  tenderId: number;
}

// Generate bid strategy using business logic
const generateBidStrategy = (tender: any, analysis?: any) => {
  const strategies = [];
  const timeline = [];
  
  // Base strategy based on category
  const categoryStrategies: Record<string, string[]> = {
    'construction': [
      'Highlight safety record and certifications',
      'Demonstrate local supplier relationships',
      'Show project timeline efficiency'
    ],
    'consulting': [
      'Emphasize relevant expertise and case studies',
      'Present clear methodology and deliverables',
      'Showcase team qualifications'
    ],
    'technology': [
      'Focus on innovation and scalability',
      'Demonstrate security and compliance',
      'Show post-implementation support'
    ],
    'supplies': [
      'Competitive pricing with quality assurance',
      'Reliable delivery and logistics',
      'Volume discounts and long-term partnerships'
    ]
  };

  const baseStrategies = categoryStrategies[tender.category?.toLowerCase()] || [
    'Demonstrate value proposition clearly',
    'Show competitive advantages',
    'Ensure compliance with all requirements'
  ];

  strategies.push(...baseStrategies);

  // Pricing strategy based on budget
  const budget = tender.budget_estimate;
  if (budget) {
    if (budget > 10000000) { // Large project
      strategies.push('Consider strategic partnerships for large-scale delivery');
    } else if (budget < 1000000) { // Small project
      strategies.push('Focus on cost efficiency and quick turnaround');
    }
  }

  // Timeline recommendations
  const deadline = new Date(tender.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft > 0) {
    timeline.push(`Proposal due in ${daysLeft} days`);
    
    if (daysLeft <= 7) {
      timeline.push('URGENT: Finalize proposal immediately');
      timeline.push('Focus on key differentiators');
    } else if (daysLeft <= 14) {
      timeline.push('Start drafting proposal this week');
      timeline.push('Gather supporting documents');
    } else {
      timeline.push('Begin market research and competitor analysis');
      timeline.push('Develop comprehensive proposal strategy');
    }
  }

  return {
    strategies,
    timeline,
    competitiveAnalysis: {
      marketPosition: analysis?.win_probability ? 
        analysis.win_probability > 70 ? 'Strong' : 
        analysis.win_probability > 40 ? 'Moderate' : 'Challenging' : 'Unknown',
      recommendedApproach: budget && budget > 5000000 ? 'Partnership' : 'Direct bid',
      keyFactors: ['Price competitiveness', 'Technical capability', 'Past performance']
    }
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId }: OptimizationRequest = await req.json();
    
    console.log(`Generating bid strategy for tender ${tenderId}`);

    // Get tender details
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();

    if (tenderError || !tender) {
      throw new Error(`Tender not found: ${tenderError?.message}`);
    }

    // Get existing analysis if available
    const { data: analysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('tender_id', tenderId)
      .single();

    console.log('Generating bid strategy...');
    
    // Generate strategy using business logic
    const strategy = generateBidStrategy(tender, analysis);

    console.log(`Strategy generated for tender ${tenderId}`);

    return new Response(JSON.stringify(strategy), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in bid-strategy-optimizer:', error);
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