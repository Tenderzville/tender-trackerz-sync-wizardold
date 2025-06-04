import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DesktopSidebar } from "@/components/layout/desktop-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { TenderCard } from "@/components/tender/tender-card";
import { ServiceProviderCard } from "@/components/providers/service-provider-card";
import { 
  FileText, 
  Heart, 
  Users, 
  Trophy, 
  Plus,
  Brain,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import type { Tender, ServiceProvider } from "@shared/schema";

interface DashboardStats {
  activeTenders: number;
  savedTenders: number;
  consortiums: number;
  winRate: number;
}

export default function Dashboard() {
  const { data: tenders, isLoading: tendersLoading } = useQuery<Tender[]>({
    queryKey: ["/api/tenders"],
  });

  const { data: savedTenders } = useQuery<any[]>({
    queryKey: ["/api/saved-tenders"],
  });

  const { data: serviceProviders } = useQuery<ServiceProvider[]>({
    queryKey: ["/api/service-providers"],
  });

  const stats: DashboardStats = {
    activeTenders: tenders?.length || 0,
    savedTenders: savedTenders?.length || 0,
    consortiums: 3, // Mock for now
    winRate: 68, // Mock for now
  };

  const recentTenders = tenders?.slice(0, 3) || [];
  const featuredProviders = serviceProviders?.slice(0, 3) || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      <DesktopSidebar />
      
      <div className="flex-1 overflow-auto">
        <MobileHeader />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-slate-800 dark:to-slate-700 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div className="mb-6 lg:mb-0">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome back! 👋</h1>
                <p className="text-slate-600 dark:text-slate-300">Discover new tender opportunities and grow your business</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Alert</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Join Consortium</span>
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
                  <p className="text-sm text-slate-500 dark:text-slate-400">Active Tenders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <Badge variant="secondary" className="text-xs">{stats.savedTenders}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats.savedTenders}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Saved Tenders</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-5 w-5 text-green-500" />
                    <Badge variant="secondary" className="text-xs">{stats.consortiums}</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats.consortiums}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Consortiums</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <Badge variant="secondary" className="text-xs">+5%</Badge>
                  </div>
                  <p className="text-2xl font-bold">{stats.winRate}%</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Win Rate</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* AI Insights Banner */}
        <section className="p-6 lg:p-8 border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto">
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
                    <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                      View Detailed Analysis <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Recent Tenders */}
        <section className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Latest Tenders</h2>
              <Button variant="ghost" size="sm" asChild>
                <a href="/browse">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {tendersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
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
                  <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No tenders available yet.</p>
                  <Button className="mt-4" asChild>
                    <a href="/api/seed-data" onClick={() => window.location.reload()}>
                      Load Sample Data
                    </a>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Service Providers */}
        <section className="p-6 lg:p-8 bg-slate-50 dark:bg-slate-800/50">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Featured Service Providers</h2>
              <Button variant="ghost" size="sm" asChild>
                <a href="/service-providers">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>

            {featuredProviders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProviders.map((provider) => (
                  <ServiceProviderCard key={provider.id} provider={provider} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500 dark:text-slate-400">No service providers available yet.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <MobileBottomNav />
      </div>
    </div>
  );
}
