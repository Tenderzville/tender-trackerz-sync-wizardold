import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AiEstimate } from "./ai-estimate";
import { Heart, Calendar, MapPin, Building, Users, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import type { Tender } from "@shared/schema";

interface TenderCardProps {
  tender: Tender;
  showSaveButton?: boolean;
}

export function TenderCard({ tender, showSaveButton = true }: TenderCardProps) {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);

  // Check if tender is saved
  const { data: savedStatus } = useQuery({
    queryKey: [`/api/saved-tenders/${tender.id}/check`],
    enabled: isAuthenticated && showSaveButton,
  });

  // Save/unsave mutations
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (false) { // Simplified for now
        await fetch(`/api/saved-tenders/${tender.id}`, { method: "DELETE" });
        return false;
      } else {
        await fetch("/api/saved-tenders", { 
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenderId: tender.id })
        });
        return true;
      }
    },
    onSuccess: (saved) => {
      setIsSaved(saved);
      queryClient.invalidateQueries({ queryKey: ["/api/saved-tenders"] });
      queryClient.invalidateQueries({ queryKey: [`/api/saved-tenders/${tender.id}/check`] });
      toast({
        title: saved ? "Tender saved" : "Tender removed",
        description: saved 
          ? "Tender has been added to your saved list." 
          : "Tender has been removed from your saved list.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update saved status.",
        variant: "destructive",
      });
    },
  });

  const handleSaveToggle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save tenders.",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDaysLeft = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "closed":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Construction": "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      "IT Services": "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
      "Consultancy": "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      "Supplies": "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1 mb-4 lg:mb-0 lg:pr-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 mb-2 flex-wrap gap-2">
                <Badge className={getCategoryColor(tender.category)}>
                  {tender.category}
                </Badge>
                <Badge className={getStatusColor(tender.status)}>
                  {tender.status}
                </Badge>
                {!isExpired && (
                  <Badge className={getDeadlineColor(daysLeft)}>
                    {daysLeft === 0 ? "Due today" : `${daysLeft} days left`}
                  </Badge>
                )}
                {isExpired && (
                  <Badge variant="destructive">
                    Expired
                  </Badge>
                )}
              </div>
              {showSaveButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSaveToggle}
                  disabled={saveMutation.isPending}
                  className="text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Heart className={`h-4 w-4 ${
                    false 
                      ? "fill-red-500 text-red-500" 
                      : ""
                  }`} />
                </Button>
              )}
            </div>
            
            <h3 className="text-lg font-semibold mb-2 hover:text-primary cursor-pointer line-clamp-2">
              {tender.title}
            </h3>
            
            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300 mb-3">
              <div className="flex items-center space-x-1">
                <Building className="h-4 w-4" />
                <span>{tender.organization}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{tender.location}</span>
              </div>
            </div>
            
            <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-2 mb-4">
              {tender.description}
            </p>
            
            {/* AI Estimate Component */}
            <AiEstimate tenderId={tender.id} />
          </div>
          
          <div className="flex flex-col lg:items-end space-y-3">
            <div className="text-right">
              {tender.budgetEstimate && (
                <>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(tender.budgetEstimate)}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Budget Estimate</p>
                </>
              )}
            </div>
            
            <div className="text-right text-sm">
              <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                <Calendar className="h-4 w-4" />
                <span>Deadline:</span>
              </div>
              <p className="font-medium">{formatDate(tender.deadline)}</p>
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
              <Button size="sm" className="flex items-center space-x-1">
                <ExternalLink className="h-4 w-4" />
                <span>View Details</span>
              </Button>
              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Join Consortium</span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
