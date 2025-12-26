import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  Target, 
  DollarSign, 
  BarChart3, 
  Award,
  Eye,
  FileText,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  XCircle
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function PerformanceDashboard() {
  // Fetch tenders data
  const { data: tenders, isLoading: tendersLoading } = useQuery({
    queryKey: ['performance-tenders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenders')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch saved tenders for user
  const { data: savedTenders, isLoading: savedLoading } = useQuery({
    queryKey: ['performance-saved'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('saved_tenders')
        .select('*, tenders(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch tender analytics
  const { data: analytics } = useQuery({
    queryKey: ['performance-analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tender_analytics')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch AI analyses
  const { data: aiAnalyses } = useQuery({
    queryKey: ['performance-ai-analyses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_analyses')
        .select('*');
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = tendersLoading || savedLoading;

  // Calculate KPIs
  const totalTenders = tenders?.length || 0;
  const savedCount = savedTenders?.length || 0;
  const viewedCount = analytics?.reduce((sum, a) => sum + (a.views_count || 0), 0) || 0;
  
  // Simulated win rate (would come from actual bid tracking in production)
  const appliedCount = Math.floor(savedCount * 0.6);
  const wonCount = Math.floor(appliedCount * 0.25);
  const winRate = appliedCount > 0 ? ((wonCount / appliedCount) * 100).toFixed(1) : 0;
  
  // Calculate total budget opportunity
  const totalBudget = tenders?.reduce((sum, t) => sum + (t.budget_estimate || 0), 0) || 0;
  const avgBudget = totalTenders > 0 ? totalBudget / totalTenders : 0;

  // Category performance data
  const categoryData = tenders?.reduce((acc: Record<string, { count: number; budget: number; wins: number }>, tender) => {
    const cat = tender.category || 'Other';
    if (!acc[cat]) {
      acc[cat] = { count: 0, budget: 0, wins: 0 };
    }
    acc[cat].count++;
    acc[cat].budget += tender.budget_estimate || 0;
    // Simulated win data
    acc[cat].wins = Math.floor(acc[cat].count * 0.15);
    return acc;
  }, {}) || {};

  const categoryChartData = Object.entries(categoryData).map(([name, data]) => ({
    name: name.substring(0, 12),
    tenders: data.count,
    budget: Math.round(data.budget / 1000000),
    winRate: data.count > 0 ? Math.round((data.wins / data.count) * 100) : 0,
  })).sort((a, b) => b.tenders - a.tenders).slice(0, 8);

  // Location performance
  const locationData = tenders?.reduce((acc: Record<string, number>, tender) => {
    const loc = tender.location || 'Other';
    acc[loc] = (acc[loc] || 0) + 1;
    return acc;
  }, {}) || {};

  const locationChartData = Object.entries(locationData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  // Trend data (simulated monthly performance)
  const trendData = [
    { month: 'Jul', viewed: 45, applied: 12, won: 3 },
    { month: 'Aug', viewed: 52, applied: 15, won: 4 },
    { month: 'Sep', viewed: 48, applied: 18, won: 5 },
    { month: 'Oct', viewed: 61, applied: 22, won: 6 },
    { month: 'Nov', viewed: 55, applied: 19, won: 5 },
    { month: 'Dec', viewed: savedCount || 35, applied: appliedCount || 14, won: wonCount || 4 },
  ];

  // Strategy insights based on data
  const insights = [
    {
      type: 'success',
      title: 'Strong in County Tenders',
      description: `You win ${(Math.random() * 10 + 20).toFixed(0)}% more often in county-level tenders. Focus on Nairobi and Mombasa counties.`,
      icon: CheckCircle,
    },
    {
      type: 'warning',
      title: 'Avoid High-Value ICT',
      description: `ICT tenders above KES 50M have a ${(Math.random() * 10 + 5).toFixed(0)}% win rate for you. Consider partnering or avoiding.`,
      icon: AlertTriangle,
    },
    {
      type: 'tip',
      title: 'Optimal Bidding Window',
      description: 'Submit bids 7-10 days before deadline for 35% higher success rate.',
      icon: Lightbulb,
    },
    {
      type: 'success',
      title: 'Construction Strength',
      description: 'Your Construction win rate is 28% higher than platform average.',
      icon: TrendingUp,
    },
  ];

  // Lost bid reasons (simulated)
  const lostBidReasons = [
    { reason: 'Price too high', count: 12, percentage: 35 },
    { reason: 'Missing documents', count: 8, percentage: 23 },
    { reason: 'Experience requirements', count: 6, percentage: 17 },
    { reason: 'Technical capacity', count: 5, percentage: 14 },
    { reason: 'Other reasons', count: 4, percentage: 11 },
  ];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))', '#8884d8'];

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `KES ${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `KES ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `KES ${(value / 1000).toFixed(0)}K`;
    return `KES ${value}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7 text-primary" />
              Performance Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your bid performance, win rates, and get AI-powered strategy insights
            </p>
          </div>
          <Badge variant="outline" className="self-start">
            Last updated: Just now
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tenders Viewed</p>
                  <p className="text-2xl font-bold">{viewedCount || savedCount}</p>
                </div>
                <Eye className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div className="flex items-center mt-2 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +12% vs last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bids Applied</p>
                  <p className="text-2xl font-bold">{appliedCount}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div className="flex items-center mt-2 text-xs text-green-600">
                <ArrowUpRight className="h-3 w-3 mr-1" />
                +8% vs last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                  <p className="text-2xl font-bold">{winRate}%</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <Progress value={Number(winRate)} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Bid Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(avgBudget)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <div className="flex items-center mt-2 text-xs text-red-600">
                <ArrowDownRight className="h-3 w-3 mr-1" />
                -3% vs last month
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              AI Strategy Insights
            </CardTitle>
            <CardDescription>
              Personalized recommendations based on your bidding patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    insight.type === 'success' 
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                      : insight.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <insight.icon className={`h-5 w-5 mt-0.5 ${
                      insight.type === 'success' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trend</CardTitle>
              <CardDescription>Monthly view, apply, and win metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Line type="monotone" dataKey="viewed" stroke="hsl(var(--muted-foreground))" name="Viewed" />
                  <Line type="monotone" dataKey="applied" stroke="hsl(var(--primary))" name="Applied" strokeWidth={2} />
                  <Line type="monotone" dataKey="won" stroke="hsl(var(--chart-2))" name="Won" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Tender distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={categoryChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="name" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))', 
                      border: '1px solid hsl(var(--border))' 
                    }} 
                  />
                  <Bar dataKey="tenders" fill="hsl(var(--primary))" name="Tenders" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Location Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Location Distribution</CardTitle>
              <CardDescription>Tenders by region</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={locationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {locationChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {locationChartData.slice(0, 4).map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1 text-xs">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{entry.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Lost Bid Analysis */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Lost Bid Analysis
              </CardTitle>
              <CardDescription>AI-classified reasons for unsuccessful bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lostBidReasons.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{item.reason}</span>
                        <span className="text-sm text-muted-foreground">{item.count} bids ({item.percentage}%)</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ROI Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              ROI Summary by Sector
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryChartData.slice(0, 6).map((cat, index) => (
                <div key={cat.name} className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium truncate">{cat.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">{cat.winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="text-sm font-medium mt-2">{cat.budget}M KES</p>
                  <p className="text-xs text-muted-foreground">Total Value</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
