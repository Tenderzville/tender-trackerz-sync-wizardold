import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '../../src/integrations/supabase/types';

type Tender = Database['public']['Tables']['tenders']['Row'];
type SavedTender = Database['public']['Tables']['saved_tenders']['Row'];

interface TenderFilters {
  category?: string;
  location?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export function useTenders(filters: TenderFilters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tenders', filters],
    queryFn: async () => {
      let query = supabase
        .from('tenders')
        .select('*, ai_analyses(*)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.location) {
        query = query.eq('location', filters.location);
      }
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return {
    tenders: data || [],
    isLoading,
    error,
  };
}

export function useSavedTenders() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['saved-tenders', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('saved_tenders')
        .select(`
          *,
          tenders (
            *,
            ai_analyses (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    savedTenders: data || [],
    isLoading,
  };
}

export function useSaveTender() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenderId, save }: { tenderId: number; save: boolean }) => {
      if (!user?.id) throw new Error('No user ID');

      if (save) {
        const { error } = await supabase
          .from('saved_tenders')
          .insert({
            user_id: user.id,
            tender_id: tenderId,
          });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_tenders')
          .delete()
          .eq('user_id', user.id)
          .eq('tender_id', tenderId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-tenders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['tenders'] });
    },
  });
}

export function useCheckSavedTender(tenderId: number) {
  const { user } = useAuth();

  const { data: isSaved } = useQuery({
    queryKey: ['tender-saved', user?.id, tenderId],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase
        .from('saved_tenders')
        .select('id')
        .eq('user_id', user.id)
        .eq('tender_id', tenderId)
        .single();
      
      return !error && !!data;
    },
    enabled: !!user?.id,
  });

  return isSaved || false;
}