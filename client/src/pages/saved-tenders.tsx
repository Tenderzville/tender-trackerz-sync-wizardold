import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TenderCard } from "@/components/tender/tender-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, FileText, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

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
}

interface SavedTenderData {
  id: number;
  tender_id: number;
  tender: TenderData;
}

export default function SavedTenders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: savedTenders, isLoading } = useQuery({
    queryKey: ["saved-tenders"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("saved_tenders")
        .select(`
          id,
          tender_id,
          tenders (
            id, title, description, organization, category, location, 
            deadline, budget_estimate, status, created_at, source_url
          )
        `)
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      return (data || []).map(item => ({
        id: item.id,
        tender_id: item.tender_id,
        tender: item.tenders ? {
          id: (item.tenders as any).id,
          title: (item.tenders as any).title,
          description: (item.tenders as any).description,
          organization: (item.tenders as any).organization,
          category: (item.tenders as any).category,
          location: (item.tenders as any).location,
          deadline: (item.tenders as any).deadline,
          budgetEstimate: (item.tenders as any).budget_estimate,
          status: (item.tenders as any).status,
          createdAt: (item.tenders as any).created_at,
          sourceUrl: (item.tenders as any).source_url,
        } : null,
      })).filter(item => item.tender) as SavedTenderData[];
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async (tenderId: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("saved_tenders")
        .delete()
        .eq("tender_id", tenderId)
        .eq("user_id", user.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-tenders"] });
      toast({
        title: "Tender removed",
        description: "Tender has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove tender from saved list.",
        variant: "destructive",
      });
    },
  });

  const handleUnsave = (tenderId: number) => {
    unsaveMutation.mutate(tenderId);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Heart className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl lg:text-3xl font-bold">Saved Tenders</h1>
          </div>
          <p className="text-muted-foreground">
            Your bookmarked tender opportunities
          </p>
        </section>

        {/* Content */}
        <section>
          {isLoading ? (
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
          ) : savedTenders && savedTenders.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-muted-foreground">
                  {savedTenders.length} saved {savedTenders.length === 1 ? 'tender' : 'tenders'}
                </span>
              </div>
              
              {savedTenders.map((savedTender) => (
                <div key={savedTender.id} className="relative">
                  <TenderCard 
                    tender={savedTender.tender} 
                    showSaveButton={false}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-4 right-4 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => handleUnsave(savedTender.tender_id)}
                    disabled={unsaveMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No saved tenders</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't saved any tenders yet. Start browsing to find opportunities that interest you.
                </p>
                <Button asChild>
                  <Link href="/browse">
                    <FileText className="mr-2 h-4 w-4" />
                    Browse Tenders
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
