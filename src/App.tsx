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
        <Route path="/saved" component={SavedTendersPage} />
        <Route path="/providers" component={ProvidersPage} />
        <Route path="/notifications" component={NotificationsPage} />
        <Route path="/admin" component={AdminDashboard} />
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
