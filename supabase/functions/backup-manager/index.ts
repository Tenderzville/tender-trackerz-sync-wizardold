import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupData {
  backupType: string;
  data: any;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { backupType = 'all' } = await req.json().catch(() => ({}));
    
    console.log(`Starting automated backup for type: ${backupType}`);
    
    const backupResults = [];
    const timestamp = new Date().toISOString();

    // Backup user profiles
    if (backupType === 'all' || backupType === 'user_data') {
      try {
        const { data: profiles, error } = await supabaseClient
          .from('profiles')
          .select('*');
        
        if (!error && profiles) {
          const backupData = {
            type: 'user_data',
            timestamp,
            count: profiles.length,
            data: profiles
          };
          
          const filename = `backups/user_data_${timestamp.split('T')[0]}.json`;
          
          const { error: uploadError } = await supabaseClient.storage
            .from('backups')
            .upload(filename, JSON.stringify(backupData, null, 2), {
              contentType: 'application/json'
            });

          if (uploadError) {
            console.error('Upload error for user data:', uploadError);
          } else {
            backupResults.push({
              type: 'user_data',
              status: 'completed',
              location: filename,
              count: profiles.length
            });
          }
        }
      } catch (error) {
        console.error('Error backing up user data:', error);
        backupResults.push({
          type: 'user_data',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Backup tenders
    if (backupType === 'all' || backupType === 'tenders') {
      try {
        const { data: tenders, error } = await supabaseClient
          .from('tenders')
          .select('*')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()); // Last 7 days
        
        if (!error && tenders) {
          const backupData = {
            type: 'tenders',
            timestamp,
            count: tenders.length,
            data: tenders
          };
          
          const filename = `backups/tenders_${timestamp.split('T')[0]}.json`;
          
          const { error: uploadError } = await supabaseClient.storage
            .from('backups')
            .upload(filename, JSON.stringify(backupData, null, 2), {
              contentType: 'application/json'
            });

          if (uploadError) {
            console.error('Upload error for tenders:', uploadError);
          } else {
            backupResults.push({
              type: 'tenders',
              status: 'completed',
              location: filename,
              count: tenders.length
            });
          }
        }
      } catch (error) {
        console.error('Error backing up tenders:', error);
        backupResults.push({
          type: 'tenders',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Backup RFQs and quotes
    if (backupType === 'all' || backupType === 'rfqs') {
      try {
        const { data: rfqs, error: rfqError } = await supabaseClient
          .from('rfqs')
          .select('*, rfq_quotes(*)');
        
        if (!rfqError && rfqs) {
          const backupData = {
            type: 'rfqs',
            timestamp,
            count: rfqs.length,
            data: rfqs
          };
          
          const filename = `backups/rfqs_${timestamp.split('T')[0]}.json`;
          
          const { error: uploadError } = await supabaseClient.storage
            .from('backups')
            .upload(filename, JSON.stringify(backupData, null, 2), {
              contentType: 'application/json'
            });

          if (uploadError) {
            console.error('Upload error for RFQs:', uploadError);
          } else {
            backupResults.push({
              type: 'rfqs',
              status: 'completed',
              location: filename,
              count: rfqs.length
            });
          }
        }
      } catch (error) {
        console.error('Error backing up RFQs:', error);
        backupResults.push({
          type: 'rfqs',
          status: 'failed',
          error: error.message
        });
      }
    }

    // Log backup results
    for (const result of backupResults) {
      const { error: logError } = await supabaseClient
        .from('backup_logs')
        .insert({
          backup_type: result.type,
          backup_location: result.location || '',
          backup_status: result.status,
          error_message: result.error || null,
          file_size: result.location ? (JSON.stringify(result.data || {}).length) : null,
          completed_at: result.status === 'completed' ? new Date().toISOString() : null
        });

      if (logError) {
        console.error('Error logging backup result:', logError);
      }
    }

    console.log(`Backup completed. Processed ${backupResults.length} backup operations.`);

    return new Response(
      JSON.stringify({
        success: true,
        timestamp,
        backupType,
        results: backupResults,
        totalOperations: backupResults.length
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in backup function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});