import { useQuery } from "@tanstack/react-query";
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
  ArrowRight
} from "lucide-react";

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

interface DashboardStats {
  activeTenders: number;
  savedTenders: number;
  consortiums: number;
  winRate: number;
}

export default function Dashboard() {
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
      })) as TenderData[];
    },
  });

  const { data: savedTenders } = useQuery({
    queryKey: ["saved-tenders"],
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

  const { data: consortiums } = useQuery({
    queryKey: ["consortiums"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("consortiums")
        .select("*")
        .eq("status", "active");
      
      if (error) throw error;
      return data || [];
    },
  });

  const stats: DashboardStats = {
    activeTenders: tenders?.length || 0,
    savedTenders: savedTenders?.length || 0,
    consortiums: consortiums?.length || 0,
    winRate: 68,
  };

  const recentTenders = tenders?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 lg:p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back!</h1>
              <p className="text-muted-foreground">Discover new tender opportunities and grow your business</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Alert</span>
              </Button>
              <Button variant="outline" className="flex items-center space-x-2" asChild>
                <Link href="/consortiums">
                  <Users className="h-4 w-4" />
                  <span>Join Consortium</span>
                </Link>
              </Button>
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
                <p className="text-sm text-muted-foreground">Active Tenders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <Badge variant="secondary" className="text-xs">{stats.savedTenders}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.savedTenders}</p>
                <p className="text-sm text-muted-foreground">Saved Tenders</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5 text-green-500" />
                  <Badge variant="secondary" className="text-xs">{stats.consortiums}</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.consortiums}</p>
                <p className="text-sm text-muted-foreground">Consortiums</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <Badge variant="secondary" className="text-xs">+5%</Badge>
                </div>
                <p className="text-2xl font-bold">{stats.winRate}%</p>
                <p className="text-sm text-muted-foreground">Win Rate</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* AI Insights Banner */}
        <section className="mb-8">
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-700">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">AI-Powered Tender Analysis</h3>
                  <p className="text-purple-700 dark:text-purple-300 mb-4">
                    Based on historical data, you have a 78% chance of winning construction tenders between KSh 5M - 15M
                  </p>
                  <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50" asChild>
                    <Link href="/ai-analysis">
                      View Detailed Analysis <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Recent Tenders */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Latest Tenders</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/browse">
                View All <ArrowRight className="ml-2 h-4 w-4" />
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
                  <Link href="/browse">Browse Tenders</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
