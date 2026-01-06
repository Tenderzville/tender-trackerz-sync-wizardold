import { useSavedTenders, useUnsaveTender } from '@/hooks/useTenders';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bookmark,
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Clock,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils';

export default function SavedTendersPage() {
  const { user } = useAuth();
  const { data: savedTenders, isLoading } = useSavedTenders(user?.id);
  const unsaveTender = useUnsaveTender();

  const handleUnsave = (tenderId: number) => {
    if (!user) return;
    unsaveTender.mutate({ tenderId, userId: user.id });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Saved Tenders</h1>
        <p className="text-muted-foreground mt-1">
          Tenders you've bookmarked for later review.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading saved tenders...</div>
      ) : savedTenders?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No Saved Tenders</p>
            <p className="text-muted-foreground mt-1">
              Browse tenders and click the bookmark icon to save them here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {savedTenders?.map((saved: any) => {
            const tender = saved.tenders;
            if (!tender) return null;
            
            const daysRemaining = getDaysRemaining(tender.deadline);

            return (
              <Card key={saved.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {tender.title}
                        </h3>
                        <Badge 
                          variant={daysRemaining <= 7 ? 'destructive' : daysRemaining <= 14 ? 'warning' : 'secondary'}
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          {daysRemaining} days left
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {tender.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {tender.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tender.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {formatDate(tender.deadline)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <Badge variant="outline">{tender.category}</Badge>
                        {tender.budget_estimate && (
                          <Badge variant="default">
                            Est. {formatCurrency(tender.budget_estimate)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex lg:flex-col gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUnsave(tender.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      {tender.source_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={tender.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
