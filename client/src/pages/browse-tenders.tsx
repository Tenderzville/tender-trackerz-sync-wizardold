import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TenderCard } from "@/components/tender/tender-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText } from "lucide-react";

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

export default function BrowseTenders() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    location: "",
    sortBy: "latest",
  });

  const { data: tenders, isLoading } = useQuery({
    queryKey: ["tenders", filters.category, filters.location, filters.search],
    queryFn: async () => {
      let query = supabase
        .from("tenders")
        .select("*")
        .eq("status", "active");
      
      if (filters.category) {
        query = query.eq("category", filters.category);
      }
      if (filters.location) {
        query = query.eq("location", filters.location);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(t => ({
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
    },
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const sortedTenders = tenders ? [...tenders].sort((a, b) => {
    switch (filters.sortBy) {
      case "deadline":
        const aDeadline = a.deadline ? new Date(a.deadline) : new Date(0);
        const bDeadline = b.deadline ? new Date(b.deadline) : new Date(0);
        return aDeadline.getTime() - bDeadline.getTime();
      case "budget":
        return (b.budgetEstimate || 0) - (a.budgetEstimate || 0);
      case "latest":
      default:
        const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return bCreated.getTime() - aCreated.getTime();
    }
  }) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <section className="mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Browse Tenders</h1>
              <p className="text-slate-600 dark:text-slate-300">
                Discover tender opportunities from government and private organizations
              </p>
            </div>

            {/* Search and Filters */}
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
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="IT Services">IT Services</SelectItem>
                    <SelectItem value="Consultancy">Consultancy</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.location || "all"} onValueChange={(value) => handleFilterChange("location", value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Nairobi County">Nairobi County</SelectItem>
                    <SelectItem value="Mombasa County">Mombasa County</SelectItem>
                    <SelectItem value="Kiambu County">Kiambu County</SelectItem>
                    <SelectItem value="Machakos County">Machakos County</SelectItem>
                    <SelectItem value="Multi-County">Multi-County</SelectItem>
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

        {/* Results */}
        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">Tender Results</h2>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {sortedTenders.length} results
                </span>
              </div>
              
              <div className="hidden lg:flex items-center space-x-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {sortedTenders.length} results
                </span>
              </div>
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
                
                {/* Load More Button */}
                <div className="text-center mt-8">
                  <Button variant="outline">
                    Load More Tenders
                  </Button>
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No tenders found</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    {filters.search || filters.category || filters.location
                      ? "Try adjusting your search criteria or filters"
                      : "No tenders available at the moment. If you are an admin, run the scraper from the Admin Dashboard to pull live tenders from Supabase."}
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
