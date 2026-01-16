import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch } from 'wouter';
import { queryClient } from '@/lib/queryClient';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';

// Pages
import DashboardPage from '@/pages/DashboardPage';
import TendersPage from '@/pages/TendersPage';
import SavedTendersPage from '@/pages/SavedTendersPage';
import ProvidersPage from '@/pages/ProvidersPage';
import NotificationsPage from '@/pages/NotificationsPage';
import AuthPage from '@/pages/AuthPage';
import AdminDashboard from '@/pages/AdminDashboard';
import AIAnalysisPage from '@/pages/AIAnalysisPage';
import TermsPage from '@/pages/TermsPage';
import SettingsPage from '@/pages/SettingsPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
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
        <Route path="/ai-analysis" component={AIAnalysisPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/settings" component={SettingsPage} />
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
