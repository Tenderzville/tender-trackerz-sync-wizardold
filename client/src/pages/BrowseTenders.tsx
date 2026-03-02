import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TenderCard } from "@/components/TenderCard";
import { useTenders } from "@/hooks/use-tenders";
import { Search, Filter, SlidersHorizontal, Download } from "lucide-react";

export default function BrowseTenders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("latest");

  const filters = {
    search: searchTerm || undefined,
    category: category && category !== 'all' ? category : undefined,
    location: location && location !== 'all' ? location : undefined,
    limit: 20
  };

  const { tenders, isLoading } = useTenders(filters);

  const handleSearch = () => {
    // Search is handled automatically by the useTenders hook when filters change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browse Tenders</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Discover new tender opportunities across Kenya
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Advanced Filters
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search tenders by title, category, or organization..."
              className="pl-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Construction">Construction</SelectItem>
                <SelectItem value="IT Services">IT Services</SelectItem>
                <SelectItem value="Consultancy">Consultancy</SelectItem>
                <SelectItem value="Supplies">Supplies</SelectItem>
                <SelectItem value="Medical">Medical Supplies</SelectItem>
                <SelectItem value="Transport">Transport</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={location} onValueChange={setLocation}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="Nairobi">Nairobi</SelectItem>
                <SelectItem value="Mombasa">Mombasa</SelectItem>
                <SelectItem value="Kisumu">Kisumu</SelectItem>
                <SelectItem value="Eldoret">Eldoret</SelectItem>
                <SelectItem value="Nakuru">Nakuru</SelectItem>
                <SelectItem value="Thika">Thika</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch} className="space-x-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {tenders.length > 0 ? (
              <>Showing {tenders.length} tenders</>
            ) : (
              "Loading tenders..."
            )}
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest First</SelectItem>
              <SelectItem value="deadline">Deadline Soon</SelectItem>
              <SelectItem value="value-high">Highest Value</SelectItem>
              <SelectItem value="value-low">Lowest Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tender Listings */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 animate-pulse">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 mb-4 lg:mb-0 lg:pr-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16"></div>
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    </div>
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
                  </div>
                  <div className="flex flex-col lg:items-end space-y-3">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20"></div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-24"></div>
                      <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-32"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tenders && tenders.length > 0 ? (
          // Actual tender cards
          <div className="space-y-4">
            {tenders.map((tender: any) => (
              <TenderCard key={tender.id} tender={tender} />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No tenders found
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Try adjusting your search criteria or filters to find more results.
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setCategory("");
              setLocation("");
            }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Export */}
      <div className="flex flex-wrap gap-4 items-center">
        {tenders && tenders.length > 0 && (
          <Button
            variant="outline"
            onClick={() => {
              // Export/download functionality
              console.log("Export tenders");
            }}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Results
          </Button>
        )}
      </div>
    </div>
  );
}