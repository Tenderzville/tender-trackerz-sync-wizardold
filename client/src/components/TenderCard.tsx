import { formatDistance } from "date-fns";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Calendar, MapPin, Building, DollarSign, Clock, BookmarkIcon, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckSavedTender, useSaveTender } from "@/hooks/use-tenders";
import type { Database } from '../../src/integrations/supabase/types';

type Tender = Database['public']['Tables']['tenders']['Row'] & {
  ai_analyses?: Database['public']['Tables']['ai_analyses']['Row'][];
};

interface TenderCardProps {
  tender: Tender;
  className?: string;
}

export function TenderCard({ tender, className }: TenderCardProps) {
  const isSaved = useCheckSavedTender(tender.id);
  const saveTenderMutation = useSaveTender();
  
  const aiAnalysis = tender.ai_analyses?.[0];

  const handleSave = () => {
    saveTenderMutation.mutate({
      tenderId: tender.id,
      save: !isSaved
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "closed":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    const hash = category.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const colors = [
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "TBD";
    return `KSh ${amount.toLocaleString()}`;
  };

  const getTimeUntilDeadline = () => {
    const deadline = new Date(tender.deadline);
    const now = new Date();
    
    if (deadline < now) {
      return "Expired";
    }
    
    return formatDistance(deadline, now, { addSuffix: true });
  };

  const deadlineDate = new Date(tender.deadline);
  const isUrgent = deadlineDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <Card className={cn("overflow-hidden hover:shadow-lg transition-shadow duration-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getCategoryColor(tender.category)}>
                {tender.category}
              </Badge>
              <Badge className={getStatusColor(tender.status || 'active')}>
                {tender.status || 'Active'}
              </Badge>
              {isUrgent && (
                <Badge variant="destructive">
                  Urgent
                </Badge>
              )}
            </div>
            <CardTitle className="text-lg leading-tight line-clamp-2">
              {tender.title}
            </CardTitle>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={saveTenderMutation.isPending}
            className="shrink-0"
          >
            <BookmarkIcon 
              className={cn(
                "h-4 w-4",
                isSaved ? "fill-primary text-primary" : "text-muted-foreground"
              )} 
            />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Analysis Section */}
        {aiAnalysis && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Win Probability</span>
              <span className="font-medium text-primary">{aiAnalysis.win_probability}%</span>
            </div>
            <Progress value={aiAnalysis.win_probability || 0} className="h-2" />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Value:</span>
                <span className="font-medium">
                  {tender.budget_estimate ? 
                    `KSh ${tender.budget_estimate.toLocaleString()}` : 
                    aiAnalysis.estimated_value_min ?
                    `KSh ${aiAnalysis.estimated_value_min.toLocaleString()}` : 'TBD'
                  }
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Confidence:</span>
                <span className="font-medium">{aiAnalysis.confidence_score}%</span>
              </div>
            </div>
          </div>
        )}

        {/* Tender Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building className="h-4 w-4" />
            <span>{tender.organization}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{tender.location}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium">{formatCurrency(tender.budget_estimate)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className={cn(
              "font-medium",
              isUrgent ? "text-destructive" : "text-muted-foreground"
            )}>
              {getTimeUntilDeadline()}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {tender.description}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1">
            View Details
          </Button>
          <Button size="sm" variant="outline">
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}