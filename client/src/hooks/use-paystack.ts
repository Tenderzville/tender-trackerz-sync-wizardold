import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PaystackPlan {
  id: string;
  name: string;
  amount: number; // In KES
  interval: 'monthly' | 'annually';
}

export const PAYSTACK_PLANS: PaystackPlan[] = [
  { id: 'pro', name: 'Pro Monthly', amount: 2600, interval: 'monthly' },
  { id: 'business', name: 'Business Monthly', amount: 6500, interval: 'monthly' },
  { id: 'pro_annual', name: 'Pro Annual', amount: 24960, interval: 'annually' },
  { id: 'business_annual', name: 'Business Annual', amount: 62400, interval: 'annually' },
];

export function usePaystack() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const initializePayment = async (plan: string, email: string, userId: string) => {
    if (isLoading) {
      console.warn('Payment already in progress');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Initializing Paystack payment:', { plan, email, userId });
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize',
          plan,
          email,
          user_id: userId,
          callback_url: `${window.location.origin}/subscription/callback`,
        },
      });

      if (error) {
        console.error('Paystack function error:', error);
        throw new Error(error.message || 'Failed to connect to payment service');
      }
      
      if (!data?.success) {
        console.error('Paystack initialization failed:', data);
        throw new Error(data?.error || 'Payment initialization failed');
      }
      
      if (!data?.data?.authorization_url) {
        console.error('No authorization URL in response:', data);
        throw new Error('Invalid payment response - no redirect URL');
      }

      toast({
        title: 'Redirecting to Payment',
        description: 'You will be redirected to Paystack to complete your payment.',
      });

      // Small delay to show toast before redirect
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to Paystack checkout
      window.location.href = data.data.authorization_url;
      
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment initialization failed. Please try again.';
      console.error('Payment error:', message, err);
      
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
      console.log('Verifying payment:', reference);
      
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'verify',
          reference,
        },
      });

      if (error) {
        console.error('Verification error:', error);
        throw new Error(error.message || 'Verification failed');
      }
      
      if (!data?.success) {
        throw new Error(data?.error || 'Payment verification failed');
      }

      toast({
        title: 'Payment Successful!',
        description: data.data?.message || 'Your subscription is now active.',
      });

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment verification failed';
      console.error('Verification error:', message, err);
      
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

      if (error) {
        console.error('Access check error:', error);
        return { has_access: false };
      }
      
      return data?.data || { has_access: false };
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
