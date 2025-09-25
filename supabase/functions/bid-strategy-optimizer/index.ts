import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

interface BidStrategyRequest {
  tenderId: number;
  companyCapabilities: string[];
  historicalWinRate?: number;
  targetProfitMargin?: number;
}

interface BidStrategy {
  optimal_bid_amount: number;
  win_probability: number;
  profit_margin: number;
  risk_assessment: string;
  key_differentiators: string[];
  pricing_strategy: string;
  execution_timeline: string[];
  competitive_advantages: string[];
  potential_risks: string[];
  mitigation_strategies: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      tenderId, 
      companyCapabilities = [], 
      historicalWinRate = 70,
      targetProfitMargin = 15 
    }: BidStrategyRequest = await req.json();
    
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

    // Get AI analysis if available
    const { data: aiAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('tender_id', tenderId)
      .single();

    // Get similar tenders for benchmarking
    const { data: similarTenders } = await supabase
      .from('tenders')
      .select('*')
      .eq('category', tender.category)
      .neq('id', tenderId)
      .limit(20);

    console.log('Fetched tender data and similar tenders');

    // Analyze tender requirements using NLP
    const tenderText = `${tender.title} ${tender.description} ${tender.requirements?.join(' ') || ''}`;
    
    // Sentiment analysis for market conditions
    const sentimentResult = await hf.textClassification({
      model: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      inputs: tenderText
    });

    // Zero-shot classification for requirement analysis
    const requirementAnalysis = await hf.zeroShotClassification({
      model: 'facebook/bart-large-mnli',
      inputs: tenderText,
      parameters: {
        candidate_labels: [
          'technical complexity',
          'financial requirements',
          'time sensitive',
          'regulatory compliance',
          'innovation required',
          'partnership needed'
        ]
      }
    });

    console.log('Completed NLP analysis');

    // Generate bid strategy
    const strategy = await generateBidStrategy(
      tender,
      aiAnalysis,
      similarTenders || [],
      companyCapabilities,
      historicalWinRate,
      targetProfitMargin,
      sentimentResult,
      requirementAnalysis
    );

    console.log('Generated bid strategy');

    return new Response(JSON.stringify(strategy), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in bid-strategy-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateBidStrategy(
  tender: any,
  aiAnalysis: any,
  similarTenders: any[],
  capabilities: string[],
  historicalWinRate: number,
  targetProfitMargin: number,
  sentiment: any,
  requirements: any
): Promise<BidStrategy> {
  
  // Calculate base bid amount
  const baseBudget = tender.budget_estimate || calculateEstimatedBudget(similarTenders);
  const aiEstimate = aiAnalysis ? 
    (aiAnalysis.estimated_value_min + aiAnalysis.estimated_value_max) / 2 : 
    baseBudget;

  // Risk assessment based on various factors  
  const riskFactors = assessRiskFactors(tender, requirements, sentiment);
  const riskMultiplier = 1 + (riskFactors.totalRisk * 0.1);

  // Capability matching
  const capabilityMatch = assessCapabilityMatch(tender, capabilities, requirements);
  const capabilityMultiplier = 1 - (capabilityMatch.gap * 0.05);

  // Competitive analysis
  const competitiveFactors = analyzeCompetition(tender, similarTenders, historicalWinRate);

  // Calculate optimal bid
  const optimalBid = Math.floor(
    aiEstimate * 
    riskMultiplier * 
    capabilityMultiplier * 
    competitiveFactors.bidMultiplier
  );

  // Calculate win probability
  const baseWinProb = aiAnalysis?.win_probability || historicalWinRate;
  const adjustedWinProb = Math.max(10, Math.min(90, 
    baseWinProb + 
    capabilityMatch.bonus - 
    riskFactors.totalRisk * 5 - 
    competitiveFactors.competitionPenalty
  ));

  // Calculate profit margin
  const costs = optimalBid * (1 - targetProfitMargin / 100);
  const actualMargin = ((optimalBid - costs) / optimalBid) * 100;

  return {
    optimal_bid_amount: optimalBid,
    win_probability: Math.round(adjustedWinProb),
    profit_margin: Math.round(actualMargin * 100) / 100,
    risk_assessment: riskFactors.assessment,
    key_differentiators: generateDifferentiators(tender, capabilities, capabilityMatch),
    pricing_strategy: generatePricingStrategy(tender, competitiveFactors, riskFactors),
    execution_timeline: generateExecutionTimeline(tender),
    competitive_advantages: generateCompetitiveAdvantages(capabilities, capabilityMatch),
    potential_risks: riskFactors.risks,
    mitigation_strategies: generateMitigationStrategies(riskFactors, tender)
  };
}

function calculateEstimatedBudget(similarTenders: any[]): number {
  if (!similarTenders.length) return 10000000; // Default 10M KES
  
  const budgets = similarTenders
    .map(t => t.budget_estimate)
    .filter(b => b > 0);
  
  if (!budgets.length) return 10000000;
  
  return budgets.reduce((sum, b) => sum + b, 0) / budgets.length;
}

function assessRiskFactors(tender: any, requirements: any, sentiment: any) {
  const risks: string[] = [];
  let totalRisk = 0;

  // Timeline risk
  const deadline = new Date(tender.deadline);
  const now = new Date();
  const daysUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysUntilDeadline < 30) {
    risks.push('Tight deadline may increase execution risks');
    totalRisk += 0.3;
  }

  // Budget risk
  if (tender.budget_estimate > 50000000) {
    risks.push('Large budget requires significant financial capacity');
    totalRisk += 0.2;
  }

  // Complexity risk from requirements analysis
  const complexityScore = requirements?.scores?.find((s: any) => 
    s.label === 'technical complexity'
  )?.score || 0;
  
  if (complexityScore > 0.7) {
    risks.push('High technical complexity identified');
    totalRisk += 0.25;
  }

  // Market sentiment risk
  if (sentiment?.[0]?.label === 'NEGATIVE') {
    risks.push('Negative market sentiment detected');
    totalRisk += 0.15;
  }

  // Regulatory risk
  const regulatoryScore = requirements?.scores?.find((s: any) => 
    s.label === 'regulatory compliance'
  )?.score || 0;
  
  if (regulatoryScore > 0.6) {
    risks.push('Significant regulatory compliance requirements');
    totalRisk += 0.2;
  }

  const assessment = totalRisk > 0.6 ? 'High Risk' : 
                    totalRisk > 0.3 ? 'Medium Risk' : 'Low Risk';

  return { risks, totalRisk, assessment };
}

function assessCapabilityMatch(tender: any, capabilities: string[], requirements: any) {
  let matchScore = 0;
  let gap = 0;
  let bonus = 0;

  // Check if capabilities match tender category
  const categoryMatch = capabilities.some(cap => 
    cap.toLowerCase().includes(tender.category.toLowerCase())
  );
  
  if (categoryMatch) {
    matchScore += 0.3;
    bonus += 5;
  }

  // Check technical requirements
  const techScore = requirements?.scores?.find((s: any) => 
    s.label === 'technical complexity'
  )?.score || 0;

  const hasTechCapabilities = capabilities.some(cap => 
    ['technical', 'engineering', 'IT', 'technology'].some(keyword => 
      cap.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (techScore > 0.6 && !hasTechCapabilities) {
    gap += 0.4;
  } else if (techScore > 0.6 && hasTechCapabilities) {
    bonus += 10;
  }

  // Innovation requirements
  const innovationScore = requirements?.scores?.find((s: any) => 
    s.label === 'innovation required'
  )?.score || 0;

  const hasInnovationCap = capabilities.some(cap => 
    ['innovation', 'research', 'development', 'cutting-edge'].some(keyword => 
      cap.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (innovationScore > 0.6 && hasInnovationCap) {
    bonus += 8;
  }

  return { matchScore, gap, bonus };
}

function analyzeCompetition(tender: any, similarTenders: any[], historicalWinRate: number) {
  const avgBudget = calculateEstimatedBudget(similarTenders);
  const isHighValue = tender.budget_estimate > avgBudget * 1.5;
  
  let competitionPenalty = 0;
  let bidMultiplier = 1;

  if (isHighValue) {
    competitionPenalty = 15; // High competition expected
    bidMultiplier = 0.95; // More aggressive pricing needed
  }

  // Prestigious organizations attract more competition
  const prestigiousOrgs = ['Ministry', 'World Bank', 'Kenya Urban Roads Authority'];
  if (prestigiousOrgs.some(org => tender.organization.includes(org))) {
    competitionPenalty += 10;
    bidMultiplier *= 0.97;
  }

  return { competitionPenalty, bidMultiplier };
}

function generateDifferentiators(tender: any, capabilities: string[], capMatch: any): string[] {
  const differentiators: string[] = [];

  if (capMatch.bonus > 10) {
    differentiators.push('Strong technical expertise matching tender requirements');
  }

  if (capabilities.includes('local presence')) {
    differentiators.push('Local presence and community engagement');
  }

  if (capabilities.includes('sustainability')) {
    differentiators.push('Proven track record in sustainable development');
  }

  if (capabilities.includes('innovation')) {
    differentiators.push('Innovative approaches and cutting-edge solutions');
  }

  // Category-specific differentiators
  switch (tender.category) {
    case 'Infrastructure':
      differentiators.push('Extensive experience in large-scale infrastructure projects');
      break;
    case 'Technology':
      differentiators.push('Advanced cybersecurity and data protection measures');
      break;
    case 'Healthcare':
      differentiators.push('Compliance with international medical standards');
      break;
  }

  return differentiators.slice(0, 4);
}

function generatePricingStrategy(tender: any, competitive: any, risk: any): string {
  if (risk.totalRisk > 0.6) {
    return 'Premium pricing strategy to account for high risk factors and ensure adequate contingency';
  } else if (competitive.competitionPenalty > 20) {
    return 'Competitive pricing strategy with value-based differentiation to win in high-competition environment';
  } else {
    return 'Value-based pricing strategy balancing competitiveness with profitability';
  }
}

function generateExecutionTimeline(tender: any): string[] {
  const deadline = new Date(tender.deadline);
  const now = new Date();
  const totalDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const timeline: string[] = [];
  
  if (totalDays > 60) {
    timeline.push('Phase 1: Planning and resource allocation (Days 1-30)');
    timeline.push('Phase 2: Implementation and development (Days 31-75)');
    timeline.push('Phase 3: Testing and quality assurance (Days 76-90)');
    timeline.push('Phase 4: Delivery and handover (Days 91-100)');
  } else if (totalDays > 30) {
    timeline.push('Phase 1: Rapid planning and team mobilization (Days 1-10)');
    timeline.push('Phase 2: Accelerated implementation (Days 11-40)');
    timeline.push('Phase 3: Quality assurance and delivery (Days 41-50)');
  } else {
    timeline.push('Phase 1: Immediate team mobilization and planning (Days 1-5)');
    timeline.push('Phase 2: Fast-track implementation (Days 6-20)');
    timeline.push('Phase 3: Final testing and delivery (Days 21-30)');
  }

  return timeline;
}

function generateCompetitiveAdvantages(capabilities: string[], capMatch: any): string[] {
  const advantages: string[] = [];

  if (capabilities.includes('ISO certification')) {
    advantages.push('ISO certified quality management systems');
  }

  if (capabilities.includes('local partnerships')) {
    advantages.push('Strong local partnerships and supplier networks');
  }

  if (capabilities.includes('24/7 support')) {
    advantages.push('Round-the-clock support and maintenance services');
  }

  if (capMatch.bonus > 15) {
    advantages.push('Exceptional technical capability alignment with requirements');
  }

  if (capabilities.includes('green technology')) {
    advantages.push('Commitment to environmental sustainability and green practices');
  }

  return advantages.slice(0, 4);
}

function generateMitigationStrategies(riskFactors: any, tender: any): string[] {
  const strategies: string[] = [];

  if (riskFactors.risks.some((r: string) => r.includes('deadline'))) {
    strategies.push('Deploy dedicated project management team with proven track record');
    strategies.push('Implement agile methodology for faster delivery cycles');
  }

  if (riskFactors.risks.some((r: string) => r.includes('budget'))) {
    strategies.push('Establish comprehensive financial controls and monitoring systems');
    strategies.push('Secure pre-approved credit facilities and bonding capacity');
  }

  if (riskFactors.risks.some((r: string) => r.includes('complexity'))) {
    strategies.push('Engage subject matter experts and specialized consultants');
    strategies.push('Implement rigorous testing and quality assurance protocols');
  }

  if (riskFactors.risks.some((r: string) => r.includes('regulatory'))) {
    strategies.push('Early engagement with regulatory bodies and compliance experts');
    strategies.push('Comprehensive documentation and audit trail processes');
  }

  // Default strategies
  if (strategies.length === 0) {
    strategies.push('Regular stakeholder communication and progress reporting');
    strategies.push('Proactive risk monitoring and early warning systems');
  }

  return strategies.slice(0, 4);
}