import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, TrendingUp, MapPin, Calendar, Building2, DollarSign, 
  Sparkles, ChevronRight, Star, Zap, Filter, RefreshCw, ExternalLink, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface MatchedTender {
  id: number;
  title: string;
  organization: string;
  category: string;
  location: string;
  deadline: string;
  budget: number;
  score: number;
  level: 'High Chance' | 'Good Fit' | 'Moderate' | 'Low Fit';
  reasons: string[];
  source_url?: string;
  tender_number?: string;
}

interface MatchResult {
  success: boolean;
  totalTenders: number;
  matchesFound: number;
  alertsCreated: number;
  preferences: {
    categories: string[];
    locations: string[];
    keywordCount: number;
  };
  topMatches: MatchedTender[];
}

export default function SmartMatchesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch user preferences to check if they have any
  const { data: preferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch matches from edge function
  const { data: matchResult, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['smart-matched-tenders', user?.id],
    queryFn: async (): Promise<MatchResult | null> => {
      if (!user?.id) return null;

      const { data, error } = await supabase.functions.invoke('smart-tender-matcher', {
        body: { action: 'match-tenders', userId: user.id },
      });

      if (error) {
        console.error('Smart matching error:', error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    enabled: !!user?.id,
  });

  const matches = matchResult?.topMatches || [];
  const hasPreferences = preferences && (
    (preferences.sectors?.length > 0) || 
    (preferences.counties?.length > 0) || 
    (preferences.keywords?.length > 0)
  );

  // Categorize matches by level
  const categorizedMatches = useMemo(() => ({
    excellent: matches.filter((m) => m.level === 'High Chance'),
    good: matches.filter((m) => m.level === 'Good Fit'),
    fair: matches.filter((m) => m.level === 'Moderate' || m.level === 'Low Fit'),
  }), [matches]);

  const filteredMatches = useMemo(() => {
    if (activeTab === 'all') return matches;
    return categorizedMatches[activeTab as keyof typeof categorizedMatches] || [];
  }, [activeTab, matches, categorizedMatches]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 border-green-500 bg-green-500/10';
    if (score >= 55) return 'text-blue-600 border-blue-500 bg-blue-500/10';
    if (score >= 35) return 'text-yellow-600 border-yellow-500 bg-yellow-500/10';
    return 'text-muted-foreground border-muted bg-muted/30';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'High Chance': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'Good Fit': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'Moderate': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({ title: 'Refreshing matches...', description: 'Re-analyzing tenders against your preferences.' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">Smart Matches</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                AI-powered tender recommendations based on your preferences and history
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={isFetching}
              variant="outline"
              size="sm"
              className="gap-2 self-start"
            >
              <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
              {isFetching ? 'Matching...' : 'Refresh'}
            </Button>
          </div>

          {/* Preferences Warning */}
          {!hasPreferences && !isLoading && (
            <div className="mt-4 flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-600">No preferences configured</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Match scores are low because you haven't set your sectors, locations, or keywords. 
                  <a href="/settings" className="text-primary underline ml-1">Configure preferences →</a>
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          {matchResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Card className="bg-card/50">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-xl font-bold">{matchResult.totalTenders}</p>
                      <p className="text-xs text-muted-foreground">Analyzed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="text-xl font-bold text-green-600">{categorizedMatches.excellent.length}</p>
                      <p className="text-xs text-green-600/80">High Chance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="text-xl font-bold text-blue-600">{categorizedMatches.good.length}</p>
                      <p className="text-xs text-blue-600/80">Good Fit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/5 border-yellow-500/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-600" />
                    <div>
                      <p className="text-xl font-bold text-yellow-600">{matchResult.matchesFound}</p>
                      <p className="text-xs text-yellow-600/80">Total Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="gap-1 text-xs sm:text-sm">
              <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
              All ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="excellent" className="gap-1 text-xs sm:text-sm">
              <Star className="h-3 w-3 sm:h-4 sm:w-4" />
              High ({categorizedMatches.excellent.length})
            </TabsTrigger>
            <TabsTrigger value="good" className="gap-1 text-xs sm:text-sm">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
              Good ({categorizedMatches.good.length})
            </TabsTrigger>
            <TabsTrigger value="fair" className="gap-1 text-xs sm:text-sm">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              Other ({categorizedMatches.fair.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {isLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <Skeleton className="h-4 w-1/2 mb-2" />
                      <Skeleton className="h-4 w-1/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                  <p className="text-muted-foreground mb-4">
                    {!hasPreferences
                      ? 'Set your sectors, locations, and keywords in Settings to get personalized matches.'
                      : 'No tenders currently match your criteria. Check back soon!'}
                  </p>
                  <Button variant="outline" asChild>
                    <a href="/settings">Update Preferences</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredMatches.map((match) => (
                  <Card 
                    key={match.id} 
                    className="hover:shadow-md transition-all duration-200 group"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        {/* Match Score Circle */}
                        <div className="flex-shrink-0 self-start">
                          <div className={cn(
                            "w-16 h-16 rounded-full flex flex-col items-center justify-center border-3",
                            getScoreColor(match.score)
                          )}>
                            <span className="text-xl font-bold">{match.score}</span>
                            <span className="text-[10px] opacity-70">Match</span>
                          </div>
                        </div>

                        {/* Tender Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                              {match.title}
                            </h3>
                            <Badge className={cn("flex-shrink-0 text-xs", getLevelColor(match.level))}>
                              {match.level}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{match.organization}</span>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap gap-3 mb-3 text-xs">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {match.location}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDistanceToNow(parseISO(match.deadline), { addSuffix: true })}
                            </span>
                            {match.budget > 0 && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                {formatCurrency(match.budget)}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">{match.category}</Badge>
                          </div>

                          {/* Match Reasons */}
                          <div className="bg-muted/50 rounded-lg p-2.5">
                            <p className="text-[11px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Why this matches:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {match.reasons.map((reason, idx) => (
                                <Badge key={idx} variant="secondary" className="text-[11px] py-0">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {/* Source link */}
                          {(() => {
                            const genericPortals = ['https://tenders.go.ke/', 'https://tenders.go.ke', 'https://egpkenya.go.ke'];
                            const hasSpecificUrl = match.source_url && !genericPortals.includes(match.source_url);
                            const sourceUrl = hasSpecificUrl
                              ? match.source_url
                              : match.tender_number
                                ? `https://tenders.go.ke/website/tender/search?keyword=${encodeURIComponent(match.tender_number)}`
                                : null;
                            
                            return sourceUrl ? (
                              <div className="mt-2 flex items-center gap-2">
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3 w-3 mr-1" />
                                    View on source portal
                                  </a>
                                </Button>
                                {match.tender_number && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    Ref: {match.tender_number}
                                  </span>
                                )}
                              </div>
                            ) : null;
                          })()}
                        </div>

                        {/* Action Arrow */}
                        <div className="hidden sm:flex items-center">
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <div className="mt-6 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
          <strong>ℹ️ Note:</strong> Match scores are an <em>Opportunity Alignment Index</em> based on how well a tender matches your configured preferences (sectors, locations, keywords, budget range). 
          They do not predict the outcome of any procurement process. Always verify tender details with the procuring entity.
        </div>
      </div>
    </div>
  );
}