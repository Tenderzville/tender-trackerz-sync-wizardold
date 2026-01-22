import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePaystack, PAYSTACK_PLANS } from '@/hooks/usePaystack';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Crown, Check, Star, Zap, Shield, Copy, Twitter, Users, Gift, Loader2 } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    features: [
      'Browse all tenders',
      'Save up to 5 tenders',
      'Basic search filters',
      'Email notifications (weekly)',
    ],
    limitations: [
      'Limited tender details',
      'No AI analysis',
      'No consortium features',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 500,
    period: 'month',
    paystack_plan: 'pro',
    features: [
      'Unlimited tender saves',
      'Full tender details',
      'AI-powered analysis',
      'Smart matching',
      'Consortium creation',
      'Priority email support',
      'Real-time notifications',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: 1500,
    period: 'month',
    paystack_plan: 'business',
    features: [
      'Everything in Pro',
      'Multiple team members',
      'API access',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'SLA guarantee',
    ],
  },
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { initializePayment, isLoading: paymentLoading } = usePaystack();
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Fetch profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopiedReferral(true);
      toast({ title: 'Referral code copied!' });
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user?.email || !user?.id) {
      toast({ 
        title: 'Login Required', 
        description: 'Please log in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    if (planId === 'free') {
      toast({ 
        title: 'Free Plan', 
        description: 'You are already on the free plan!',
      });
      return;
    }

    setSelectedPlan(planId);
    
    try {
      await initializePayment(planId, user.email, user.id);
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setSelectedPlan(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isCurrentPlan = (planId: string) => {
    if (!profile) return planId === 'free';
    return profile.subscription_type === planId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2">
          <Crown className="w-7 h-7 text-primary" />
          Subscription
        </h1>
        <p className="text-muted-foreground mt-1">
          Choose the plan that fits your needs
        </p>
      </div>

      {/* Current Plan */}
      {profile && (
        <Card className={profile.is_founding_member ? 'border-primary bg-primary/5' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile.is_founding_member && <Shield className="w-5 h-5 text-primary" />}
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold capitalize">{profile.subscription_type || 'Free'}</span>
                  {profile.is_founding_member && (
                    <Badge variant="default" className="bg-primary">Founding Member</Badge>
                  )}
                  {profile.subscription_status === 'active' && profile.subscription_type !== 'free' && (
                    <Badge variant="outline" className="text-green-600 border-green-300">Active</Badge>
                  )}
                </div>
                {profile.subscription_end_date && (
                  <p className="text-muted-foreground mt-1">
                    {profile.subscription_status === 'active' ? 'Renews' : 'Expires'}: {formatDate(profile.subscription_end_date)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold text-primary">{profile.loyalty_points || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Founding Member Banner */}
      {!profile?.is_founding_member && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Become a Founding Member</h3>
                <p className="text-sm text-muted-foreground">
                  Get lifetime premium features by completing simple tasks
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://twitter.com/tenderkenya" target="_blank" rel="noopener noreferrer">
                    <Twitter className="w-4 h-4 mr-1" />
                    Follow
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.id === 'pro' && <Star className="w-5 h-5 text-primary" />}
                {plan.id === 'business' && <Zap className="w-5 h-5 text-primary" />}
                {plan.name}
              </CardTitle>
              <div className="mt-2">
                <span className="text-3xl font-bold">
                  {plan.price === 0 ? 'Free' : `KSh ${plan.price.toLocaleString()}`}
                </span>
                {plan.price > 0 && (
                  <span className="text-muted-foreground">/{plan.period}</span>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                disabled={isCurrentPlan(plan.id) || (paymentLoading && selectedPlan === plan.id)}
                onClick={() => handleSubscribe(plan.id)}
              >
                {paymentLoading && selectedPlan === plan.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan(plan.id) ? (
                  'Current Plan'
                ) : plan.price === 0 ? (
                  'Get Started'
                ) : (
                  'Subscribe'
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Annual Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Annual Plans - Save 20%
          </CardTitle>
          <CardDescription>
            Pay annually and get 2 months free
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Pro Annual</span>
                <Badge variant="secondary">Save KSh 1,200</Badge>
              </div>
              <p className="text-2xl font-bold">KSh 4,800<span className="text-sm text-muted-foreground">/year</span></p>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                disabled={paymentLoading && selectedPlan === 'pro_annual'}
                onClick={() => handleSubscribe('pro_annual')}
              >
                {paymentLoading && selectedPlan === 'pro_annual' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : 'Subscribe Annually'}
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold">Business Annual</span>
                <Badge variant="secondary">Save KSh 3,600</Badge>
              </div>
              <p className="text-2xl font-bold">KSh 14,400<span className="text-sm text-muted-foreground">/year</span></p>
              <Button 
                className="w-full mt-4" 
                variant="outline"
                disabled={paymentLoading && selectedPlan === 'business_annual'}
                onClick={() => handleSubscribe('business_annual')}
              >
                {paymentLoading && selectedPlan === 'business_annual' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : 'Subscribe Annually'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Refer & Earn
          </CardTitle>
          <CardDescription>
            Invite friends and earn loyalty points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">Your referral code:</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-4 py-2 rounded-lg font-mono text-lg">
                  {profile?.referral_code || 'Loading...'}
                </code>
                <Button variant="outline" size="icon" onClick={copyReferralCode}>
                  <Copy className={`w-4 h-4 ${copiedReferral ? 'text-primary' : ''}`} />
                </Button>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Referrals</p>
              <div className="flex items-center gap-1">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{profile?.total_referrals || 0}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2 mb-2">
              <Shield className="w-4 h-4" />
              Secure payments powered by Paystack
            </p>
            <p>All payments are processed in Kenyan Shillings (KES) via M-Pesa, Card, or Bank Transfer</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
