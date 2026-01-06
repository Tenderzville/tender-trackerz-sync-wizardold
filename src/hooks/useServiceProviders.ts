import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type ServiceProvider = Tables<'service_providers'>;

export function useServiceProviders(filters?: {
  specialization?: string;
  availability?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ['service-providers', filters],
    queryFn: async () => {
      let query = supabase
        .from('service_providers')
        .select('*')
        .order('rating', { ascending: false });

      if (filters?.specialization && filters.specialization !== 'all') {
        query = query.eq('specialization', filters.specialization);
      }
      if (filters?.availability && filters.availability !== 'all') {
        query = query.eq('availability', filters.availability);
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,specialization.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ServiceProvider[];
    },
  });
}
