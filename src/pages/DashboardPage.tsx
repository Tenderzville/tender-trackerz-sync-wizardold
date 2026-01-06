import { useState } from 'react';
import { Link } from 'wouter';
import { useTenders } from '@/hooks/useTenders';
import { useSavedTenders, useSaveTender, useUnsaveTender } from '@/hooks/useTenders';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Bookmark, 
  TrendingUp, 
  Clock, 
  MapPin,
  Building2,
  ArrowRight,
  Bell,
  Users
} from 'lucide-react';
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: tenders, isLoading } = useTenders({ status: 'active' });
  const { data: savedTenders } = useSavedTenders(user?.id);

  const recentTenders = tenders?.slice(0, 5) ?? [];
  const totalTenders = tenders?.length ?? 0;
  const savedCount = savedTenders?.length ?? 0;
  const urgentTenders = tenders?.filter(t => getDaysRemaining(t.deadline) <= 7).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening with tenders today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalTenders}</p>
                <p className="text-xs text-muted-foreground">Active Tenders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bookmark className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{savedCount}</p>
                <p className="text-xs text-muted-foreground">Saved Tenders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <Clock className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{urgentTenders}</p>
                <p className="text-xs text-muted-foreground">Closing Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">-</p>
                <p className="text-xs text-muted-foreground">Match Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tenders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Tenders</CardTitle>
          <Link href="/tenders">
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading tenders...</div>
          ) : recentTenders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tenders available. Check back later!
            </div>
          ) : (
            <div className="space-y-4">
              {recentTenders.map((tender) => {
                const daysRemaining = getDaysRemaining(tender.deadline);
                return (
                  <div
                    key={tender.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium text-foreground line-clamp-1">
                          {tender.title}
                        </h3>
                        <Badge variant={daysRemaining <= 7 ? 'destructive' : 'secondary'}>
                          {daysRemaining} days
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {tender.organization}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {tender.location}
                        </span>
                      </div>
                      {tender.budget_estimate && (
                        <p className="mt-2 text-sm font-medium text-primary">
                          Est. {formatCurrency(tender.budget_estimate)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/tenders">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Browse Tenders</h3>
                  <p className="text-sm text-muted-foreground">Find new opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/providers">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Find Partners</h3>
                  <p className="text-sm text-muted-foreground">Connect with providers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/smart-matches">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Smart Matches</h3>
                  <p className="text-sm text-muted-foreground">AI-powered recommendations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Disclaimer */}
      <Card className="border-warning">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            <strong>⚠️ Important Disclaimer:</strong> All tender information, win probability calculations, 
            and price estimations are provided for informational purposes only. These calculations may 
            contain errors due to inflation adjustments, incomplete data, or market changes. Always 
            conduct your own due diligence before making business decisions. TenderKenya is not 
            responsible for any decisions made based on this information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
