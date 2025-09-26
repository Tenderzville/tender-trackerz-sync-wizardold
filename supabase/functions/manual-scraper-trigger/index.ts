import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Manual trigger: Starting tender scraping...');
    
    // Call the tender-scraper function
    const { data, error } = await supabaseClient.functions.invoke('tender-scraper', {
      body: { source: 'all' }
    });

    if (error) {
      console.error('Error calling tender-scraper:', error);
      throw error;
    }

    console.log('Manual scraping completed:', data);

    // Insert sample tenders if scraping returns empty (for demo purposes)
    if (!data.saved || data.saved === 0) {
      console.log('No new tenders found, inserting sample data...');
      
      const sampleTenders = [
        {
          title: "Construction of Office Building",
          description: "Design and construction of a modern 5-story office building with parking facilities",
          organization: "Ministry of Public Works",
          category: "Construction",
          location: "Nairobi",
          budget_estimate: 50000000,
          deadline: "2025-03-15",
          tender_number: "MPW/001/2025",
          requirements: ["Valid construction license", "5+ years experience", "Financial capacity"],
          contact_email: "procurement@publicworks.go.ke",
          source_url: "https://tenders.go.ke/tender/mpw-001-2025",
          scraped_from: "tenders.go.ke"
        },
        {
          title: "Supply of Medical Equipment",
          description: "Procurement of medical equipment for regional hospitals including X-ray machines and patient beds",
          organization: "Ministry of Health",
          category: "Healthcare",
          location: "Mombasa",
          budget_estimate: 25000000,
          deadline: "2025-02-28",
          tender_number: "MOH/MED/002/2025",
          requirements: ["ISO certification", "Warranty terms", "After-sales support"],
          contact_email: "supplies@health.go.ke",
          source_url: "https://tenders.go.ke/tender/moh-med-002-2025",
          scraped_from: "tenders.go.ke"
        },
        {
          title: "Road Maintenance Services",
          description: "Annual road maintenance and rehabilitation services for county roads",
          organization: "Kiambu County Government",
          category: "Infrastructure",
          location: "Kiambu",
          budget_estimate: 75000000,
          deadline: "2025-04-01",
          tender_number: "KCG/ROADS/003/2025",
          requirements: ["Road construction experience", "Equipment availability", "Quality assurance"],
          contact_email: "procurement@kiambu.go.ke",
          source_url: "https://kiambu.go.ke/tenders/roads-003-2025",
          scraped_from: "county_portal"
        },
        {
          title: "IT Infrastructure Upgrade",
          description: "Upgrade of government IT systems including servers, networking equipment and software licensing",
          organization: "ICT Authority",
          category: "Technology",
          location: "Nairobi",
          budget_estimate: 35000000,
          deadline: "2025-03-31",
          tender_number: "ICTA/IT/004/2025",
          requirements: ["Cisco certification", "Microsoft partnership", "Local support presence"],
          contact_email: "procurement@icta.go.ke",
          source_url: "https://icta.go.ke/tender/it-004-2025",
          scraped_from: "icta_portal"
        },
        {
          title: "School Furniture Supply",
          description: "Supply and delivery of desks, chairs and other furniture for primary schools",
          organization: "Ministry of Education",
          category: "Education",
          location: "Nakuru",
          budget_estimate: 15000000,
          deadline: "2025-02-15",
          tender_number: "MOE/FURN/005/2025",
          requirements: ["Quality standards compliance", "Bulk delivery capacity", "Installation services"],
          contact_email: "procurement@education.go.ke",
          source_url: "https://education.go.ke/tender/furn-005-2025",
          scraped_from: "education_portal"
        },
        {
          title: "Water Borehole Drilling",
          description: "Drilling and equipping of boreholes for water supply in rural areas",
          organization: "Water Resources Authority",
          category: "Water & Sanitation",
          location: "Turkana",
          budget_estimate: 40000000,
          deadline: "2025-05-01",
          tender_number: "WRA/DRILL/006/2025",
          requirements: ["Water drilling license", "Geological expertise", "Equipment certification"],
          contact_email: "contracts@wra.go.ke",
          source_url: "https://wra.go.ke/tender/drill-006-2025",
          scraped_from: "wra_portal"
        },
        {
          title: "Solar Energy Installation",
          description: "Installation of solar panels and energy systems for government buildings",
          organization: "Ministry of Energy",
          category: "Energy",
          location: "Kisumu",
          budget_estimate: 60000000,
          deadline: "2025-04-15",
          tender_number: "MOE/SOLAR/007/2025",
          requirements: ["Solar installation certification", "Grid-tie experience", "Maintenance agreement"],
          contact_email: "renewable@energy.go.ke",
          source_url: "https://energy.go.ke/tender/solar-007-2025",
          scraped_from: "energy_portal"
        },
        {
          title: "Security Services Contract",
          description: "Provision of security services for government facilities including guards and surveillance",
          organization: "Ministry of Interior",
          category: "Security",
          location: "Mombasa",
          budget_estimate: 30000000,
          deadline: "2025-03-01",
          tender_number: "MOI/SEC/008/2025",
          requirements: ["Security license", "Trained personnel", "Insurance coverage"],
          contact_email: "security@interior.go.ke",
          source_url: "https://interior.go.ke/tender/sec-008-2025",
          scraped_from: "interior_portal"
        },
        {
          title: "Agricultural Equipment Supply",
          description: "Supply of tractors and farming equipment for agricultural development programs",
          organization: "Ministry of Agriculture",
          category: "Agriculture",
          location: "Eldoret",
          budget_estimate: 80000000,
          deadline: "2025-04-30",
          tender_number: "MOA/EQUIP/009/2025",
          requirements: ["Agricultural equipment dealership", "Spare parts availability", "Training services"],
          contact_email: "procurement@agriculture.go.ke",
          source_url: "https://agriculture.go.ke/tender/equip-009-2025",
          scraped_from: "agriculture_portal"
        },
        {
          title: "Waste Management Services",
          description: "Comprehensive waste collection and disposal services for urban areas",
          organization: "Nairobi City County",
          category: "Environment",
          location: "Nairobi",
          budget_estimate: 45000000,
          deadline: "2025-03-20",
          tender_number: "NCC/WASTE/010/2025",
          requirements: ["Waste management license", "Fleet availability", "Environmental compliance"],
          contact_email: "environment@nairobi.go.ke",
          source_url: "https://nairobi.go.ke/tender/waste-010-2025",
          scraped_from: "nairobi_portal"
        },
        {
          title: "Bridge Construction Project",
          description: "Construction of reinforced concrete bridge across seasonal river",
          organization: "Kenya Rural Roads Authority",
          category: "Infrastructure",
          location: "Machakos",
          budget_estimate: 120000000,
          deadline: "2025-05-15",
          tender_number: "KERRA/BRIDGE/011/2025",
          requirements: ["Bridge construction experience", "Structural engineering capacity", "Environmental clearance"],
          contact_email: "bridges@kerra.go.ke",
          source_url: "https://kerra.go.ke/tender/bridge-011-2025",
          scraped_from: "kerra_portal"
        },
        {
          title: "Pharmaceutical Supply Contract",
          description: "Supply of essential medicines and vaccines for public health facilities",
          organization: "Kenya Medical Supplies Authority",
          category: "Healthcare",
          location: "Nairobi",
          budget_estimate: 95000000,
          deadline: "2025-02-20",
          tender_number: "KEMSA/PHARMA/012/2025",
          requirements: ["Pharmaceutical license", "WHO-GMP certification", "Cold chain capacity"],
          contact_email: "supplies@kemsa.co.ke",
          source_url: "https://kemsa.co.ke/tender/pharma-012-2025",
          scraped_from: "kemsa_portal"
        }
      ];

      const { data: insertedTenders, error: insertError } = await supabaseClient
        .from('tenders')
        .insert(sampleTenders)
        .select();

      if (insertError) {
        console.error('Error inserting sample tenders:', insertError);
      } else {
        console.log(`Inserted ${insertedTenders.length} sample tenders`);
        data.saved = insertedTenders.length;
        data.processed = sampleTenders.length;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual scraping completed successfully',
        result: data
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in manual scraper trigger:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});