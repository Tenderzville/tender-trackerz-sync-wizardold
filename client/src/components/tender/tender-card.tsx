import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiEstimate } from "./ai-estimate";
import { TenderDetailsModal } from "./tender-details-modal";
import { Heart, Calendar, MapPin, Building, Users, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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
}

interface TenderCardProps {
  tender: TenderData;
  showSaveButton?: boolean;
}

/**
 * Build the best available source URL for a tender.
 * Priority: specific source_url > constructed URL from tender_number > generic portal
 */
function buildSourceUrl(tender: TenderData): string | null {
  const genericPortals = [
    'https://tenders.go.ke/',
    'https://tenders.go.ke',
    'https://egpkenya.go.ke',
    'https://www.mygov.go.ke',
    'https://ppra.go.ke',
  ];

  // If we have a specific (non-generic) source URL, use it
  if (tender.sourceUrl && !genericPortals.includes(tender.sourceUrl)) {
    return tender.sourceUrl;
  }

  // Construct a search URL using the tender number
  if (tender.tenderNumber) {
    return `https://tenders.go.ke/website/tender/search?keyword=${encodeURIComponent(tender.tenderNumber)}`;
  }

  // Fall back to generic portal
  return tender.sourceUrl || null;
}

export function TenderCard({ tender, showSaveButton = true }: TenderCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Check if tender is saved
  const { data: savedStatus } = useQuery({
    queryKey: ["saved-tender-check", tender.id],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { saved: false };
      
      const { data } = await supabase
        .from("saved_tenders")
        .select("id")
        .eq("tender_id", tender.id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      return { saved: !!data };
    },
    enabled: isAuthenticated && showSaveButton,
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      if (savedStatus?.saved) {
        await supabase.from("saved_tenders").delete()
          .eq("tender_id", tender.id).eq("user_id", user.id);
        return false;
      } else {
        await supabase.from("saved_tenders").insert({ tender_id: tender.id, user_id: user.id });
        return true;
      }
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["saved-tenders"] });
      queryClient.invalidateQueries({ queryKey: ["saved-tender-check", tender.id] });
      toast({
        title: saved ? "Tender saved" : "Tender removed",
        description: saved ? "Added to your saved list." : "Removed from your saved list.",
      });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update saved status.", variant: "destructive" });
    },
  });

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Please sign in to save tenders.", variant: "destructive" });
      return;
    }
    saveMutation.mutate();
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  const getDaysLeft = (deadline: string) => {
    const diffTime = new Date(deadline).getTime() - Date.now();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "closed": return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Construction": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "IT Services": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "ICT": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Consultancy": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Supply": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      "Healthcare": "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      "Education": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    };
    return colors[category] || "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  };

  const getDeadlineColor = (daysLeft: number) => {
    if (daysLeft <= 3) return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    if (daysLeft <= 7) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
  };

  const daysLeft = getDaysLeft(tender.deadline);
  const isExpired = daysLeft < 0;
  const sourceUrl = buildSourceUrl(tender);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 mb-4 lg:mb-0 lg:pr-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                <Badge className={getCategoryColor(tender.category)}>{tender.category}</Badge>
                <Badge className={getStatusColor(tender.status)}>{tender.status}</Badge>
                {!isExpired && (
                  <Badge className={getDeadlineColor(daysLeft)}>
                    {daysLeft === 0 ? "Due today" : `${daysLeft} days left`}
                  </Badge>
                )}
                {isExpired && <Badge variant="destructive">Expired</Badge>}
              </div>
              {showSaveButton && (
                <Button variant="ghost" size="sm" onClick={handleSaveToggle} disabled={saveMutation.isPending}
                  className="text-muted-foreground hover:text-red-500 transition-colors">
                  <Heart className={`h-4 w-4 ${savedStatus?.saved ? "fill-red-500 text-red-500" : ""}`} />
                </Button>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer line-clamp-2"
              onClick={() => setDetailsOpen(true)}>
              {tender.title}
            </h3>
            
            {tender.tenderNumber && (
              <p className="text-xs text-muted-foreground mb-2 font-mono">
                Ref: {tender.tenderNumber}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <Building className="h-4 w-4" />
                <span>{tender.organization}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{tender.location}</span>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{tender.description}</p>
            
            <AiEstimate tenderId={tender.id} />
          </div>
          
          <div className="flex flex-col lg:items-end space-y-3">
            <div className="text-right">
              {tender.budgetEstimate && (
                <>
                  <p className="text-2xl font-bold text-primary">{formatCurrency(tender.budgetEstimate)}</p>
                  <p className="text-sm text-muted-foreground">Budget Estimate</p>
                </>
              )}
            </div>
            
            <div className="text-right text-sm">
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Deadline:</span>
              </div>
              <p className="font-medium">{formatDate(tender.deadline)}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <Button size="sm" className="flex items-center space-x-1" onClick={() => setDetailsOpen(true)}>
                <ExternalLink className="h-4 w-4" />
                <span>View Details</span>
              </Button>

              {sourceUrl && (
                <Button asChild variant="outline" size="sm" className="flex items-center space-x-1">
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer nofollow"
                    aria-label={`View tender ${tender.tenderNumber || tender.title} on source portal`}>
                    <ExternalLink className="h-4 w-4" />
                    <span>Source</span>
                  </a>
                </Button>
              )}

              <Button variant="outline" size="sm" className="flex items-center space-x-1" asChild>
                <Link href="/consortiums">
                  <Users className="h-4 w-4" />
                  <span>Join Consortium</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
      
      <TenderDetailsModal tenderId={tender.id} open={detailsOpen} onOpenChange={setDetailsOpen} />
    </Card>
  );
}

// Need Link import for consortium button
import { Link } from 'wouter';
