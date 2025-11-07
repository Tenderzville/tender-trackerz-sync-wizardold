import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = 'https://mwggjriyxxknotymfsvp.supabase.co';

export function useApi() {
  const { toast } = useToast();

  const callEdgeFunction = async (
    functionName: string,
    operation: string,
    data?: any
  ) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ operation, data })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'API call failed');
      }

      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An error occurred';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  // Tender Operations
  const tenderOps = {
    list: (filters?: any, limit = 50, offset = 0) =>
      callEdgeFunction('tender-operations', 'list', { filters, limit, offset }),
    create: (tenderData: any) =>
      callEdgeFunction('tender-operations', 'create', tenderData),
    update: (id: number, updates: any) =>
      callEdgeFunction('tender-operations', 'update', { id, ...updates }),
    delete: (id: number) =>
      callEdgeFunction('tender-operations', 'delete', { id }),
  };

  // Profile Operations
  const profileOps = {
    get: () => callEdgeFunction('profile-operations', 'get'),
    update: (profileData: any) =>
      callEdgeFunction('profile-operations', 'update', profileData),
    updateSubscription: (subscriptionData: any) =>
      callEdgeFunction('profile-operations', 'update-subscription', subscriptionData),
    addLoyaltyPoints: (points: number) =>
      callEdgeFunction('profile-operations', 'add-loyalty-points', { points }),
  };

  // RFQ Operations
  const rfqOps = {
    create: (rfqData: any) =>
      callEdgeFunction('rfq-operations', 'create-rfq', rfqData),
    update: (id: number, updates: any) =>
      callEdgeFunction('rfq-operations', 'update-rfq', { id, ...updates }),
    delete: (id: number) =>
      callEdgeFunction('rfq-operations', 'delete-rfq', { id }),
    list: (filters?: any, limit = 50, offset = 0) =>
      callEdgeFunction('rfq-operations', 'list-rfqs', { filters, limit, offset }),
    submitQuote: (quoteData: any) =>
      callEdgeFunction('rfq-operations', 'submit-quote', quoteData),
    updateQuote: (id: number, updates: any) =>
      callEdgeFunction('rfq-operations', 'update-quote', { id, ...updates }),
    acceptQuote: (quoteId: number, rfqId: number) =>
      callEdgeFunction('rfq-operations', 'accept-quote', { quote_id: quoteId, rfq_id: rfqId }),
  };

  // Analytics Operations
  const analyticsOps = {
    trackTenderView: (tenderId: number) =>
      callEdgeFunction('analytics-operations', 'track-tender-view', { tender_id: tenderId }),
    trackTenderSave: (tenderId: number) =>
      callEdgeFunction('analytics-operations', 'track-tender-save', { tender_id: tenderId }),
    getDashboardStats: () =>
      callEdgeFunction('analytics-operations', 'get-dashboard-stats'),
    getTrendingTenders: () =>
      callEdgeFunction('analytics-operations', 'get-trending-tenders'),
  };

  return {
    tenderOps,
    profileOps,
    rfqOps,
    analyticsOps,
    callEdgeFunction,
  };
}
