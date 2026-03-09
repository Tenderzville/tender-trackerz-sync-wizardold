import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { checkApiVersion, checkRateLimit, logError, corsHeaders, supabaseAdmin } from "../_shared/api-utils.ts";

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';

  try {
    // 1. Enforce API Versioning
    checkApiVersion(req);

    // 2. Enforce Rate Limiting (Health checks should be highly permitted, e.g., 60 req/min)
    const rl = await checkRateLimit(ipAddress, 'health-check', 60, 60);
    
    if (!rl.success) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please try again later.' 
      }), { 
        status: 429, 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': rl.limit.toString(),
          'X-RateLimit-Remaining': rl.remaining.toString(),
          'X-RateLimit-Reset': rl.reset.toString()
        } 
      });
    }

    // 3. Check Database Connectivity
    const { data, error } = await supabaseAdmin.from('profiles').select('id').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;

    // Response headers with rate limits included
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': rl.limit.toString(),
      'X-RateLimit-Remaining': rl.remaining.toString(),
      'X-RateLimit-Reset': rl.reset.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    };

    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime ? process.uptime() : 'unknown',
      services: {
        database: 'connected',
        api: 'running'
      },
      latency_ms: duration,
      version: '1.0.0'
    }), { 
      status: 200, 
      headers: responseHeaders 
    });

  } catch (error) {
    await logError('health-check', error, req);
    
    return new Response(JSON.stringify({ 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      timestamp: new Date().toISOString()
    }), { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
