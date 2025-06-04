import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TenderCard } from "@/components/tender/tender-card";
import { TenderFilters } from "@/components/tender/tender-filters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, FileText } from "lucide-react";
import type { Tender } from "@shared/schema";

interface FilterState {
  search: string;
  category: string;
  location: string;
  sortBy: string;
}

export default function BrowseTenders() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    location: "",
    sortBy: "latest",
  });

  const { data: tenders, isLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders", filters.category, filters.location, filters.search],
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
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <DesktopSidebar />
      
      <div className="flex-1 overflow-auto">
        <MobileHeader />
        
        {/* Header */}
        <section className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
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
                <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="IT Services">IT Services</SelectItem>
                    <SelectItem value="Consultancy">Consultancy</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Locations</SelectItem>
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
                      : "No tenders available at the moment"}
                  </p>
                  {!filters.search && !filters.category && !filters.location && (
                    <Button asChild>
                      <a href="/api/seed-data" onClick={() => window.location.reload()}>
                        Load Sample Data
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </div>
  );
}
