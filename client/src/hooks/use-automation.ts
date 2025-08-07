import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useAutomation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch automation logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data;
    },
  });

  // Trigger manual scraper
  const triggerScraper = useMutation({
    mutationFn: async (source: string = 'tenders.go.ke') => {
      const { data, error } = await supabase.functions.invoke('manual-scraper-trigger', {
        body: { source }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Scraper triggered successfully",
        description: `Started scraping from ${data.source}. Check logs for progress.`,
      });
      queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to trigger scraper",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    logs,
    isLoading,
    triggerScraper: triggerScraper.mutate,
    isTriggering: triggerScraper.isPending,
  };
}