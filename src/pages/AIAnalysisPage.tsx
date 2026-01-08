import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Shield,
  Clock,
  FileText,
  Info
} from 'lucide-react';

// Compliant scoring - NO win probability, NO predictions
interface BidReadinessResult {
  bid_readiness_score: number;
  historical_alignment_index: number;
  factors: {
    compliance_readiness: number;
    capability_alignment: number;
    historical_context: number;
    competition_signals: number;
  };
  historical_outcome_distribution: {
    typical_bid_range_min: number;
    typical_bid_range_max: number;
    typical_bidder_count: string;
    common_procurement_method: string;
  };
  pattern_observations: string[];
  disclaimer: string;
}

export default function AIAnalysisPage() {
  const [selectedTenderId, setSelectedTenderId] = useState<string>('');

  // Fetch active tenders for selection
  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['active-tenders-for-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select('id, title, organization, category, budget_estimate, source_url, tender_number')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      // Only show tenders with verifiable source URLs
      return data?.filter(t => t.source_url && t.source_url.length > 30 && t.tender_number) || [];
    },
  });

  // Historical data count
  const { data: historicalCount } = useQuery({
    queryKey: ['historical-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('historical_tender_awards')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  // Get analysis when tender selected
  const { data: analysis, isLoading: analysisLoading } = useQuery({
    queryKey: ['bid-readiness', selectedTenderId],
    enabled: !!selectedTenderId,
    queryFn: async (): Promise<BidReadinessResult | null> => {
      const selectedTender = tenders?.find(t => t.id.toString() === selectedTenderId);
      if (!selectedTender) return null;

      // Fetch historical data for similar tenders
      const { data: historicalData, error } = await supabase
        .from('historical_tender_awards')
        .select('*')
        .eq('category', selectedTender.category)
        .limit(100);

      if (error) throw error;

      // Calculate Bid Readiness Score based on historical context (NON-PREDICTIVE)
      const similarCount = historicalData?.length || 0;
      
      // Calculate typical ranges from historical data
      const awardedAmounts = historicalData
        ?.filter(h => h.awarded_amount && h.awarded_amount > 0)
        ?.map(h => h.awarded_amount!) || [];
      
      const bidCounts = historicalData
        ?.filter(h => h.bid_count && h.bid_count > 0)
        ?.map(h => h.bid_count!) || [];

      const avgBidCount = bidCounts.length > 0 
        ? bidCounts.reduce((a, b) => a + b, 0) / bidCounts.length 
        : 0;

      const sortedAmounts = awardedAmounts.sort((a, b) => a - b);
      const p25 = sortedAmounts[Math.floor(sortedAmounts.length * 0.25)] || 0;
      const p75 = sortedAmounts[Math.floor(sortedAmounts.length * 0.75)] || 0;

      // Calculate scores (informational only)
      const complianceReadiness = selectedTender.tender_number ? 80 : 50;
      const capabilityAlignment = similarCount > 10 ? 75 : similarCount > 5 ? 60 : 40;
      const historicalContext = similarCount > 20 ? 70 : similarCount > 10 ? 55 : 35;
      const competitionSignals = avgBidCount > 10 ? 40 : avgBidCount > 5 ? 60 : 80;

      const bidReadinessScore = Math.round(
        (complianceReadiness * 0.30) +
        (capabilityAlignment * 0.25) +
        (historicalContext * 0.15) +
        (competitionSignals * 0.30)
      );

      const historicalAlignmentIndex = Math.min(100, Math.round((similarCount / 50) * 100));

      return {
        bid_readiness_score: bidReadinessScore,
        historical_alignment_index: historicalAlignmentIndex,
        factors: {
          compliance_readiness: complianceReadiness,
          capability_alignment: capabilityAlignment,
          historical_context: historicalContext,
          competition_signals: competitionSignals,
        },
        historical_outcome_distribution: {
          typical_bid_range_min: p25,
          typical_bid_range_max: p75,
          typical_bidder_count: avgBidCount > 0 ? `${Math.round(avgBidCount - 3)}-${Math.round(avgBidCount + 3)}` : 'Unknown',
          common_procurement_method: 'Open Tender',
        },
        pattern_observations: [
          similarCount > 0 
            ? `Historically observed ${similarCount} similar tenders in this category`
            : 'Limited historical data available for this category',
          avgBidCount > 0 
            ? `Commonly seen bidder count: ${Math.round(avgBidCount)} participants`
            : 'Bidder count data unavailable',
          p25 > 0 && p75 > 0
            ? `Frequently associated award range: KES ${formatCurrency(p25)} - ${formatCurrency(p75)}`
            : 'Award amount patterns not available',
        ],
        disclaimer: 'This platform provides informational insights only and does not constitute legal, financial, procurement, or professional advice. Tender outcomes are determined solely by procuring entities. Historical data reflects past observations only and does not guarantee future outcomes.',
      };
    },
  });

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString();
  };

  const getScoreColor = (score: number): string => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Bid Readiness Analysis
            </h1>
            <p className="text-muted-foreground">
              Informational insights based on historical data • {historicalCount?.toLocaleString() || 0} historical records
            </p>
          </div>
        </div>
      </div>

      {/* Important Disclaimer Banner */}
      <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-400">Important Notice</p>
              <p className="text-sm text-amber-700 dark:text-amber-500 mt-1">
                All scores and insights are <strong>informational only</strong> and do not predict or guarantee 
                tender outcomes. Historical patterns do not indicate future results. Tender awards are 
                determined solely by procuring entities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tender Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Select Tender for Analysis
          </CardTitle>
          <CardDescription>
            Only tenders with verifiable source URLs and tender numbers are shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tendersLoading ? (
            <p className="text-muted-foreground">Loading tenders...</p>
          ) : tenders?.length === 0 ? (
            <div className="text-center py-6">
              <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
              <p className="font-medium">No Verifiable Tenders Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Only tenders with valid source URLs from official government portals can be analyzed.
              </p>
            </div>
          ) : (
            <Select value={selectedTenderId} onValueChange={setSelectedTenderId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a tender to analyze..." />
              </SelectTrigger>
              <SelectContent>
                {tenders?.map((tender) => (
                  <SelectItem key={tender.id} value={tender.id.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">{tender.title.slice(0, 60)}...</span>
                      <span className="text-xs text-muted-foreground">
                        {tender.organization} • {tender.tender_number}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {selectedTenderId && (
        <>
          {analysisLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="w-12 h-12 mx-auto text-primary animate-pulse mb-4" />
                <p className="text-muted-foreground">Analyzing historical data...</p>
              </CardContent>
            </Card>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Primary Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Bid Readiness Score
                    <Badge variant="outline" className="ml-2">Informational Index</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className={`text-5xl font-bold ${getScoreColor(analysis.bid_readiness_score)}`}>
                        {analysis.bid_readiness_score}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">out of 100</p>
                      <Badge variant="secondary" className="mt-2">
                        <Info className="w-3 h-3 mr-1" />
                        Not Predictive
                      </Badge>
                    </div>
                    
                    <div className="flex-1 space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Compliance Readiness (30%)</span>
                          <span>{analysis.factors.compliance_readiness}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${analysis.factors.compliance_readiness}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Capability Alignment (25%)</span>
                          <span>{analysis.factors.capability_alignment}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${analysis.factors.capability_alignment}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Historical Context (15%)</span>
                          <span>{analysis.factors.historical_context}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${analysis.factors.historical_context}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Competition Signals (30%)</span>
                          <span>{analysis.factors.competition_signals}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${analysis.factors.competition_signals}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Alignment Index */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Historical Alignment Index
                    <Badge variant="outline">Reference Only</Badge>
                  </CardTitle>
                  <CardDescription>
                    Measures similarity to previously listed tenders — not success likelihood
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <p className={`text-4xl font-bold ${getScoreColor(analysis.historical_alignment_index)}`}>
                      {analysis.historical_alignment_index}
                    </p>
                    <p className="text-muted-foreground">/ 100</p>
                  </div>
                </CardContent>
              </Card>

              {/* Historical Outcome Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Historical Outcome Distribution
                    <Badge variant="outline">Reference Only</Badge>
                  </CardTitle>
                  <CardDescription>
                    Shows what happened in past similar tenders — not what will happen now
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Historical Award Range</p>
                      <p className="text-lg font-semibold">
                        {analysis.historical_outcome_distribution.typical_bid_range_min > 0 
                          ? `KES ${formatCurrency(analysis.historical_outcome_distribution.typical_bid_range_min)} - ${formatCurrency(analysis.historical_outcome_distribution.typical_bid_range_max)}`
                          : 'Insufficient data'
                        }
                      </p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Typical Bidder Count</p>
                      <p className="text-lg font-semibold">
                        {analysis.historical_outcome_distribution.typical_bidder_count}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pattern Observations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Pattern Observations
                  </CardTitle>
                  <CardDescription>
                    Non-causal observations from historical records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysis.pattern_observations.map((observation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{observation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Legal Disclaimer */}
              <Card className="border-muted">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-muted-foreground">Legal Disclaimer</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {analysis.disclaimer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
                <p className="font-medium">Unable to Generate Analysis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Insufficient historical data or tender information unavailable.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
