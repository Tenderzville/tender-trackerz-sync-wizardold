import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, useLocation } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

// Legacy URLs → current canonical paths. Mirrors vercel.json redirects so the
// preview environment and any non-Vercel host also resolve old links.
const LEGACY_REDIRECTS: Record<string, string> = {
  '/saved-tenders': '/saved',
  '/learning-hub': '/community',
  '/marketplace': '/providers',
  '/analytics': '/',
  '/performance': '/',
  '/service-providers': '/providers',
  '/browse': '/tenders',
  '/source-ke': '/sourceke',
  '/login': '/auth',
  '/signup': '/auth',
  '/register': '/auth',
  '/dashboard': '/',
  '/home': '/',
};

function LegacyRedirectGate({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  useEffect(() => {
    const target = LEGACY_REDIRECTS[location];
    if (target && target !== location) setLocation(target, { replace: true });
  }, [location, setLocation]);
  return <>{children}</>;
}

// Pages
import DashboardPage from '@/pages/DashboardPage';
import TendersPage from '@/pages/TendersPage';
import SavedTendersPage from '@/pages/SavedTendersPage';
import ProvidersPage from '@/pages/ProvidersPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AuthPage from '@/pages/AuthPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminVerificationPage from '@/pages/AdminVerificationPage';
import AdminWebhooksPage from '@/pages/AdminWebhooksPage';
import AdminTenderQueuePage from '@/pages/AdminTenderQueuePage';
import AIAnalysisPage from '@/pages/AIAnalysisPage';
import TermsPage from '@/pages/TermsPage';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/ProfilePage';
import SmartMatchesPage from '@/pages/SmartMatchesPage';
import RFQPage from '@/pages/RFQPage';
import ConsortiumsPage from '@/pages/ConsortiumsPage';
import SubscriptionPage from '@/pages/SubscriptionPage';
import SubscriptionCallbackPage from '@/pages/SubscriptionCallbackPage';
import CommunityPage from '@/pages/CommunityPage';
import BlogPage from '@/pages/BlogPage';
import SourceKePage from '@/pages/SourceKePage';
import IntegrationsPage from '@/pages/IntegrationsPage';
import SettingsIntegrationsPage from '@/pages/SettingsIntegrationsPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // Public routes accessible without auth
  const path = typeof window !== 'undefined' ? window.location.pathname : '';
  if (!user && (path === '/integrations')) {
    return <IntegrationsPage />;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/tenders" component={TendersPage} />
        <Route path="/browse" component={TendersPage} />
        <Route path="/saved" component={SavedTendersPage} />
        <Route path="/providers" component={ProvidersPage} />
        <Route path="/service-providers" component={ProvidersPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/verification" component={AdminVerificationPage} />
        <Route path="/admin/webhooks" component={AdminWebhooksPage} />
        <Route path="/admin/tender-queue" component={AdminTenderQueuePage} />
        <Route path="/ai-analysis" component={AIAnalysisPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/smart-matches" component={SmartMatchesPage} />
        <Route path="/rfq" component={RFQPage} />
        <Route path="/consortiums" component={ConsortiumsPage} />
        <Route path="/subscription" component={SubscriptionPage} />
        <Route path="/subscription/callback" component={SubscriptionCallbackPage} />
        <Route path="/community" component={CommunityPage} />
        <Route path="/blog/:slug" component={BlogPage} />
        <Route path="/blog" component={BlogPage} />
        <Route path="/sourceke" component={SourceKePage} />
        <Route path="/source-ke" component={SourceKePage} />
        <Route path="/integrations" component={IntegrationsPage} />
        <Route path="/settings/integrations" component={SettingsIntegrationsPage} />
        <Route>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold">Page Not Found</h1>
          </div>
        </Route>
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}

export default App;
