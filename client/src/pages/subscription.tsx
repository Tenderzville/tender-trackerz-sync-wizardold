import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePaystack, PAYSTACK_PLANS } from "@/hooks/use-paystack";
import { AdMobIntegration } from "@/components/AdMobIntegration";
import { 
  Crown, 
  Gift, 
  Twitter, 
  Users, 
  Copy, 
  CheckCircle,
  ExternalLink,
  Smartphone,
  Download,
  Shield,
  Star,
  Zap,
  AlertCircle,
  Clock,
  FileText
} from "lucide-react";
import { useLocation } from "wouter";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [copiedReferral, setCopiedReferral] = useState(false);
  const { initializePayment, isLoading: paymentLoading } = usePaystack();

  // Fetch user profile
  const { data: profile, refetch: refetchProfile } = useQuery({
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

  // Check founding member availability
  const { data: foundingStatus } = useQuery({
    queryKey: ['founding-status'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('grant-early-user-access', {
        body: { action: 'check_status' }
      });
      if (error) throw error;
      return data;
    },
  });

  const followTwitterMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('profiles')
        .update({ twitter_followed: true, loyalty_points: (profile?.loyalty_points || 0) + 50 })
        .eq('id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Twitter Follow Confirmed!",
        description: "You earned 50 loyalty points!",
      });
      refetchProfile();
    },
  });

  const claimFoundingMemberMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.functions.invoke('grant-early-user-access', {
        body: { user_id: user.id }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || data.message);
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "🏆 Founding Member Access Granted!",
        description: `You're Founding Member #${data.founding_member_number}! Enjoy 1 month FREE Pro access.`,
      });
      refetchProfile();
    },
    onError: (error: any) => {
      toast({
        title: "Cannot Claim Access",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyReferralCode = () => {
    const referralCode = profile?.referral_code || `REF${user?.id?.slice(0, 6).toUpperCase()}`;
    navigator.clipboard.writeText(referralCode);
    setCopiedReferral(true);
    toast({
      title: "Referral Code Copied!",
      description: "Share this code with friends to earn 100 points per successful referral!",
    });
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  const handleSubscribe = async (planId: string) => {
    if (!user?.email || !user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Redirecting to Payment",
      description: "You'll be redirected to Paystack to complete your payment securely.",
    });

    try {
      await initializePayment(planId, user.email, user.id);
    } catch (error) {
      // Error handled in hook
    }
  };

  const isFoundingMember = profile?.is_founding_member;
  const isPro = profile?.subscription_type === 'pro' || profile?.subscription_type === 'business';
  const loyaltyPoints = profile?.loyalty_points || 0;
  const discountPercentage = Math.min(Math.floor(loyaltyPoints / 100) * 5, 50);
  const spotsRemaining = foundingStatus?.spots_remaining ?? 100;
  const foundingAvailable = spotsRemaining > 0;

  // Calculate days remaining for founding member
  const daysRemaining = profile?.founding_member_expires_at 
    ? Math.max(0, Math.ceil((new Date(profile.founding_member_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription & Rewards</h1>
          <p className="text-muted-foreground">
            Manage your subscription and earn rewards for engaging with TenderAlert
          </p>
        </div>

        {/* Founding Member Banner */}
        {foundingAvailable && !isFoundingMember && !isPro && (
          <Card className="mb-8 border-2 border-amber-500/50 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <Star className="h-6 w-6 text-amber-500" />
                  🏆 Founding Members Offer
                </CardTitle>
                <Badge className="bg-amber-500 text-white animate-pulse">
                  {spotsRemaining} spots left!
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-lg text-amber-800 dark:text-amber-200 mb-2">
                    100 Founding Members Access
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
                    The first 100 verified businesses receive complimentary <strong>1-month full Pro access</strong> as early partners helping shape the platform.
                  </p>
                  <ul className="text-sm space-y-1 text-amber-700 dark:text-amber-300">
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Verified businesses only
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      One free month per company
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Auto-convert to paid after 30 days
                    </li>
                  </ul>
                </div>
                <div className="flex flex-col justify-center items-center bg-white/50 dark:bg-black/20 rounded-lg p-4">
                  <div className="text-4xl font-bold text-amber-600 mb-2">FREE</div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mb-4">for 1 month</div>
                  <Button 
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    onClick={() => claimFoundingMemberMutation.mutate()}
                    disabled={claimFoundingMemberMutation.isPending || !profile?.company}
                  >
                    {claimFoundingMemberMutation.isPending ? 'Processing...' : 'Claim Founding Member Access'}
                  </Button>
                  {!profile?.company && (
                    <p className="text-xs text-amber-600 mt-2 text-center">
                      <AlertCircle className="inline h-3 w-3 mr-1" />
                      Complete your company profile first
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                <span 
                  className="hover:underline cursor-pointer" 
                  onClick={() => setLocation('/terms')}
                >
                  View Founding Members Terms & Conditions
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Founding Member Status Card */}
        {isFoundingMember && (
          <Card className="mb-8 border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-amber-500 flex items-center justify-center">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-800 dark:text-amber-200">
                      🏆 Founding Member #{100 - spotsRemaining}
                    </h2>
                    <p className="text-amber-700 dark:text-amber-300">
                      Pro access active • {daysRemaining} days remaining
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <Clock className="h-8 w-8 text-amber-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-amber-600">{daysRemaining}</div>
                  <div className="text-xs text-amber-600">days left</div>
                </div>
              </div>
              {daysRemaining <= 7 && (
                <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    Your founding member access expires soon. Subscribe now to continue enjoying Pro features!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Current Status Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className={`h-6 w-6 ${isPro ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                Current Plan: {profile?.subscription_type?.charAt(0).toUpperCase() + profile?.subscription_type?.slice(1) || 'Free'}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="text-2xl font-bold text-primary">{loyaltyPoints}</div>
                <div className="text-sm text-muted-foreground">Loyalty Points</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{discountPercentage}%</div>
                <div className="text-sm text-muted-foreground">Current Discount</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                <div className="text-lg font-bold text-purple-600">
                  {profile?.referral_code || `REF${user?.id?.slice(0, 6).toUpperCase() || 'DEMO'}`}
                </div>
                <div className="text-sm text-muted-foreground">Your Referral Code</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AdMob Integration for Free Subscription */}
        <div className="mb-8">
          <AdMobIntegration />
        </div>

        {/* Mobile App Download */}
        <Card className="mb-8 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-primary" />
              📱 Mobile App - Coming Soon!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg bg-card">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2">Android App</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Native Android app with offline tender access & push notifications
                </p>
                <Button disabled className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Google Play Store
                </Button>
              </div>
              <div className="text-center p-4 border rounded-lg bg-card">
                <div className="text-3xl mb-2">🍎</div>
                <h3 className="font-semibold mb-2">iOS App</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Native iOS app with seamless tender management & notifications
                </p>
                <Button disabled className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  App Store
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-primary">
                <strong>🇰🇪 Built for Kenya:</strong> Optimized for local networks, works offline, 
                supports M-Pesa payments, and designed for Kenyan suppliers and contractors.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Social Media & Rewards */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Earn Loyalty Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Twitter Follow */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Twitter className="h-8 w-8 text-blue-500" />
                  <div>
                    <h3 className="font-semibold">Follow us on Twitter</h3>
                    <p className="text-sm text-muted-foreground">
                      Get 50 points + stay updated with latest tenders
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://x.com/Supply_ChainKe', '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Follow
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => followTwitterMutation.mutate()}
                    disabled={followTwitterMutation.isPending || profile?.twitter_followed}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {profile?.twitter_followed ? 'Done' : 'Confirm'}
                  </Button>
                </div>
              </div>

              {/* Referral Program */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Refer Friends</h3>
                    <p className="text-sm text-muted-foreground">
                      100 points per successful referral
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReferralCode}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {copiedReferral ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </div>

            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">
                Loyalty Rewards System
              </h4>
              <ul className="text-sm text-amber-700 dark:text-amber-300 mt-2 space-y-1">
                <li>• Every 100 points = 5% discount on subscription</li>
                <li>• 10 successful referrals = Monthly discount eligibility</li>
                <li>• Maximum discount: 50% off your subscription</li>
                <li>• Points never expire!</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Plans */}
        {!isPro && !isFoundingMember && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-muted">
              <CardHeader>
                <CardTitle>Free Plan</CardTitle>
                <div className="text-2xl font-bold">KSh 0<span className="text-lg font-normal">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Up to 10 saved tenders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Basic tender alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Browse all tenders
                  </li>
                </ul>
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
              </div>
              <CardHeader>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Pro Plan
                    <span className="text-sm font-normal text-muted-foreground">For serious contractors</span>
                  </CardTitle>
                  <div className="text-2xl font-bold mt-2">
                    KSh {discountPercentage > 0 ? (500 * (1 - discountPercentage / 100)).toFixed(0) : 500}
                    <span className="text-lg font-normal">/month</span>
                  </div>
                  {discountPercentage > 0 && (
                    <div className="text-sm text-green-600">
                      {discountPercentage}% loyalty discount applied!
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Unlimited saved tenders
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    AI-powered analysis
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Consortium features
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Smart matching alerts
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Service provider marketplace
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                    Priority support
                  </li>
                </ul>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe('pro')}
                    disabled={paymentLoading}
                  >
                    {paymentLoading ? 'Redirecting...' : 'Subscribe with M-Pesa / Card'}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment via Paystack • M-Pesa, Cards, Bank Transfer
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isPro && !isFoundingMember && (
          <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-900/10">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2">
                  You're a Pro Member!
                </h2>
                <p className="text-green-700 dark:text-green-300">
                  Enjoy unlimited access to all TenderAlert features including AI analysis, 
                  consortium formation, and the service provider marketplace.
                </p>
                {profile?.subscription_end_date && (
                  <p className="text-sm text-green-600 mt-2">
                    Renews on: {new Date(profile.subscription_end_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
