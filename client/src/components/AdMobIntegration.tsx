import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Play, 
  Gift, 
  Calendar,
  Coins,
  Trophy,
  Zap
} from "lucide-react";

interface AdWatchData {
  dailyAdsWatched: number;
  monthlyAdsWatched: number;
  freeSubscriptionDays: number;
  lastAdWatchDate: string;
  canWatchAd: boolean;
}

export function AdMobIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  const { data: adData, refetch } = useQuery<AdWatchData>({
    queryKey: ["/api/ads/status"],
    enabled: !!user,
  });

  const watchAdMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ads/watch", { method: "POST" });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Ad Completed! 🎉",
        description: `You earned ${data.pointsEarned} points! ${data.freeSubscriptionMessage || ''}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ads/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/loyalty"] });
      setIsWatchingAd(false);
    },
    onError: () => {
      toast({
        title: "Ad Watch Failed",
        description: "Unable to complete ad watch. Please try again.",
        variant: "destructive",
      });
      setIsWatchingAd(false);
    },
  });

  const dailyProgress = Math.min((adData?.dailyAdsWatched || 0) / 10, 1) * 100;
  const monthlyProgress = Math.min((adData?.monthlyAdsWatched || 0) / 300, 1) * 100;
  const canWatchAd = adData?.canWatchAd && !isWatchingAd;

  const simulateAdWatch = () => {
    setIsWatchingAd(true);
    
    // Simulate ad loading and watching
    setTimeout(() => {
      watchAdMutation.mutate();
    }, 3000); // 30 second ad simulation
  };

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-amber-600" />
            Earn Free Subscription with Ads
          </CardTitle>
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            🇰🇪 Kenya Feature
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Daily Ad Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Daily Ads ({adData?.dailyAdsWatched || 0}/10)</span>
            <span className="text-sm text-amber-600">+10 points each</span>
          </div>
          <Progress value={dailyProgress} className="h-3 bg-amber-100" />
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            Watch 10 ads daily to maximize your earnings
          </p>
        </div>

        {/* Monthly Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Monthly Progress ({adData?.monthlyAdsWatched || 0}/300)</span>
            <div className="flex items-center gap-1">
              <Gift className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600">Free Month!</span>
            </div>
          </div>
          <Progress value={monthlyProgress} className="h-3 bg-green-100" />
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
            300 ads monthly = Free Pro subscription for next month
          </p>
        </div>

        {/* Free Subscription Status */}
        {adData?.freeSubscriptionDays && adData.freeSubscriptionDays > 0 && (
          <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800 dark:text-green-200">
                Free Pro Subscription Active!
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              You have {adData.freeSubscriptionDays} free days remaining from watching ads
            </p>
          </div>
        )}

        {/* Ad Watch Button */}
        <div className="text-center space-y-4">
          {isWatchingAd ? (
            <div className="space-y-3">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto flex items-center justify-center">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Watching ad... Please wait 30 seconds
              </p>
            </div>
          ) : (
            <Button
              size="lg"
              onClick={simulateAdWatch}
              disabled={!canWatchAd || watchAdMutation.isPending}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3"
            >
              <Play className="h-5 w-5 mr-2" />
              {canWatchAd ? "Watch Ad (+10 Points)" : "Daily Limit Reached"}
            </Button>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <Zap className="h-6 w-6 text-blue-500 mx-auto mb-1" />
              <div className="text-sm font-semibold">Quick Rewards</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                10 points per ad
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border">
              <Calendar className="h-6 w-6 text-green-500 mx-auto mb-1" />
              <div className="text-sm font-semibold">Free Month</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">
                300 ads = Pro access
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
          <strong>How it works:</strong> Watch up to 10 ads daily (max 300/month). 
          Each ad gives you 10 loyalty points. Reach 300 monthly ads to unlock 
          a completely free Pro subscription for the next month! 🎯
        </div>
      </CardContent>
    </Card>
  );
}