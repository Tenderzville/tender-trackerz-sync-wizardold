import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TenderCard } from "@/components/tender/tender-card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "wouter";
import { 
  FileText, 
  Heart, 
  Users, 
  Trophy, 
  Plus,
  Brain,
  ArrowRight,
  RefreshCw,
  Settings,
  ShoppingCart,
  Briefcase,
  Target,
  Megaphone
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

interface TenderData {
  id: number;
  title: string;
  description: string;
  organization: string;
  category: string;
  location: string;
  deadline: string;
  budgetEstimate?: number | null;
  status?: string | null;
  createdAt?: string | null;
  sourceUrl?: string | null;
  tenderNumber?: string | null;
  scrapedFrom?: string | null;
}

/** PWA update banner */
function PWAUpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg?.waiting) setUpdateAvailable(true);
      reg?.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    }).catch(() => {});
  }, []);

  if (!updateAvailable) return null;

  return (
    <Card className="mb-6 border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-sm">App Update Available</h3>
              <p className="text-xs text-blue-700 dark:text-blue-300">A newer version of TenderAlert is ready.</p>
            </div>
          </div>
          <Button size="sm" onClick={() => window.location.reload()}>Update Now</Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const businessType = profile?.business_type; // 'buyer' | 'supplier' | null

  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ["tenders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        organization: t.organization,
        category: t.category,
        location: t.location,
        deadline: t.deadline,
        budgetEstimate: t.budget_estimate,
        status: t.status,
        createdAt: t.created_at,
        sourceUrl: t.source_url,
        tenderNumber: t.tender_number,
        scrapedFrom: t.scraped_from,
      })) as TenderData[];
    },
  });

  const { data: savedTenders } = useQuery({
    queryKey: ["saved-tenders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase.from("saved_tenders").select("*").eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: consortiums } = useQuery({
    queryKey: ["consortiums"],
    queryFn: async () => {
      const { data, error } = await supabase.from("consortiums").select("*").eq("status", "active");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: preferences } = useQuery({
    queryKey: ['user-preferences-check', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_preferences')
        .select('sectors, counties, keywords')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const hasPreferences = preferences && (
    (preferences.sectors?.length > 0) || 
    (preferences.counties?.length > 0) || 
    (preferences.keywords?.length > 0)
  );

  const stats = {
    activeTenders: tenders?.length || 0,
    savedTenders: savedTenders?.length || 0,
    consortiums: consortiums?.length || 0,
    winRate: 68,
  };

  const recentTenders = tenders?.slice(0, 3) || [];

  // Role-aware CTAs
  const isBuyer = businessType === 'buyer';
  const isSupplier = businessType === 'supplier' || !businessType; // default to supplier

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">

        {/* Setup Preferences Banner */}
        {!hasPreferences && (
          <Card className="mb-6 border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Settings className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{t('dash.setupPreferences')}</h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    Configure your sectors, counties, and keywords to unlock personalized Smart Matches.
                  </p>
                </div>
                <Button size="sm" asChild className="flex-shrink-0">
                  <Link href="/settings">{t('dash.configureNow')}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <PWAUpdateBanner />

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">{t('auth.welcome')}</h1>
              <p className="text-muted-foreground">{t('auth.subtitle')}</p>
              {businessType && (
                <Badge variant="outline" className="mt-2 capitalize">
                  {businessType === 'buyer' ? '🛒' : '📦'} {businessType}
                </Badge>
              )}
            </div>
            
            {/* Role-aware CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              {isBuyer ? (
                <>
                  <Button className="flex items-center space-x-2" asChild>
                    <Link href="/rfq-system">
                      <ShoppingCart className="h-4 w-4" />
                      <span>{t('dash.postRfq')}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2" asChild>
                    <Link href="/service-providers">
                      <Briefcase className="h-4 w-4" />
                      <span>{t('dash.findSuppliers')}</span>
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button className="flex items-center space-x-2" asChild>
                    <Link href="/smart-matches">
                      <Target className="h-4 w-4" />
                      <span>{t('dash.smartMatches')}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex items-center space-x-2" asChild>
                    <Link href="/consortiums">
                      <Users className="h-4 w-4" />
                      <span>{t('dash.joinConsortium')}</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <Badge variant="secondary" className="text-xs">+12%</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.activeTenders}</p>
                <p className="text-sm text-muted-foreground">{t('dash.activeTenders')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <Badge variant="secondary" className="text-xs">{stats.savedTenders}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.savedTenders}</p>
                <p className="text-sm text-muted-foreground">{t('dash.savedTenders')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="text-xs">{stats.consortiums}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.consortiums}</p>
                <p className="text-sm text-muted-foreground">{t('dash.consortiums')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <Badge variant="secondary" className="text-xs">+5%</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-sm text-muted-foreground">{t('dash.winRate')}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Role-aware quick actions */}
        {isBuyer && (
          <section className="mb-8">
            <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-200 dark:border-emerald-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Megaphone className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">Buyer Hub</h3>
                    <p className="text-emerald-700 dark:text-emerald-300 mb-4">
                      Post RFQs, find verified suppliers, and manage procurement effortlessly.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" asChild>
                        <Link href="/rfq-system">{t('dash.postRfq')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                      <Button variant="outline" size="sm" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50" asChild>
                        <Link href="/marketplace">{t('dash.findSuppliers')} <ArrowRight className="ml-2 h-4 w-4" /></Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* AI Insights Banner - for suppliers */}
        {isSupplier && (
          <section className="mb-8">
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">{t('dash.aiInsights')}</h3>
                    <p className="text-purple-700 dark:text-purple-300 mb-4">{t('dash.aiDescription')}</p>
                    <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50" asChild>
                      <Link href="/ai-analysis">
                        View Analysis <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Recent Tenders */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">{t('dash.latestTenders')}</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse">
                {t('dash.viewAll')} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {tendersLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-4"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : recentTenders.length > 0 ? (
            <div className="space-y-4">
              {recentTenders.map((tender) => (
                <TenderCard key={tender.id} tender={tender} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No tenders available yet.</p>
                <Button className="mt-4" asChild>
                  <Link href="/browse">{t('dash.browseTenders')}</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
