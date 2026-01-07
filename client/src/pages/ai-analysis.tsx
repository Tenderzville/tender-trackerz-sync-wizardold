import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Brain, TrendingUp, Target, Lightbulb, BarChart3, AlertCircle, 
  RefreshCw, DollarSign, Users, History, AlertTriangle, Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WinProbabilityResult {
  tenderId: number;
  tenderTitle: string;
  winProbability: number;
  confidence: number;
  percentageError: number;
  estimatedBidRange: {
    low: number;
    optimal: number;
    high: number;
    inflationAdjusted: boolean;
  };
  historicalComparison: {
    similarContractsCount: number;
    avgAwardedAmount: number;
    avgInflationAdjusted: number;
    priceVariance: number;
    commonWinnerTypes: string[];
  };
  competitionLevel: string;
  factors: {
    categoryMatch: number;
    locationMatch: number;
    budgetFit: number;
    historicalTrend: number;
    competitionIntensity: number;
  };
  disclaimer: string;
}

export default function AiAnalysis() {
  const [selectedTenderId, setSelectedTenderId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenders for selection
  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ["tenders-for-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("id, title, category, location, budget_estimate")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Fetch historical data count
  const { data: historicalCount } = useQuery({
    queryKey: ["historical-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("historical_tender_awards")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Import historical data mutation
  const importMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("import-historical-data", {
        body: { limit: 2000, offset: 0 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["historical-count"] });
      toast({
        title: "Import Started",
        description: `Imported ${data.data?.inserted || 0} contracts. ${data.data?.has_more ? 'Run again for more.' : 'Import complete!'}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Fetch win probability for selected tender
  const { data: analysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ["win-probability", selectedTenderId],
    queryFn: async (): Promise<WinProbabilityResult | null> => {
      if (!selectedTenderId) return null;
      
      const { data, error } = await supabase.functions.invoke("win-probability-engine", {
        body: { tender_id: parseInt(selectedTenderId) },
      });
      
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: !!selectedTenderId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-500";
      case "medium": return "bg-yellow-500";
      case "high": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <DesktopSidebar />
      
      <div className="flex-1 overflow-auto">
        <MobileHeader />
        
        {/* Header */}
        <section className="p-6 lg:p-8 border-b">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <Brain className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl lg:text-3xl font-bold">AI Win Probability</h1>
                </div>
                <p className="text-muted-foreground">
                  Real estimates based on {historicalCount?.toLocaleString() || 0} historical Kenya contracts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={historicalCount && historicalCount > 1000 ? "default" : "destructive"}>
                  <Database className="h-3 w-3 mr-1" />
                  {historicalCount?.toLocaleString() || 0} Records
                </Badge>
                {(!historicalCount || historicalCount < 1000) && (
                  <Button 
                    size="sm" 
                    onClick={() => importMutation.mutate()}
                    disabled={importMutation.isPending}
                  >
                    {importMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Database className="h-4 w-4 mr-2" />
                    )}
                    Import Data
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Tender Selection */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Select Tender for Analysis</CardTitle>
                <CardDescription>
                  Choose an active tender to calculate win probability based on historical data
                </CardDescription>
              </CardHeader>
              <CardContent className="flex gap-4">
                <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a tender..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tendersLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : tenders && tenders.length > 0 ? (
                      tenders.map((tender) => (
                        <SelectItem key={tender.id} value={tender.id.toString()}>
                          {tender.title.substring(0, 60)}... ({tender.category})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>No active tenders</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => refetchAnalysis()}
                  disabled={!selectedTenderId || analysisLoading}
                >
                  {analysisLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisLoading && (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Skeleton className="h-60" />
                  <Skeleton className="h-60" />
                </div>
              </div>
            )}

            {analysis && (
              <>
                {/* Disclaimer Alert */}
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Legal Disclaimer</AlertTitle>
                  <AlertDescription className="text-sm">
                    {analysis.disclaimer}
                  </AlertDescription>
                </Alert>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Target className="h-5 w-5 text-primary" />
                        <Badge variant="secondary">
                          ±{analysis.percentageError}% Error
                        </Badge>
                      </div>
                      <p className="text-3xl font-bold text-primary">
                        {analysis.winProbability}%
                      </p>
                      <p className="text-sm text-muted-foreground">Win Probability</p>
                      <Progress value={analysis.winProbability} className="mt-2 h-2" />
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <Badge variant="outline" className="text-green-600">
                          Inflation Adjusted
                        </Badge>
                      </div>
                      <p className="text-lg font-bold text-green-700">
                        {formatCurrency(analysis.estimatedBidRange.optimal)}
                      </p>
                      <p className="text-sm text-muted-foreground">Optimal Bid</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {formatCurrency(analysis.estimatedBidRange.low)} - {formatCurrency(analysis.estimatedBidRange.high)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <History className="h-5 w-5 text-blue-600" />
                        <Badge variant="outline" className="text-blue-600">Historical</Badge>
                      </div>
                      <p className="text-2xl font-bold text-blue-700">
                        {analysis.historicalComparison.similarContractsCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Similar Contracts</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg: {formatCurrency(analysis.historicalComparison.avgInflationAdjusted)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="h-5 w-5 text-orange-600" />
                        <div className={`w-3 h-3 rounded-full ${getCompetitionColor(analysis.competitionLevel)}`} />
                      </div>
                      <p className="text-2xl font-bold text-orange-700 capitalize">
                        {analysis.competitionLevel}
                      </p>
                      <p className="text-sm text-muted-foreground">Competition Level</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Variance: {analysis.historicalComparison.priceVariance}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Factor Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Factor Analysis
                      </CardTitle>
                      <CardDescription>
                        Breakdown of factors affecting win probability
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {Object.entries(analysis.factors).map(([key, value]) => (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <span className="text-sm text-muted-foreground">{value}%</span>
                          </div>
                          <Progress value={value} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Winner Profile
                      </CardTitle>
                      <CardDescription>
                        Common characteristics of past winners
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-2">Common Winner Types</p>
                          <div className="flex flex-wrap gap-2">
                            {analysis.historicalComparison.commonWinnerTypes.length > 0 ? (
                              analysis.historicalComparison.commonWinnerTypes.map((type, idx) => (
                                <Badge key={idx} variant="secondary" className="capitalize">
                                  {type.replace(/_/g, ' ')}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">No data available</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Historical Pricing</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Original Average</p>
                              <p className="font-semibold">
                                {formatCurrency(analysis.historicalComparison.avgAwardedAmount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">2026 Adjusted</p>
                              <p className="font-semibold text-primary">
                                {formatCurrency(analysis.historicalComparison.avgInflationAdjusted)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Confidence Level</p>
                          <div className="flex items-center gap-3">
                            <Progress value={analysis.confidence} className="flex-1 h-3" />
                            <span className="text-sm font-bold">{analysis.confidence}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Based on {analysis.historicalComparison.similarContractsCount} similar contracts
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Recommendations */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500" />
                      Strategic Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Optimal Pricing Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          Based on historical data, bid between {formatCurrency(analysis.estimatedBidRange.low)} and {formatCurrency(analysis.estimatedBidRange.high)} for the best chance of winning while maintaining profitability.
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Competition Strategy</p>
                        <p className="text-sm text-muted-foreground">
                          {analysis.competitionLevel === 'high' 
                            ? 'High competition detected. Consider forming a consortium or highlighting unique value propositions.'
                            : analysis.competitionLevel === 'low'
                            ? 'Low competition environment. Focus on meeting all technical requirements rather than aggressive pricing.'
                            : 'Moderate competition. Balance competitive pricing with quality demonstration.'}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Winner Type Insight</p>
                        <p className="text-sm text-muted-foreground">
                          {analysis.historicalComparison.commonWinnerTypes[0] 
                            ? `Most contracts in this category are won by ${analysis.historicalComparison.commonWinnerTypes[0].replace(/_/g, ' ')} entities. Position your bid accordingly.`
                            : 'No clear winner pattern detected. Focus on overall bid quality.'}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Data Confidence</p>
                        <p className="text-sm text-muted-foreground">
                          {analysis.confidence >= 70 
                            ? 'High confidence in estimates due to substantial historical data. These numbers are reliable.'
                            : analysis.confidence >= 50
                            ? 'Moderate confidence. Estimates are indicative but conduct additional market research.'
                            : 'Limited historical data available. Treat estimates as rough guidelines only.'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {!selectedTenderId && !analysisLoading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Select a Tender to Analyze</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Choose an active tender from the dropdown above to calculate real win probability 
                    based on {historicalCount?.toLocaleString() || 0} historical Kenya procurement contracts.
                  </p>
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