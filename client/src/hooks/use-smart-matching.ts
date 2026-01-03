import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export function useSmartMatching() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matchedTenders, isLoading, refetch } = useQuery({
    queryKey: ['smart-matched-tenders'],
    queryFn: async (): Promise<MatchResult | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase.functions.invoke('smart-tender-matcher', {
        body: { action: 'match-tenders', userId: user.id },
      });

      if (error) {
        console.error('Smart matching error:', error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const runMatchingMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('smart-tender-matcher', {
        body: { action: 'match-tenders', userId: user.id },
      });

      if (error) throw error;
      return data as MatchResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['smart-matched-tenders'] });
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
      
      if (data.alertsCreated > 0) {
        toast({
          title: "New Matches Found!",
          description: `Found ${data.matchesFound} matching tenders, ${data.alertsCreated} new alerts created.`,
        });
      } else {
        toast({
          title: "Matching Complete",
          description: `Analyzed ${data.totalTenders} tenders, ${data.matchesFound} match your preferences.`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Matching Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    matchedTenders,
    isLoading,
    refetch,
    runMatching: runMatchingMutation.mutate,
    isRunning: runMatchingMutation.isPending,
  };
}

export function getMatchLevelColor(level: string): string {
  switch (level) {
    case 'High Chance':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'Good Fit':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'Moderate':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
}

export function getMatchScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 55) return 'text-blue-600';
  if (score >= 35) return 'text-yellow-600';
  return 'text-gray-500';
}
