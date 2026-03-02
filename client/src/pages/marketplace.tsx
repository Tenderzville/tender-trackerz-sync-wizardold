import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Megaphone, Star, CreditCard, Store, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

interface AdWithProvider {
  id: number;
  title: string;
  description: string | null;
  ad_type: string;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  payment_status: string;
  amount: number;
  provider: {
    id: number;
    name: string;
    specialization: string;
    rating: number | null;
    experience: number | null;
    email: string;
    phone: string | null;
    certifications: string[] | null;
  };
}

export default function Marketplace() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [payingAdId, setPayingAdId] = useState<number | null>(null);

  // Fetch active ads with provider info
  const { data: ads, isLoading } = useQuery({
    queryKey: ["marketplace-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_provider_ads")
        .select("*, service_providers(*)")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((ad: any) => ({
        id: ad.id,
        title: ad.title,
        description: ad.description,
        ad_type: ad.ad_type,
        is_active: ad.is_active,
        starts_at: ad.starts_at,
        expires_at: ad.expires_at,
        payment_status: ad.payment_status,
        amount: ad.amount,
        provider: ad.service_providers,
      })) as AdWithProvider[];
    },
  });

  // Check if current user has a provider profile
  const { data: myProvider } = useQuery({
    queryKey: ["my-provider-for-ads"],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch user's own ads (active or not)
  const { data: myAds } = useQuery({
    queryKey: ["my-ads"],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("service_provider_ads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const createAdMutation = useMutation({
    mutationFn: async () => {
      if (!user || !myProvider) throw new Error("Provider profile required");

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase.from("service_provider_ads").insert({
        provider_id: myProvider.id,
        user_id: user.id,
        title: adTitle,
        description: adDescription || null,
        amount: 1000,
        currency: "KES",
        payment_status: "pending",
        is_active: false,
        starts_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-ads"] });
      setCreateDialogOpen(false);
      setAdTitle("");
      setAdDescription("");
      toast({
        title: "Ad Created",
        description: "Your ad has been created. Pay KSh 1,000 via Paystack, then an admin will activate it.",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Pay for an ad via Paystack
  const handlePayForAd = async (adId: number, amount: number) => {
    if (!user?.email || !user?.id) {
      toast({ title: "Error", description: "Please log in first", variant: "destructive" });
      return;
    }
    setPayingAdId(adId);
    try {
      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize_ad_payment',
          email: user.email,
          user_id: user.id,
          ad_id: adId,
          amount: amount * 100, // kobo
          callback_url: `${window.location.origin}/marketplace`,
        },
      });

      if (error) throw new Error(error.message || 'Payment initialization failed');
      if (!data?.success) throw new Error(data?.error || 'Payment initialization failed');
      if (!data?.data?.authorization_url) throw new Error('No payment redirect URL');

      toast({ title: "Redirecting to Paystack...", description: "Complete your KSh 1,000 payment to proceed." });
      await new Promise(r => setTimeout(r, 500));
      window.location.href = data.data.authorization_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      toast({ title: "Payment Error", description: message, variant: "destructive" });
    } finally {
      setPayingAdId(null);
    }
  };

  const filteredAds = ads?.filter((ad) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      ad.title.toLowerCase().includes(term) ||
      ad.provider?.name?.toLowerCase().includes(term) ||
      ad.provider?.specialization?.toLowerCase().includes(term)
    );
  }) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
            <Megaphone className="h-7 w-7 text-primary" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">{t('market.title')}</h1>
              <p className="text-muted-foreground">{t('market.subtitle')}</p>
            </div>
          </div>
          {myProvider && (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <CreditCard className="h-4 w-4 mr-2" />
              {t('market.advertise')}
            </Button>
          )}
        </div>

        {/* My Ads Section */}
        {myAds && myAds.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-4">My Advertisements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myAds.map((ad: any) => (
                <Card key={ad.id} className="border-dashed">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium truncate">{ad.title}</h3>
                      <Badge variant={ad.is_active ? "default" : ad.payment_status === "paid" ? "secondary" : "outline"}>
                        {ad.is_active ? t('market.active') : ad.payment_status === "paid" ? "Awaiting Approval" : t('market.pending')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">KSh {ad.amount}/month</p>
                    {ad.payment_status === "pending" && (
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        variant="outline"
                        disabled={payingAdId === ad.id}
                        onClick={() => handlePayForAd(ad.id, ad.amount)}
                      >
                        {payingAdId === ad.id ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...</>
                        ) : (
                          <><CreditCard className="h-3 w-3 mr-1" /> Pay KSh 1,000 via Paystack</>
                        )}
                      </Button>
                    )}
                    {ad.payment_status === "paid" && !ad.is_active && (
                      <p className="text-xs text-muted-foreground mt-2">
                        ✅ Payment received. Admin will review and activate your ad.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={`${t('common.search')} providers...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12"
          />
        </div>

        {/* Featured Ads */}
        <h2 className="text-xl font-semibold mb-6">{t('market.featured')}</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6"><div className="h-24 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <Card key={ad.id} className="hover:border-primary transition-colors border-2">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary/10 text-primary">
                      <Megaphone className="h-3 w-3 mr-1" /> Sponsored
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mt-2">{ad.title}</h3>
                  {ad.provider && (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">{ad.provider.name}</p>
                      <Badge variant="secondary" className="mt-2">{ad.provider.specialization}</Badge>
                      {ad.provider.rating && ad.provider.rating > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{ad.provider.rating}</span>
                        </div>
                      )}
                    </>
                  )}
                  {ad.description && (
                    <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{ad.description}</p>
                  )}
                  {ad.provider?.certifications && ad.provider.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {ad.provider.certifications.slice(0, 3).map((cert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{cert}</Badge>
                      ))}
                    </div>
                  )}
                  <Button className="w-full mt-4" variant="outline">
                    {t('common.contact')} {ad.provider?.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('common.noResults')}</h3>
              <p className="text-muted-foreground">No sponsored providers yet. Be the first to advertise!</p>
              {myProvider && (
                <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
                  <Megaphone className="h-4 w-4 mr-2" /> {t('market.advertise')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create Ad Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Advertisement</DialogTitle>
              <DialogDescription>Advertise your services for KSh 1,000/month. After payment, an admin will review and activate your ad.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Ad Title</Label>
                <Input value={adTitle} onChange={(e) => setAdTitle(e.target.value)} placeholder="e.g., Expert Tender Document Writer" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={adDescription} onChange={(e) => setAdDescription(e.target.value)} placeholder="Describe your services..." rows={3} />
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Monthly Fee</span>
                    <span className="text-lg font-bold text-primary">KSh 1,000</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">After payment, admin reviews and activates your ad for 30 days.</p>
                </CardContent>
              </Card>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => createAdMutation.mutate()} disabled={!adTitle || createAdMutation.isPending}>
                {createAdMutation.isPending ? t('common.loading') : "Create Ad"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
