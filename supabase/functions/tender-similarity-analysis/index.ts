import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const hf = new HfInference(Deno.env.get('HUGGING_FACE_ACCESS_TOKEN'));

interface SimilarityRequest {
  tenderId: number;
  limit?: number;
}

interface SimilarTender {
  id: number;
  title: string;
  organization: string;
  category: string;
  budget_estimate: number;
  similarity_score: number;
  analysis?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenderId, limit = 10 }: SimilarityRequest = await req.json();
    
    console.log(`Finding similar tenders for tender ${tenderId}`);

    // Get the target tender
    const { data: targetTender, error: targetError } = await supabase
      .from('tenders')
      .select('*')
      .eq('id', tenderId)
      .single();

    if (targetError || !targetTender) {
      throw new Error(`Target tender not found: ${targetError?.message}`);
    }

    // Get all other tenders for comparison
    const { data: allTenders, error: tendersError } = await supabase
      .from('tenders')
      .select('*')
      .neq('id', tenderId)
      .limit(100); // Limit to avoid processing too many

    if (tendersError) {
      throw new Error(`Failed to fetch tenders: ${tendersError.message}`);
    }

    if (!allTenders || allTenders.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Generate embeddings for target tender
    const targetText = createTenderText(targetTender);
    const targetEmbedding = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: targetText
    });

    console.log('Generated target embedding');

    // Calculate similarities with all tenders
    const similarities: SimilarTender[] = [];

    for (const tender of allTenders) {
      try {
        const tenderText = createTenderText(tender);
        const tenderEmbedding = await hf.featureExtraction({
          model: 'sentence-transformers/all-MiniLM-L6-v2',
          inputs: tenderText
        });

        // Calculate cosine similarity
        const similarity = cosineSimilarity(
          targetEmbedding as number[], 
          tenderEmbedding as number[]
        );

        // Add categorical and organizational similarity boosts
        let adjustedSimilarity = similarity;
        
        if (tender.category === targetTender.category) {
          adjustedSimilarity += 0.1;
        }
        
        if (tender.organization === targetTender.organization) {
          adjustedSimilarity += 0.05;
        }

        // Budget similarity boost
        if (tender.budget_estimate && targetTender.budget_estimate) {
          const budgetRatio = Math.min(
            tender.budget_estimate / targetTender.budget_estimate,
            targetTender.budget_estimate / tender.budget_estimate
          );
          if (budgetRatio > 0.7) {
            adjustedSimilarity += 0.05;
          }
        }

        similarities.push({
          id: tender.id,
          title: tender.title,
          organization: tender.organization,
          category: tender.category,
          budget_estimate: tender.budget_estimate,
          similarity_score: Math.round(adjustedSimilarity * 100) / 100
        });

      } catch (embeddingError) {
        console.error(`Error processing tender ${tender.id}:`, embeddingError);
        // Continue with next tender instead of failing completely
      }
    }

    // Sort by similarity and get top results
    const topSimilar = similarities
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, limit);

    console.log(`Found ${topSimilar.length} similar tenders`);

    // Optionally fetch AI analyses for similar tenders
    for (const similar of topSimilar) {
      const { data: analysis } = await supabase
        .from('ai_analyses')
        .select('win_probability, estimated_value_min, estimated_value_max')
        .eq('tender_id', similar.id)
        .single();
      
      if (analysis) {
        similar.analysis = analysis;
      }
    }

    return new Response(JSON.stringify(topSimilar), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in tender-similarity-analysis:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function createTenderText(tender: any): string {
  return [
    tender.title,
    tender.description,
    tender.category,
    tender.organization,
    tender.location,
    ...(tender.requirements || [])
  ].filter(Boolean).join(' ');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}