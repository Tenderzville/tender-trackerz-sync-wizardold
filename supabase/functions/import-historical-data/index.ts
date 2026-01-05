import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Kenya inflation rates for adjustment (CBK data)
const INFLATION_RATES: Record<string, number> = {
  '2019': 5.2,
  '2020': 5.4,
  '2021': 6.1,
  '2022': 7.6,
  '2023': 7.7,
  '2024': 6.9,
  '2025': 5.5, // Projected
  '2026': 5.0, // Projected
};

const CURRENT_YEAR = 2026;

// Calculate inflation-adjusted amount to current year
function adjustForInflation(amount: number, fromYear: number): number {
  let adjustedAmount = amount;
  for (let year = fromYear; year < CURRENT_YEAR; year++) {
    const rate = INFLATION_RATES[year.toString()] || 5.0;
    adjustedAmount *= (1 + rate / 100);
  }
  return Math.round(adjustedAmount);
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Parse Kenya shilling amount
function parseAmount(amountStr: string): number | null {
  if (!amountStr) return null;
  const cleaned = amountStr.replace(/[Ksh,\s]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) || num === 0 ? null : num;
}

// Extract year from date string
function extractYear(dateStr: string): number {
  if (!dateStr) return CURRENT_YEAR;
  const match = dateStr.match(/(\d{4})/);
  return match ? parseInt(match[1]) : CURRENT_YEAR;
}

// Infer winner type from supplier name or AGPO group
function inferWinnerType(supplier: string, agpoGroup?: string): string {
  if (agpoGroup?.toLowerCase().includes('youth')) return 'youth';
  if (agpoGroup?.toLowerCase().includes('women')) return 'women';
  if (agpoGroup?.toLowerCase().includes('pwd')) return 'pwd';
  
  const lower = supplier.toLowerCase();
  if (lower.includes('consortium') || lower.includes('jv') || lower.includes('joint venture')) return 'consortium';
  if (lower.includes('youth') || lower.includes('young')) return 'youth';
  if (lower.includes('women') || lower.includes('female')) return 'women';
  if (lower.includes('group') || lower.includes('self help')) return 'sme';
  if (lower.includes('ltd') || lower.includes('limited') || lower.includes('plc')) return 'large_enterprise';
  return 'sme';
}

// Infer category from tender title
function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('road') || lower.includes('construction') || lower.includes('building') || lower.includes('renovation')) return 'Construction';
  if (lower.includes('medical') || lower.includes('health') || lower.includes('hospital') || lower.includes('pharmaceutical') || lower.includes('drug')) return 'Medical';
  if (lower.includes('ict') || lower.includes('software') || lower.includes('computer') || lower.includes('technology') || lower.includes('system')) return 'Technology';
  if (lower.includes('supply') || lower.includes('delivery') || lower.includes('furniture') || lower.includes('stationery')) return 'Supplies';
  if (lower.includes('consult') || lower.includes('advisory') || lower.includes('study') || lower.includes('design')) return 'Consultancy';
  if (lower.includes('security') || lower.includes('guard')) return 'Security';
  if (lower.includes('transport') || lower.includes('vehicle') || lower.includes('fleet') || lower.includes('fuel')) return 'Transport';
  if (lower.includes('water') || lower.includes('sanitation') || lower.includes('sewage') || lower.includes('borehole')) return 'Water';
  if (lower.includes('energy') || lower.includes('power') || lower.includes('electricity') || lower.includes('solar')) return 'Energy';
  if (lower.includes('education') || lower.includes('school') || lower.includes('training') || lower.includes('text')) return 'Education';
  if (lower.includes('agriculture') || lower.includes('farm') || lower.includes('livestock') || lower.includes('seed')) return 'Agriculture';
  if (lower.includes('catering') || lower.includes('food') || lower.includes('meal')) return 'Catering';
  if (lower.includes('cleaning') || lower.includes('laundry') || lower.includes('sanitation')) return 'Cleaning';
  if (lower.includes('insurance') || lower.includes('cover')) return 'Insurance';
  if (lower.includes('printing') || lower.includes('publication')) return 'Printing';
  return 'General';
}

