import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaystack } from "@/hooks/use-paystack";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

export default function SubscriptionCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [details, setDetails] = useState<{
    plan?: string;
    amount?: number;
    currency?: string;
  } | null>(null);
  const { verifyPayment } = usePaystack();

  useEffect(() => {
    const verifyTransaction = async () => {
      try {
        // Get reference from URL
        const urlParams = new URLSearchParams(window.location.search);
        const reference = urlParams.get('reference') || urlParams.get('trxref');

        if (!reference) {
          setStatus('error');
          setMessage('No payment reference found. Please try again or contact support.');
          return;
        }

        const result = await verifyPayment(reference);
        
        if (result.status === 'success') {
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');
          setDetails({
            plan: result.plan,
            amount: result.amount,
            currency: result.currency
          });
        } else {
          setStatus('failed');
          setMessage('Payment was not successful. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Failed to verify payment. Please contact support.');
      }
    };

    verifyTransaction();
  }, []);

  const getStatusIcon = () => {
    switch (status) {
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

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-primary/20';
      case 'success':
        return 'border-green-500/20 bg-green-50 dark:bg-green-900/10';
      case 'failed':
        return 'border-red-500/20 bg-red-50 dark:bg-red-900/10';
      case 'error':
        return 'border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className={`max-w-md w-full ${getStatusColor()}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-2xl">
            {status === 'loading' && 'Processing Payment'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'failed' && 'Payment Failed'}
            {status === 'error' && 'Verification Issue'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === 'success' && details && (
            <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-green-800 dark:text-green-200">
                {details.plan} Plan Activated
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Amount: {details.currency} {details.amount?.toLocaleString()}
              </p>
            </div>
          )}

          <div className="pt-4 space-y-2">
            {status === 'success' && (
              <Button 
                className="w-full" 
                onClick={() => setLocation('/dashboard')}
              >
                Go to Dashboard
              </Button>
            )}
            
            {(status === 'failed' || status === 'error') && (
              <>
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/subscription')}
                >
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

            {status === 'loading' && (
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your payment with Paystack...
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
