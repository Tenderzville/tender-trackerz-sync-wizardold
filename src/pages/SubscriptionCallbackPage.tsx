import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, AlertCircle, Home, ArrowRight } from 'lucide-react';

type VerificationStatus = 'loading' | 'success' | 'failed' | 'error';

interface VerificationResult {
  status: VerificationStatus;
  message: string;
  plan?: string;
  amount?: number;
  currency?: string;
}

export default function SubscriptionCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState<VerificationResult>({
    status: 'loading',
    message: 'Verifying your payment...',
  });

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const reference = searchParams.get('reference') || searchParams.get('trxref');
        
        if (!reference) {
          setResult({
            status: 'error',
            message: 'No payment reference found. Please contact support if you believe this is an error.',
          });
          return;
        }

        const { data, error } = await supabase.functions.invoke('paystack-payment', {
          body: {
            action: 'verify',
            reference,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data?.success && data?.data?.status === 'success') {
          setResult({
            status: 'success',
            message: 'Payment successful! Your subscription is now active.',
            plan: data.data.plan,
            amount: data.data.amount,
            currency: data.data.currency,
          });
        } else {
          setResult({
            status: 'failed',
            message: data?.error || 'Payment was not successful. Please try again.',
          });
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setResult({
          status: 'error',
          message: error instanceof Error ? error.message : 'Failed to verify payment. Please contact support.',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  const getStatusIcon = () => {
    switch (result.status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-yellow-500" />;
    }
  };

  const getCardStyle = () => {
    switch (result.status) {
      case 'loading':
        return 'border-primary/30';
      case 'success':
        return 'border-green-500/30 bg-green-50/50 dark:bg-green-900/10';
      case 'failed':
        return 'border-red-500/30 bg-red-50/50 dark:bg-red-900/10';
      case 'error':
        return 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-900/10';
    }
  };

  const formatPlanName = (plan: string) => {
    return plan
      .replace('_annual', ' Annual')
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className={`max-w-md w-full ${getCardStyle()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">
            {result.status === 'loading' && 'Processing Payment'}
            {result.status === 'success' && 'Payment Successful!'}
            {result.status === 'failed' && 'Payment Failed'}
            {result.status === 'error' && 'Verification Issue'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{result.message}</p>

          {result.status === 'success' && result.plan && (
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-green-800 dark:text-green-200">
                {formatPlanName(result.plan)} Plan Activated
              </p>
              {result.amount && (
                <p className="text-sm text-green-700 dark:text-green-300">
                  Amount: {result.currency || 'KES'} {result.amount.toLocaleString()}
                </p>
              )}
            </div>
          )}

          <div className="pt-4 space-y-3">
            {result.status === 'success' && (
              <Button className="w-full" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            {result.status === 'failed' && (
              <>
                <Button className="w-full" onClick={() => navigate('/subscription')}>
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('mailto:support@tenderzville.com', '_blank')}
                >
                  Contact Support
                </Button>
              </>
            )}

            {result.status === 'error' && (
              <>
                <Button className="w-full" onClick={() => navigate('/subscription')}>
                  Back to Subscription
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('mailto:support@tenderzville.com', '_blank')}
                >
                  Contact Support
                </Button>
              </>
            )}

            {result.status === 'loading' && (
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your payment with Paystack...
              </p>
            )}

            {result.status !== 'loading' && (
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