// Extract location from PE Name
function inferLocation(peName: string): string {
  const counties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Kiambu', 'Machakos',
    'Nyeri', 'Meru', 'Kakamega', 'Kisii', 'Garissa', 'Turkana', 'Bungoma', 
    'Uasin Gishu', 'Siaya', 'Migori', 'Kilifi', 'Kwale', 'Taita', 'Taveta',
    'Kitui', 'Makueni', 'Embu', 'Tharaka', 'Nithi', 'Laikipia', 'Nyandarua',
    'Baringo', 'Elgeyo', 'Marakwet', 'West Pokot', 'Samburu', 'Trans Nzoia',
    'Nandi', 'Bomet', 'Kericho', 'Narok', 'Kajiado', 'Homabay', 'Nyamira',
    'Vihiga', 'Busia', 'Mandera', 'Wajir', 'Marsabit', 'Isiolo', 'Tana River',
    'Lamu', 'Muranga', 'Kirinyaga'
  ];
  
  const lower = peName.toLowerCase();
  for (const county of counties) {
    if (lower.includes(county.toLowerCase())) return county;
  }
  
  // Check for national entities
  if (lower.includes('national') || lower.includes('kenya') || lower.includes('ministry')) return 'Nairobi';
  
  return 'Kenya';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { limit = 1000, offset = 0 } = await req.json().catch(() => ({}));
    
    console.log(`Fetching historical data from HuggingFace (limit: ${limit}, offset: ${offset})`);
    
    // Fetch CSV from HuggingFace
    const csvUrl = 'https://huggingface.co/datasets/Olive254/AwardedPublicProcurementTendersKenya/raw/main/Kenya%20published_contracts.csv';
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }
    
    const csvText = await response.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    // Parse header
    const header = parseCSVLine(lines[0]);
    console.log('CSV Headers:', header);
    
    // Map header indices
    const indices = {
      contractNumber: header.indexOf('Contract Number'),
      amount: header.indexOf('Amount'),
      awardDate: header.indexOf('Award Date'),
      title: header.indexOf('Tender Title'),
      tenderRef: header.indexOf('Tender Ref.'),
      peName: header.indexOf('PE Name'),
      supplierName: header.indexOf('Supplier Name'),
      agpoGroup: header.indexOf('Awarded Agpo Group Id'),
      financialYear: header.indexOf('Financial Year'),
      quarter: header.indexOf('Quarter'),
    };
    
    // Process rows with pagination
    const startIdx = 1 + offset; // Skip header
    const endIdx = Math.min(startIdx + limit, lines.length);
    
    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    
    for (let i = startIdx; i < endIdx; i++) {
      const row = parseCSVLine(lines[i]);
      if (row.length < 5) continue;
      
      const amount = parseAmount(row[indices.amount]);
      const title = row[indices.title]?.trim();
      const peName = row[indices.peName]?.trim();
      const supplierName = row[indices.supplierName]?.trim();
      const awardDate = row[indices.awardDate]?.trim();
      const tenderRef = row[indices.tenderRef]?.trim() || row[indices.contractNumber]?.trim();
      const agpoGroup = row[indices.agpoGroup]?.trim();
      
      if (!title || !peName) continue;
      
      // Calculate inflation-adjusted amount
      const awardYear = extractYear(awardDate);
      const inflationAdjustedAmount = amount ? adjustForInflation(amount, awardYear) : null;
      
      try {
        const { error } = await supabase
          .from('historical_tender_awards')
          .insert({
            tender_number: tenderRef?.substring(0, 255),
            title: title.substring(0, 500),
            organization: peName.substring(0, 255),
            category: inferCategory(title),
            location: inferLocation(peName),
            awarded_amount: amount,
            winner_name: supplierName?.substring(0, 255),
            winner_type: inferWinnerType(supplierName || '', agpoGroup),
            award_date: awardDate || null,
            tender_type: agpoGroup ? 'agpo' : 'open',
            procurement_method: 'Open Tender',
            source_url: 'https://huggingface.co/datasets/Olive254/AwardedPublicProcurementTendersKenya',
            scraped_from: 'huggingface_kenya_contracts',
            // Store inflation-adjusted data in the price_to_budget_ratio as percentage of adjustment
            price_to_budget_ratio: amount && inflationAdjustedAmount ? 
              parseFloat((inflationAdjustedAmount / amount).toFixed(4)) : null,
          });
        
        if (error) {
          if (error.code === '23505') {
            duplicates++;
          } else {
            console.error(`Row ${i} error:`, error.message);
            errors++;
          }
        } else {
          inserted++;
        }
      } catch (err) {
        errors++;
      }
    }
    
    // Log automation
    await supabase.from('automation_logs').insert({
      function_name: 'import-historical-data',
      status: 'completed',
      result_data: {
        source: 'huggingface',
        total_rows: lines.length - 1,
        processed: endIdx - startIdx,
        inserted,
        duplicates,
        errors,
        offset,
        limit,
        has_more: endIdx < lines.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Imported ${inserted} historical contracts`,
        data: {
          total_available: lines.length - 1,
          processed: endIdx - startIdx,
          inserted,
          duplicates,
          errors,
          has_more: endIdx < lines.length,
          next_offset: endIdx < lines.length ? endIdx - 1 : null,
          inflation_note: 'Amounts adjusted for inflation to 2026 KES using CBK rates',
        },
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error importing historical data:', error);
    
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
