import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Target, RefreshCw, Bookmark, ExternalLink, TrendingUp, Calendar, MapPin, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SmartMatchesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('all');

  // Fetch user preferences
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

  // Fetch matched tenders based on preferences
  const { data: tenders, isLoading, refetch } = useQuery({
    queryKey: ['smart-matches', user?.id, preferences],
    queryFn: async () => {
      if (!user?.id) return [];
      
      let query = supabase
        .from('tenders')
        .select('*')
        .eq('status', 'active')
        .order('deadline', { ascending: true });

      // Apply preference filters if set
      if (preferences?.sectors?.length) {
        query = query.in('category', preferences.sectors);
      }
      if (preferences?.counties?.length) {
        query = query.in('location', preferences.counties);
      }
      if (preferences?.budget_min) {
        query = query.gte('budget_estimate', preferences.budget_min);
      }
      if (preferences?.budget_max) {
        query = query.lte('budget_estimate', preferences.budget_max);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch saved tenders to check save status
  const { data: savedTenders } = useQuery({
    queryKey: ['saved-tenders', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('saved_tenders')
        .select('tender_id')
        .eq('user_id', user.id);
      return data?.map(s => s.tender_id) || [];
    },
    enabled: !!user?.id,
  });

  // Save tender mutation
  const saveTenderMutation = useMutation({
    mutationFn: async (tenderId: number) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const isSaved = savedTenders?.includes(tenderId);
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_tenders')
          .delete()
          .eq('user_id', user.id)
          .eq('tender_id', tenderId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_tenders')
          .insert({ user_id: user.id, tender_id: tenderId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Tender saved!' });
    },
  });

  const formatBudget = (amount: number | null) => {
    if (!amount) return 'Not specified';
    return `KSh ${amount.toLocaleString()}`;
  };

  const getMatchScore = (tender: any) => {
    let score = 0;
    if (preferences?.sectors?.includes(tender.category)) score += 40;
    if (preferences?.counties?.includes(tender.location)) score += 30;
    if (preferences?.keywords?.some((k: string) => 
      tender.title.toLowerCase().includes(k.toLowerCase()) ||
      tender.description.toLowerCase().includes(k.toLowerCase())
    )) score += 30;
    return Math.min(score, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-7 h-7 text-primary" />
            Smart Matches
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-matched tenders based on your preferences
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Preferences Summary */}
      {preferences && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Matching Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {preferences.sectors?.map((sector: string) => (
                <Badge key={sector} variant="secondary">{sector}</Badge>
              ))}
              {preferences.counties?.map((county: string) => (
                <Badge key={county} variant="outline">{county}</Badge>
              ))}
              {preferences.keywords?.map((keyword: string) => (
                <Badge key={keyword} variant="default">{keyword}</Badge>
              ))}
              {!preferences.sectors?.length && !preferences.counties?.length && (
                <p className="text-muted-foreground text-sm">
                  No preferences set. <a href="/settings" className="text-primary underline">Configure your preferences</a> to get personalized matches.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Matches ({tenders?.length || 0})</TabsTrigger>
          <TabsTrigger value="high">High Match (80%+)</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : tenders?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No matches found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your preferences in <a href="/settings" className="text-primary underline">Settings</a>
                </p>
              </CardContent>
            </Card>
          ) : (
            tenders
              ?.filter(tender => {
                if (activeTab === 'high') return getMatchScore(tender) >= 80;
                if (activeTab === 'expiring') {
                  const deadline = new Date(tender.deadline);
                  const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return daysUntil <= 7;
                }
                return true;
              })
              .map((tender) => (
                <Card key={tender.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {getMatchScore(tender)}% Match
                          </Badge>
                          <Badge variant="outline" className="text-xs">{tender.category}</Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{tender.title}</h3>
                        
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {tender.organization}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tender.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDistanceToNow(new Date(tender.deadline), { addSuffix: true })}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {formatBudget(tender.budget_estimate)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {tender.description}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => saveTenderMutation.mutate(tender.id)}
                        >
                          <Bookmark 
                            className={`w-5 h-5 ${savedTenders?.includes(tender.id) ? 'fill-primary text-primary' : ''}`} 
                          />
                        </Button>
                        {tender.source_url && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-5 h-5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
