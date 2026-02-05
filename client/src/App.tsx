
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/common/theme-provider";
import { AppNavigation } from "@/components/common/app-navigation";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
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
import SettingsPage from "@/pages/settings";
import SmartMatchesPage from "@/pages/smart-matches";
import SubscriptionCallback from "@/pages/subscription-callback";
import TermsPage from "@/pages/terms";
import TransactionHistory from "@/pages/transaction-history";

// Global unhandled rejection handler
function useGlobalErrorHandler() {
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error("Global error:", event.error);
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);
}

// Hook to detect auth recovery flow and redirect appropriately
function useAuthRecoveryRedirect() {
  const [, setLocation] = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Check for recovery tokens in URL hash (Supabase puts them there after email verification)
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname;
    
    const isAuthRoute = pathname === '/auth';

    // Supabase PKCE/magic-link/recovery can return as: /?code=...
    // Ensure we always land on /auth so the reset UI is available.
    if (!isAuthRoute && searchParams.has('code')) {
      window.location.href = `/auth${window.location.search}${hash}`;
      return;
    }

    // Check for recovery type in hash (e.g., #access_token=...&type=recovery)
    if (!isAuthRoute && hash && hash.includes('type=recovery')) {
      // Redirect to auth page with the hash preserved
      window.location.href = `/auth${window.location.search}${hash}`;
      return;
    }
    
    // Check for error codes (expired links, etc.)
    const errorCode = searchParams.get('error_code');
    if (!isAuthRoute && errorCode) {
      // Redirect to auth page with the error params
      window.location.href = `/auth${window.location.search}${hash}`;
      return;
    }
    
    // Check for access_token in hash (successful auth callback)
    if (hash && hash.includes('access_token')) {
      // This is a successful auth, let Supabase handle it
      setChecked(true);
      return;
    }
    
    setChecked(true);
  }, [setLocation]);

  return checked;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const recoveryChecked = useAuthRecoveryRedirect();
  useGlobalErrorHandler();

  if (isLoading || !recoveryChecked) {
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
        <Route path="/terms" component={TermsPage} />
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
        <Route path="/subscription/callback" component={SubscriptionCallback} />
        <Route path="/transactions" component={TransactionHistory} />
        <Route path="/trigger-scraper" component={TriggerScraper} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/admin/automation" component={AutomationPage} />
        <Route path="/admin/dashboard" component={AdminDashboard} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/smart-matches" component={SmartMatchesPage} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;

