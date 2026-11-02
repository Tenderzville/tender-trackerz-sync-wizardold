import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TenderData {
  id: number;
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  budgetEstimate?: number | null;
  deadline: string;
  requirements?: string[];
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tender } = await req.json() as { tender: TenderData };
    
    if (!tender) {
      return new Response(
        JSON.stringify({ error: 'Tender data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      // Return fallback analysis if AI not available
      return new Response(
        JSON.stringify({ error: 'AI guidance is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing tender: ${tender.title}`);

    const systemPrompt = `You are a Kenyan public procurement advisor. You give practical, specific guidance on how a small supplier should approach ONE tender, using only the tender text you are given.

You have NO data on past awards, bidders, competitor counts, winning prices or win rates. Never state or imply probabilities, percentages, number of bidders, average or winning prices, price ranges or market trends. If something cannot be known from the tender text, say so plainly.`;

    const userPrompt = `Give guidance on this Kenyan tender:

**TENDER DETAILS:**
- Title: ${tender.title}
- Organization: ${tender.organization}
- Category: ${tender.category}
- Location: ${tender.location}
- Published budget: ${tender.budgetEstimate ? `KES ${tender.budgetEstimate.toLocaleString()}` : 'Not published'}
- Deadline: ${tender.deadline}
- Requirements: ${tender.requirements?.join(', ') || 'Not specified'}
- Description: ${tender.description}

**RESPOND ONLY WITH VALID JSON:**
{
  "recommendations": [<4-6 specific, actionable steps for preparing a compliant bid for THIS tender>],
  "reasoning": "<2 short paragraphs: what this tender is really asking for and what a supplier must get right, based only on the text above>",
  "bidStrategy": {
    "timingAdvice": "<advice on preparation timing given the deadline>",
    "keySuccessFactors": [<3-4 things that matter most for a compliant, competitive submission>]
  }
}

RULES:
- Use only the tender details above. Do not invent facts about the procuring entity.
- No probabilities, percentages, bidder counts, price ranges or "typical" market figures.
- Be specific (documents, certificates, specifications, submission steps), not generic.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limited. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return fallback analysis
      return new Response(
        JSON.stringify({ error: 'AI guidance is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      console.error('No content in AI response');
      return new Response(
        JSON.stringify({ error: 'AI guidance is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the JSON from the response
    try {
      // Extract JSON from the response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      const analysis = JSON.parse(jsonStr.trim());
      console.log('Analysis generated successfully');
      
      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      console.log('Raw content:', content);
      return new Response(
        JSON.stringify({ error: 'AI guidance is temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in ai-tender-intelligence:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
