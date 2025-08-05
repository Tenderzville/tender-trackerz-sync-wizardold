import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from "@/components/PayPalButton";
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
  Download
} from "lucide-react";

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedReferral, setCopiedReferral] = useState(false);

  const { data: loyaltyData } = useQuery({
    queryKey: ["/api/user/loyalty"],
    enabled: !!user,
  });

  const followTwitterMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/social/follow-twitter", { method: "POST" });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Twitter Follow Confirmed!",
        description: `You earned 50 loyalty points! Follow us: ${data.twitterUrl || ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/loyalty"] });
    },
  });

  const copyReferralCode = () => {
    const referralCode = "DEMO123"; // Replace with actual data
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopiedReferral(true);
      toast({
        title: "Referral Code Copied!",
        description: "Share this code with friends to earn 100 points per successful referral!",
      });
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const isEarlyUser = false; // loyaltyData?.isEarlyUser;
  const isPro = false; // loyaltyData?.subscriptionType === 'pro';
  const loyaltyPoints = 0; // loyaltyData?.loyaltyPoints || 0;
  const discountPercentage = 0; // loyaltyData?.discountPercentage || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Subscription & Rewards</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Manage your subscription and earn rewards for engaging with TenderAlert
          </p>
        </div>

        {/* Current Status Card */}
        <Card className="mb-8 border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Crown className={`h-6 w-6 ${isPro ? 'text-yellow-500' : 'text-gray-400'}`} />
                Current Plan: {isPro ? 'Pro' : 'Free'}
              </CardTitle>
              {isEarlyUser && (
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <Gift className="h-4 w-4 mr-1" />
                  Early User - Year 1 FREE!
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{loyaltyPoints}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Loyalty Points</div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{discountPercentage}%</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Current Discount</div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {"DEMO123"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">Your Referral Code</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AdMob Integration for Free Subscription */}
        <div className="mb-8">
          <AdMobIntegration />
        </div>

        {/* Mobile App Download */}
        <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6 text-blue-600" />
              📱 Mobile App - Coming Soon!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center p-4 border rounded-lg bg-white dark:bg-slate-800">
                <div className="text-3xl mb-2">🤖</div>
                <h3 className="font-semibold mb-2">Android App</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Native Android app with offline tender access & push notifications
                </p>
                <Button disabled className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Google Play Store
                </Button>
              </div>
              <div className="text-center p-4 border rounded-lg bg-white dark:bg-slate-800">
                <div className="text-3xl mb-2">🍎</div>
                <h3 className="font-semibold mb-2">iOS App</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                  Native iOS app with seamless tender management & notifications
                </p>
                <Button disabled className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  App Store
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
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
                    <p className="text-sm text-slate-600 dark:text-slate-300">
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
                    disabled={followTwitterMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                </div>
              </div>

              {/* Referral Program */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-500" />
                  <div>
                    <h3 className="font-semibold">Refer Friends</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      100 points per successful referral
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyReferralCode}
                  disabled={false}
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
        {!isPro && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-slate-200 dark:border-slate-700">
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
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Pro Plan</CardTitle>
                    <div className="text-2xl font-bold">
                      KSh {discountPercentage > 0 ? (500 * (1 - discountPercentage / 100)).toFixed(0) : 500}
                      <span className="text-lg font-normal">/month</span>
                    </div>
                    {discountPercentage > 0 && (
                      <div className="text-sm text-green-600">
                        {discountPercentage}% loyalty discount applied!
                      </div>
                    )}
                  </div>
                  <Badge className="bg-primary text-white">Most Popular</Badge>
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
                    Social media integration
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
                
                {isEarlyUser ? (
                  <Button className="w-full" disabled>
                    <Gift className="h-4 w-4 mr-2" />
                    Free for Early Users!
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <PayPalButton
                      amount={discountPercentage > 0 ? (500 * (1 - discountPercentage / 100)).toFixed(2) : "500.00"}
                      currency="USD"
                      intent="CAPTURE"
                    />
                    <p className="text-xs text-center text-slate-600 dark:text-slate-300">
                      Secure payment via PayPal • Cancel anytime
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {isPro && (
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
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}