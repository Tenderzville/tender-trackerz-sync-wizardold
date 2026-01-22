import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaystackPlan {
  id: string;
  name: string;
  amount: number;
  interval: 'monthly' | 'annually';
}

export const PAYSTACK_PLANS: PaystackPlan[] = [
  { id: 'pro', name: 'Pro Monthly', amount: 500, interval: 'monthly' },
  { id: 'business', name: 'Business Monthly', amount: 1500, interval: 'monthly' },
  { id: 'pro_annual', name: 'Pro Annual', amount: 4800, interval: 'annually' },
  { id: 'business_annual', name: 'Business Annual', amount: 14400, interval: 'annually' },
];

export function usePaystack() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initializePayment = async (plan: string, email: string, userId: string) => {
    setIsLoading(true);
    try {
      const callbackUrl = `${window.location.origin}/subscription/callback`;
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize',
          plan,
          email,
          user_id: userId,
          callback_url: callbackUrl,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      // Redirect to Paystack checkout
      window.location.href = data.data.authorization_url;
      
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initialization failed';
      toast({
        title: 'Payment Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'verify',
          reference,
        },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      toast({
        title: 'Payment Successful!',
        description: data.data.message,
      });

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment verification failed';
      toast({
        title: 'Verification Error',
        description: message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const checkAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'check_access',
          user_id: userId,
        },
      });

      if (error) throw error;
      return data.data;
    } catch (err) {
      console.error('Access check error:', err);
      return { has_access: false };
    }
  };

  return {
    isLoading,
    initializePayment,
    verifyPayment,
    checkAccess,
    plans: PAYSTACK_PLANS,
  };
}
