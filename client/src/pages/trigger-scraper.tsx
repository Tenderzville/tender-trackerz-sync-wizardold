import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Globe, 
  Database,
  Zap,
  Clock,
  RefreshCw
} from "lucide-react";

interface ScraperResult {
  success: boolean;
  message: string;
  stats?: {
    totalProcessed: number;
    totalSaved: number;
  };
  results?: Array<{
    source: string;
    tenders: any[];
    error?: string;
  }>;
}

export default function TriggerScraper() {
  const { toast } = useToast();
  const [selectedSource, setSelectedSource] = useState<string>('all');
  
  // Fetch recent scrape stats
  const { data: recentTenders } = useQuery({
    queryKey: ['recent-tenders-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  // Firecrawl scraper - uses AI + real web scraping
  const firecrawlMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('firecrawl-tender-scraper', {
        body: { source: selectedSource }
      });
      
      if (error) throw error;
      return data as ScraperResult;
    },
    onSuccess: (data) => {
      toast({
        title: "Firecrawl Scraper Complete! 🔥",
        description: data.message || `Processed ${data.stats?.totalProcessed || 0} tenders, saved ${data.stats?.totalSaved || 0} new ones.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Firecrawl Error",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  // Basic scraper - uses backup/synthetic data
  const basicScraperMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('manual-scraper-trigger', {});
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Basic Scraper Complete",
        description: `Processed ${data.result?.processed || 0} tenders, saved ${data.result?.saved || 0} new ones.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error triggering scraper",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const isLoading = firecrawlMutation.isPending || basicScraperMutation.isPending;

  const sources = [
    { id: 'all', name: 'All Sources', description: 'Scrape all available government portals' },
    { id: 'mygov', name: 'MyGov Kenya', description: 'www.mygov.go.ke/all-tenders' },
    { id: 'tenders.go.ke', name: 'PPIP Portal', description: 'tenders.go.ke - Official procurement portal' },
    { id: 'ppra', name: 'PPRA Kenya', description: 'ppra.go.ke - Contract awards' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{recentTenders || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Tenders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Globe className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-sm text-muted-foreground">Data Sources</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">AI + Firecrawl</p>
                  <p className="text-sm text-muted-foreground">Powered By</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Scraper Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <RefreshCw className="h-5 w-5" />
              <span>Tender Scraper Control Panel</span>
            </CardTitle>
            <CardDescription>
              Scrape real tenders from official Kenyan government procurement portals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs defaultValue="firecrawl" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="firecrawl" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Firecrawl (Real Data)
                </TabsTrigger>
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Basic Scraper
                </TabsTrigger>
              </TabsList>

              <TabsContent value="firecrawl" className="space-y-4 mt-4">
                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Firecrawl + AI:</strong> This scraper uses Firecrawl to fetch real data from government websites, 
                    then uses AI to extract and structure tender information. Results are verified and deduplicated.
                  </AlertDescription>
                </Alert>

                {/* Source Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Select Data Source</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {sources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => setSelectedSource(source.id)}
                        className={`p-3 border rounded-lg text-left transition-colors ${
                          selectedSource === source.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="font-medium">{source.name}</div>
                        <div className="text-xs text-muted-foreground">{source.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => firecrawlMutation.mutate()}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {firecrawlMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Scraping with Firecrawl + AI...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Scrape Real Tenders from {sources.find(s => s.id === selectedSource)?.name}
                    </>
                  )}
                </Button>

                {firecrawlMutation.isSuccess && firecrawlMutation.data && (
                  <div className="space-y-3">
                    <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        {firecrawlMutation.data.message}
                      </AlertDescription>
                    </Alert>
                    
                    {firecrawlMutation.data.results && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Results by Source:</p>
                        {firecrawlMutation.data.results.map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{result.source}</span>
                            <div className="flex items-center gap-2">
                              {result.error ? (
                                <Badge variant="destructive">Error</Badge>
                              ) : (
                                <Badge variant="secondary">{result.tenders.length} tenders</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="basic" className="space-y-4 mt-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Basic Scraper:</strong> Falls back to synthetic/sample data if live sources are unavailable. 
                    Good for testing and development.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => basicScraperMutation.mutate()}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                  size="lg"
                >
                  {basicScraperMutation.isPending ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Running Basic Scraper...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Basic Scraper
                    </>
                  )}
                </Button>

                {basicScraperMutation.isSuccess && (
                  <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Basic scraper completed successfully! Check the Browse Tenders page.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            </Tabs>

            {(firecrawlMutation.isError || basicScraperMutation.isError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Error occurred while scraping. Please check the logs and try again.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">About the Scraper</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong>Data Sources:</strong> MyGov Kenya, Tenders.go.ke (PPIP), PPRA Kenya, and more county portals.
            </p>
            <p>
              <strong>Scraping Method:</strong> Uses Firecrawl for reliable web scraping with JavaScript rendering, 
              combined with Lovable AI for intelligent data extraction and structuring.
            </p>
            <p>
              <strong>Deduplication:</strong> Tenders are automatically checked for duplicates before saving.
            </p>
            <p>
              <strong>Categories:</strong> Construction, ICT, Consultancy, Supply, Transport, Healthcare, Education, Agriculture, Environment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
