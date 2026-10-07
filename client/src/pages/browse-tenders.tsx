import { useEffect, useState } from "react";
import { SEO } from '@/components/SEO';
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenderCard } from "@/components/tender/tender-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { KENYA_COUNTIES } from "@/components/landing/TenderTicker";

interface FilterState {
  search: string;
  category: string;
  location: string;
  sortBy: string;
}

interface Tender {
  id: number;
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  deadline: string;
  budgetEstimate?: number | null;
  status?: string | null;
  createdAt?: string | null;
  sourceUrl?: string | null;
  tenderNumber?: string | null;
}

const PAGE_SIZE = 20;

const CATEGORY_OPTIONS: { value: string; match: string[] }[] = [
  { value: "Construction", match: ["Construction"] },
  { value: "ICT", match: ["ICT", "IT Services"] },
  { value: "Consultancy", match: ["Consultancy"] },
  { value: "Supply", match: ["Supply", "Supplies"] },
  { value: "Transport", match: ["Transport"] },
  { value: "Healthcare", match: ["Healthcare"] },
  { value: "Education", match: ["Education"] },
  { value: "Agriculture", match: ["Agriculture"] },
  { value: "Environment", match: ["Environment"] },
  { value: "Other", match: ["Other"] },
];

const COUNTY_OPTIONS = [...KENYA_COUNTIES].sort((a, b) => a.localeCompare(b));

export default function BrowseTenders() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    location: "",
    sortBy: "latest",
  });

  const [limit, setLimit] = useState(PAGE_SIZE);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(filters.search.trim()), 300);
    return () => clearTimeout(id);
  }, [filters.search]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["browse-tenders", filters.category, filters.location, debouncedSearch, filters.sortBy, limit],
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      let query = supabase
        .from("tenders")
        .select("*", { count: "exact" })
        .eq("status", "active")
        .gte("deadline", today);

      if (filters.category) {
        const option = CATEGORY_OPTIONS.find((o) => o.value === filters.category);
        query = query.in("category", option ? option.match : [filters.category]);
      }
      if (filters.location) {
        query = query.ilike("location", `%${filters.location}%`);
      }
      if (debouncedSearch) {
        const term = debouncedSearch.replace(/[%,()*]/g, " ").trim();
        if (term) {
          query = query.or(
            `title.ilike.%${term}%,description.ilike.%${term}%,organization.ilike.%${term}%`
          );
        }
      }

      switch (filters.sortBy) {
        case "deadline":
          query = query.order("deadline", { ascending: true });
          break;
        case "budget":
          query = query.order("budget_estimate", { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error, count } = await query.range(0, limit - 1);
      if (error) throw error;
      const rows = (data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        organization: t.organization,
        category: t.category,
        location: t.location,
        deadline: t.deadline,
        budgetEstimate: t.budget_estimate,
        status: t.status,
        createdAt: t.created_at,
        sourceUrl: t.source_url,
        tenderNumber: t.tender_number,
      })) as Tender[];
      return { rows, total: count ?? rows.length };
    },
  });

  const sortedTenders: Tender[] = data?.rows ?? [];
  const totalTenders = data?.total ?? 0;

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key !== "sortBy") setLimit(PAGE_SIZE);
  };

  const handleExportCSV = () => {
    if (!sortedTenders.length) {
      toast({ title: "No data", description: "No tenders to export.", variant: "destructive" });
      return;
    }
    const headers = ["Title", "Organization", "Category", "Location", "Deadline", "Budget (KES)", "Tender Number", "Source URL", "Status"];
    const rows = sortedTenders.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.organization || '').replace(/"/g, '""')}"`,
      t.category,
      t.location,
      t.deadline,
      t.budgetEstimate || '',
      t.tenderNumber || '',
      t.sourceUrl || '',
      t.status || 'active',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tenders-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: `${sortedTenders.length} tenders loaded tenders exported to CSV. Use Load more first to include more.` });
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Browse Kenya Government Tenders — MyGov, PPRA & Counties" description="Search verified, real-time Kenyan government tenders from MyGov, PPRA and county portals. Filter by sector, county, deadline and budget." path="/browse" jsonLd={{ '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Kenya Government Tenders', url: 'https://tenderproapp.tenderzville-portal.co.ke/browse', about: 'Real-time tender opportunities from Kenyan government portals.' }} />
      <div className="container mx-auto py-8 px-4">
        <section className="mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Browse Tenders</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Discover tender opportunities from government and private organizations
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search tenders by title, category, or organization..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-12"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select value={filters.category || "all"} onValueChange={(value) => handleFilterChange("category", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.value}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.location || "all"} onValueChange={(value) => handleFilterChange("location", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {COUNTY_OPTIONS.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest First</SelectItem>
                    <SelectItem value="deadline">Deadline Soon</SelectItem>
                    <SelectItem value="budget">Highest Value</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">Tender Results</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {isLoading ? "Loading…" : `${totalTenders} ${totalTenders === 1 ? "result" : "results"}`}
                </span>
              </div>
              
              <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!sortedTenders.length}>
                <Download className="h-4 w-4 mr-1.5" />
                Export CSV
              </Button>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedTenders.length > 0 ? (
              <div className="space-y-4">
                {sortedTenders.map((tender) => (
                  <TenderCard key={tender.id} tender={tender} />
                ))}
                
                {sortedTenders.length < totalTenders && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setLimit((l) => l + PAGE_SIZE)}
                      disabled={isFetching}
                    >
                      {isFetching ? "Loading…" : `Load more (${totalTenders - sortedTenders.length} left)`}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tenders found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {filters.search || filters.category || filters.location
                      ? "Try adjusting your search criteria or filters"
                      : "No tenders available at the moment. New tenders are synced regularly from official government portals."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
