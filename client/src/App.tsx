
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AppNavigation } from "@/components/common/app-navigation";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing-page";
import Dashboard from "@/pages/dashboard-page";
import AuthPage from "@/pages/auth";
import BrowseTenders from "@/pages/browse-tenders";
import SavedTenders from "@/pages/saved-tenders";
import Consortiums from "@/pages/consortiums";
import AiAnalysis from "@/pages/ai-analysis";
import ServiceProviders from "@/pages/service-providers";
import Analytics from "@/pages/analytics";
import Subscription from "@/pages/subscription";
import AutomationPage from "@/pages/admin/automation";
import AdminDashboard from "@/pages/admin/dashboard";
import RfqSystem from "@/pages/rfq-system";
import ProfilePage from "@/pages/profile";
import TriggerScraper from "@/pages/trigger-scraper";
import PerformanceDashboard from "@/pages/performance-dashboard";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Public routes (no auth required)
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/auth" component={AuthPage} />
        <Route component={Landing} />
      </Switch>
    );
  }

  // Authenticated routes - show navigation
  return (
    <>
      <AppNavigation />
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/browse" component={BrowseTenders} />
        <Route path="/saved" component={SavedTenders} />
        <Route path="/consortiums" component={Consortiums} />
        <Route path="/ai-analysis" component={AiAnalysis} />
        <Route path="/service-providers" component={ServiceProviders} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/performance" component={PerformanceDashboard} />
        <Route path="/rfq-system" component={RfqSystem} />
        <Route path="/subscription" component={Subscription} />
        <Route path="/trigger-scraper" component={TriggerScraper} />
        <Route path="/admin/automation" component={AutomationPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
