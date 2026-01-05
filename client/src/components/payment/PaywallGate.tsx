import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePaystack, PAYSTACK_PLANS } from '@/hooks/use-paystack';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Lock, CheckCircle, Crown, Zap, AlertTriangle } from 'lucide-react';

interface PaywallGateProps {
  children: ReactNode;
  requiredPlan?: 'pro' | 'business';
  featureName?: string;
}

export function PaywallGate({ children, requiredPlan = 'pro', featureName }: PaywallGateProps) {
  const { user, profile, isAuthenticated } = useAuth();
  const { isLoading, initializePayment, checkAccess } = usePaystack();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkUserAccess = async () => {
      if (!user?.id) {
        setHasAccess(false);
        setChecking(false);
        return;
      }

      // Quick check from profile first
      const subType = profile?.subscription_type;
      const subStatus = profile?.subscription_status;
      const subEnd = profile?.subscription_end_date;

      // Check if subscription is active and not expired
      if (subStatus === 'active' && subType) {
        if (requiredPlan === 'pro' && ['pro', 'business'].includes(subType)) {
          if (!subEnd || new Date(subEnd) > new Date()) {
            setHasAccess(true);
            setChecking(false);
            return;
          }
        }
        if (requiredPlan === 'business' && subType === 'business') {
          if (!subEnd || new Date(subEnd) > new Date()) {
            setHasAccess(true);
            setChecking(false);
            return;
          }
        }
      }

      // Verify with backend
      const result = await checkAccess(user.id);
      setHasAccess(result.has_access && (
        requiredPlan === 'pro' || result.subscription_type === 'business'
      ));
      setChecking(false);
    };

    checkUserAccess();
  }, [user?.id, profile?.subscription_type, profile?.subscription_status, requiredPlan]);

  if (checking) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-12 text-center">
            <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show paywall
  const plans = requiredPlan === 'business' 
    ? PAYSTACK_PLANS.filter(p => p.id.includes('business'))
    : PAYSTACK_PLANS;

  const handleSubscribe = async (planId: string) => {
    if (!user?.email || !user?.id) return;
    await initializePayment(planId, user.email, user.id);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">
            Upgrade to {requiredPlan === 'business' ? 'Business' : 'Pro'} to Access This Feature
          </CardTitle>
          <CardDescription className="text-lg">
            {featureName ? `"${featureName}" requires` : 'This feature requires'} a {requiredPlan} subscription
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Disclaimer */}
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                <strong>Payment Disclaimer:</strong> All payments are processed securely via Paystack. 
                Subscription fees are non-refundable after 7 days. By subscribing, you agree to our 
                Terms of Service. TenderAlert Pro provides tools and estimates but does not guarantee 
                tender success.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {plans.slice(0, 2).map(plan => (
              <Card key={plan.id} className={plan.id.includes('business') ? 'border-primary' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {plan.id.includes('business') ? (
                        <Crown className="h-5 w-5 text-primary" />
                      ) : (
                        <Zap className="h-5 w-5 text-blue-500" />
                      )}
                      {plan.name}
                    </CardTitle>
                    {plan.id.includes('business') && (
                      <Badge>Best Value</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold mb-4">
                    KES {plan.amount.toLocaleString()}
                    <span className="text-sm font-normal text-muted-foreground">/month</span>
                  </p>
                  
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Unlimited tender alerts
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      AI-powered analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Smart matching
                    </li>
                    {plan.id.includes('business') && (
                      <>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          Unlimited RFQs
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          API access
                        </li>
                      </>
                    )}
                  </ul>
                  
                  <Button 
                    className="w-full" 
                    variant={plan.id.includes('business') ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isLoading || !isAuthenticated}
                  >
                    {isLoading ? 'Processing...' : 'Subscribe Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
