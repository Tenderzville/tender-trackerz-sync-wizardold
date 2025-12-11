import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Award,
  FileText,
  Clock,
  DollarSign
} from "lucide-react";

export default function Analytics() {
  const { data: tenders } = useQuery({
    queryKey: ["tenders-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: savedTenders } = useQuery({
    queryKey: ["saved-tenders-analytics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_tenders")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: tenderAnalytics } = useQuery({
    queryKey: ["tender-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tender_analytics")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate real analytics from data
  const totalTenders = tenders?.length || 0;
  const activeTenders = tenders?.filter(t => t.status === "active").length || 0;
  const savedCount = savedTenders?.length || 0;
  const totalViews = tenderAnalytics?.reduce((sum, t) => sum + (t.views_count || 0), 0) || 0;
  const totalBudget = tenders?.reduce((sum, t) => sum + (t.budget_estimate || 0), 0) || 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Category breakdown
  const categoryBreakdown = tenders?.reduce((acc, tender) => {
    const cat = tender.category || "Other";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const categories = Object.entries(categoryBreakdown).map(([category, count]) => ({
    category,
    count: count as number,
    percentage: totalTenders > 0 ? Math.round(((count as number) / totalTenders) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <section className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold">Analytics</h1>
                <p className="text-muted-foreground">
                  Track your tender performance and market insights
                </p>
              </div>
            </div>
            
            <Select defaultValue="6months">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last month</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
                <SelectItem value="6months">Last 6 months</SelectItem>
                <SelectItem value="1year">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>

        {/* Overview Metrics */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Performance Overview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <Badge variant="secondary" className="text-xs">Total</Badge>
                </div>
                <p className="text-2xl font-bold">{totalTenders}</p>
                <p className="text-sm text-muted-foreground">Total Tenders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Award className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <p className="text-2xl font-bold">{activeTenders}</p>
                <p className="text-sm text-muted-foreground">Active Tenders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <Badge variant="secondary" className="text-xs">Saved</Badge>
                </div>
                <p className="text-2xl font-bold">{savedCount}</p>
                <p className="text-sm text-muted-foreground">Saved Tenders</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <DollarSign className="h-5 w-5 text-purple-500" />
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Value
                  </Badge>
                </div>
                <p className="text-lg font-bold">{formatCurrency(totalBudget)}</p>
                <p className="text-sm text-muted-foreground">Total Budget Value</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {categories.length > 0 ? (
                <div className="space-y-4">
                  {categories.map((cat, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{cat.category}</span>
                        <span className="text-sm font-semibold">{cat.count} tenders</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${cat.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No tender data available yet
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Platform Stats */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Platform Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{totalViews}</p>
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold">{savedCount}</p>
                  <p className="text-sm text-muted-foreground">Saved Tenders</p>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{activeTenders}</p>
                  <p className="text-sm text-muted-foreground">Active Opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
