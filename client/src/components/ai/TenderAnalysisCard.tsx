import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Brain, TrendingUp, Target, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TenderAnalysisCardProps {
  tenderId: number;
  showExpanded?: boolean;
}

export function TenderAnalysisCard({ tenderId, showExpanded = false }: TenderAnalysisCardProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ['ai-analysis', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('tender_id', tenderId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    },
  });

  const generateAnalysis = async (forceRegenerate = false) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tender-analysis', {
        body: { tenderId, forceRegenerate }
      });

      if (error) throw error;

      toast({
        title: "Analysis Generated",
        description: "AI analysis has been completed successfully.",
      });

      refetch();
    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate analysis",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getWinProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-600';
    if (prob >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            No AI analysis available for this tender.
          </p>
          <Button onClick={() => generateAnalysis()} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!showExpanded) {
    return (
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                <span className="font-medium">AI Analysis</span>
                <Badge variant="secondary">{analysis.confidence_score}% confidence</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                Est. {formatCurrency(analysis.estimated_value_min)} - {formatCurrency(analysis.estimated_value_max)}
              </div>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${getWinProbabilityColor(analysis.win_probability)}`}>
                {analysis.win_probability}%
              </div>
              <div className="text-xs text-muted-foreground">Win Probability</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Tender Analysis
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateAnalysis(true)}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Win Probability</span>
                  </div>
                  <div className={`text-2xl font-bold ${getWinProbabilityColor(analysis.win_probability)}`}>
                    {analysis.win_probability}%
                  </div>
                  <Progress value={analysis.win_probability} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Confidence</span>
                  </div>
                  <div className={`text-2xl font-bold ${getConfidenceColor(analysis.confidence_score)}`}>
                    {analysis.confidence_score}%
                  </div>
                  <Progress value={analysis.confidence_score} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Risk Level</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {analysis.analysis_data?.competition_level === 'high' ? 'High' : 
                     analysis.analysis_data?.competition_level === 'medium' ? 'Medium' : 'Low'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Estimated Value Range</h4>
                <div className="text-lg">
                  {formatCurrency(analysis.estimated_value_min)} - {formatCurrency(analysis.estimated_value_max)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on historical data and market analysis
                </p>
              </div>

              {analysis.analysis_data && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Competition Level:</span>
                    <span className="ml-2 capitalize">{analysis.analysis_data.competition_level}</span>
                  </div>
                  <div>
                    <span className="font-medium">Technical Requirements:</span>
                    <span className="ml-2 capitalize">{analysis.analysis_data.technical_requirements}</span>
                  </div>
                  <div>
                    <span className="font-medium">Financial Capacity:</span>
                    <span className="ml-2 capitalize">{analysis.analysis_data.financial_capacity_needed}</span>
                  </div>
                  <div>
                    <span className="font-medium">Historical Win Rate:</span>
                    <span className="ml-2">{analysis.analysis_data.historical_win_rate}%</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h4 className="font-medium">AI Recommendations</h4>
            </div>
            
            {analysis.recommendations && analysis.recommendations.length > 0 ? (
              <div className="space-y-3">
                {analysis.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm flex-1">{recommendation}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No specific recommendations available.</p>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Model Information</h4>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Model Version:</span>
                    <span className="ml-2">{analysis.model_version || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Analysis Date:</span>
                    <span className="ml-2">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {analysis.analysis_data && (
                <div>
                  <h4 className="font-medium mb-2">Technical Details</h4>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">
                    {JSON.stringify(analysis.analysis_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}