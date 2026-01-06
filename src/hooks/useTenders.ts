import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type Tender = Tables<'tenders'>;

export function useTenders(filters?: {
  category?: string;
  location?: string;
  search?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: ['tenders', filters],
    queryFn: async () => {
      let query = supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters?.location && filters.location !== 'all') {
        query = query.eq('location', filters.location);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Tender[];
    },
  });
}

export function useSavedTenders(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-tenders', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('saved_tenders')
        .select(`
          id,
          tender_id,
          created_at,
          tenders (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}

export function useSaveTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenderId, userId }: { tenderId: number; userId: string }) => {
      const { data, error } = await supabase
        .from('saved_tenders')
        .insert({ tender_id: tenderId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tenders'] });
    },
  });
}

export function useUnsaveTender() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenderId, userId }: { tenderId: number; userId: string }) => {
      const { error } = await supabase
        .from('saved_tenders')
        .delete()
        .eq('tender_id', tenderId)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tenders'] });
    },
  });
}
