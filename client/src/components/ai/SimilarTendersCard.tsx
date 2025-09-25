import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Search, ExternalLink, TrendingUp, Building, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimilarTendersCardProps {
  tenderId: number;
}

interface SimilarTender {
  id: number;
  title: string;
  organization: string;
  category: string;
  budget_estimate: number;
  similarity_score: number;
  analysis?: {
    win_probability: number;
    estimated_value_min: number;
    estimated_value_max: number;
  };
}

export function SimilarTendersCard({ tenderId }: SimilarTendersCardProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const { data: similarTenders, refetch } = useQuery<SimilarTender[]>({
    queryKey: ['similar-tenders', tenderId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('tender-similarity-analysis', {
        body: { tenderId, limit: 8 }
      });

      if (error) throw error;
      return data || [];
    },
    enabled: false // Don't auto-fetch, wait for user action
  });

  const findSimilarTenders = async () => {
    setIsLoading(true);
    try {
      await refetch();
      toast({
        title: "Analysis Complete",
        description: "Found similar tenders using AI similarity analysis.",
      });
    } catch (error) {
      console.error('Error finding similar tenders:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to find similar tenders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.8) return 'Very Similar';
    if (score >= 0.6) return 'Similar';
    if (score >= 0.4) return 'Somewhat Similar';
    return 'Different';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Similar Tenders Analysis
          </CardTitle>
          <Button 
            onClick={findSimilarTenders} 
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? 'Analyzing...' : 'Find Similar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!similarTenders ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Click "Find Similar" to discover tenders similar to this one using AI analysis.
            </p>
            <p className="text-sm text-muted-foreground">
              This analysis uses machine learning to find tenders with similar requirements, 
              budgets, and characteristics to help you understand the competitive landscape.
            </p>
          </div>
        ) : similarTenders.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              No similar tenders found in the database.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Found {similarTenders.length} similar tenders based on AI analysis
            </div>
            
            <div className="space-y-4">
              {similarTenders.map((tender) => (
                <Card key={tender.id} className="border-l-4 border-l-primary/20">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {tender.title}
                          </h4>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {tender.organization}
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {tender.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-sm font-bold ${getSimilarityColor(tender.similarity_score)}`}>
                            {Math.round(tender.similarity_score * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getSimilarityLabel(tender.similarity_score)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-medium">
                            {tender.budget_estimate ? formatCurrency(tender.budget_estimate) : 'N/A'}
                          </span>
                        </div>
                        
                        {tender.analysis && (
                          <div className="text-right">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Win Rate: </span>
                              <span className="font-medium text-green-600">
                                {tender.analysis.win_probability}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Progress 
                        value={tender.similarity_score * 100} 
                        className="h-2"
                      />

                      {tender.analysis && (
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                          AI Estimate: {formatCurrency(tender.analysis.estimated_value_min)} - {formatCurrency(tender.analysis.estimated_value_max)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>How similarity is calculated:</strong></p>
                <p>• Text similarity using NLP embeddings</p>
                <p>• Category and organization matching</p>
                <p>• Budget range comparison</p>
                <p>• Requirements analysis</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}