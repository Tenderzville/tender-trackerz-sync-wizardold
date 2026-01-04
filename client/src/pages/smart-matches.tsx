import { useState, useMemo } from 'react';
import { useSmartMatching, getMatchLevelColor, getMatchScoreColor } from '@/hooks/use-smart-matching';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, TrendingUp, MapPin, Calendar, Building2, DollarSign, 
  Sparkles, ChevronRight, Star, Zap, Filter, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SmartMatchesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const { matchedTenders, isLoading, refetch, runMatching, isRunning } = useSmartMatching();

  // Get the matches array from the result
  const matches = matchedTenders?.topMatches || [];

  // Categorize matches by level
  const categorizedMatches = useMemo(() => {
    return {
      excellent: matches.filter((m) => m.level === 'High Chance'),
      good: matches.filter((m) => m.level === 'Good Fit'),
      fair: matches.filter((m) => m.level === 'Moderate' || m.level === 'Low Fit'),
    };
  }, [matches]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h1 className="text-2xl md:text-3xl font-bold">Smart Matches</h1>
              </div>
              <p className="text-muted-foreground">
                AI-powered tender recommendations based on your preferences and history
              </p>
            </div>
            <Button 
              onClick={() => runMatching()} 
              disabled={isRunning}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isRunning && "animate-spin")} />
              {isRunning ? 'Matching...' : 'Refresh Matches'}
            </Button>
          </div>

          {/* Quick Stats */}
          {matchedTenders && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card className="bg-card/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{matchedTenders.totalTenders}</p>
                      <p className="text-xs text-muted-foreground">Tenders Analyzed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-500/10 backdrop-blur border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-2xl font-bold text-green-600">{categorizedMatches.excellent.length}</p>
                      <p className="text-xs text-green-600/80">High Chance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-blue-500/10 backdrop-blur border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{categorizedMatches.good.length}</p>
                      <p className="text-xs text-blue-600/80">Good Fit</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-yellow-500/10 backdrop-blur border-yellow-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{matchedTenders.alertsCreated}</p>
                      <p className="text-xs text-yellow-600/80">New Alerts</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="all" className="gap-2">
              <Filter className="h-4 w-4" />
              All ({matches.length})
            </TabsTrigger>
            <TabsTrigger value="excellent" className="gap-2">
              <Star className="h-4 w-4" />
              High ({categorizedMatches.excellent.length})
            </TabsTrigger>
            <TabsTrigger value="good" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Good ({categorizedMatches.good.length})
            </TabsTrigger>
            <TabsTrigger value="fair" className="gap-2">
              <Zap className="h-4 w-4" />
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
                    Update your preferences in Settings to get personalized tender recommendations
                  </p>
                  <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                    Update Preferences
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredMatches.map((match) => (
                  <Card 
                    key={match.id} 
                    className="hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        {/* Match Score Circle */}
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-20 h-20 rounded-full flex flex-col items-center justify-center border-4",
                            match.level === 'High Chance' ? 'border-green-500 bg-green-500/10' :
                            match.level === 'Good Fit' ? 'border-blue-500 bg-blue-500/10' :
                            'border-yellow-500 bg-yellow-500/10'
                          )}>
                            <span className={cn("text-2xl font-bold", getMatchScoreColor(match.score))}>
                              {match.score}
                            </span>
                            <span className="text-xs text-muted-foreground">Match</span>
                          </div>
                        </div>

                        {/* Tender Details */}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                {match.title}
                              </h3>
                              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                <Building2 className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{match.organization}</span>
                              </div>
                            </div>
                            <Badge className={cn("flex-shrink-0", getMatchLevelColor(match.level))}>
                              {match.level}
                            </Badge>
                          </div>

                          {/* Meta Info */}
                          <div className="flex flex-wrap gap-4 mb-4 text-sm">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{match.location}</span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {formatDistanceToNow(parseISO(match.deadline), { addSuffix: true })}
                              </span>
                            </div>
                            {match.budget > 0 && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <DollarSign className="h-4 w-4" />
                                <span>{formatCurrency(match.budget)}</span>
                              </div>
                            )}
                            <Badge variant="outline">{match.category}</Badge>
                          </div>

                          {/* Match Reasons */}
                          <div className="bg-muted/50 rounded-lg p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Why this matches:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {match.reasons.map((reason, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action Arrow */}
                        <div className="hidden lg:flex items-center">
                          <ChevronRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
