import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Use service role key to bypass RLS for logging and rate limits
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Validates the API version header to ensure backward compatibility.
 * Throws an error if the version is deprecated or unsupported.
 */
export function checkApiVersion(req: Request, supportedVersions: string[] = ['v1']) {
  const version = req.headers.get('x-api-version') || 'v1';
  
  if (!supportedVersions.includes(version)) {
    throw new Error(`API Version ${version} is not supported. Supported versions: ${supportedVersions.join(', ')}`);
  }
  
  return version;
}

/**
 * Implements a sliding window rate limit using Supabase.
 * @param identifier IP address or user ID
 * @param endpoint Name of the function/endpoint
 * @param limit Max requests per window
 * @param windowSecs Time window in seconds
 */
export async function checkRateLimit(
  identifier: string, 
  endpoint: string, 
  limit: number = 60, 
  windowSecs: number = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  if (!identifier) return { success: true, limit, remaining: limit, reset: 0 }; // Skip if no identifier

  try {
    // A 1-minute window truncating to the current minute
    const windowStart = new Date(Math.floor(Date.now() / (windowSecs * 1000)) * (windowSecs * 1000)).toISOString();
    
    // First, check existing count
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('rate_limit_entries')
      .select('id, request_count')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .eq('window_start', windowStart)
      .single();

    let requestCount = 1;

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "No rows found"
      console.error('Rate limit fetch error:', fetchError);
      return { success: true, limit, remaining: limit, reset: 0 }; // Fail open
    }

    if (existing) {
      requestCount = existing.request_count + 1;
      
      if (requestCount > limit) {
        return { 
          success: false, 
          limit, 
          remaining: 0, 
          reset: new Date(windowStart).getTime() + (windowSecs * 1000) 
        };
      }

      // Update count
      await supabaseAdmin
        .from('rate_limit_entries')
        .update({ request_count: requestCount })
        .eq('id', existing.id);
    } else {
      // Insert new window
      await supabaseAdmin
        .from('rate_limit_entries')
        .insert({
          identifier,
          endpoint,
          window_start: windowStart,
          request_count: 1
        });
    }

    // Occasionally clean up old rate limit entries (1% chance to avoid blocking)
    if (Math.random() < 0.01) {
      supabaseAdmin.rpc('cleanup_rate_limit_entries').then(() => {}).catch(e => console.error('Cleanup error', e));
    }

    return { 
      success: true, 
      limit, 
      remaining: limit - requestCount, 
      reset: new Date(windowStart).getTime() + (windowSecs * 1000) 
    };
  } catch (error) {
    console.error('Rate limit exception:', error);
    return { success: true, limit, remaining: limit, reset: 0 }; // Fail open
  }
}

/**
 * Logs an error to the structured error_logs table.
 */
export async function logError(
  functionName: string, 
  error: any, 
  req?: Request,
  userId?: string
) {
  try {
    let errorMessage = 'Unknown error';
    let errorStack = null;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      errorMessage = JSON.stringify(error);
    }

    // Safely extract request metadata
    const requestMetadata: Record<string, any> = {};
    let ipAddress = null;
    
    if (req) {
      requestMetadata.url = req.url;
      requestMetadata.method = req.method;
      
      // Don't log sensitive headers like Authorization
      const headers = Object.fromEntries(req.headers.entries());
      delete headers['authorization'];
      delete headers['cookie'];
      requestMetadata.headers = headers;
      
      // Try to get IP from headers
      ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    }

    await supabaseAdmin.from('error_logs').insert({
      function_name: functionName,
      error_message: errorMessage,
      error_stack: errorStack,
      request_metadata: requestMetadata,
      severity: 'error',
      user_id: userId,
      ip_address: ipAddress
    });
    
    console.error(`[${functionName}] Error logged:`, errorMessage);
  } catch (logEx) {
    console.error('Failed to log error to database:', logEx);
    // Fallback to standard console log
    console.error(error);
  }
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-version',
  'Access-Control-Expose-Headers': 'x-ratelimit-limit, x-ratelimit-remaining, x-ratelimit-reset'
};
