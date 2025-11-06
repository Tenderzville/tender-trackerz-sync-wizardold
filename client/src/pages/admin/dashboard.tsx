import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, FileText, Activity, Database, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

interface Stats {
  totalUsers: number;
  totalTenders: number;
  activeTenders: number;
  totalConsortiums: number;
  totalServiceProviders: number;
  recentAuditLogs: number;
}

interface AutomationLog {
  id: number;
  function_name: string;
  status: string;
  executed_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
}

interface AuditLog {
  id: string;
  user_id: string | null;
  table_name: string;
  action_type: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, [user]);

  const checkAdminAccess = async () => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (error || !data) {
        toast({
          title: 'Access Denied',
          description: 'You do not have admin privileges.',
          variant: 'destructive',
        });
        setLocation('/');
        return;
      }

      setIsAdmin(true);
      loadDashboardData();
    } catch (error) {
      console.error('Admin check error:', error);
      setLocation('/');
    }
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load stats
      const [users, tenders, activeTenders, consortiums, serviceProviders, auditCount] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('consortiums').select('id', { count: 'exact', head: true }),
        supabase.from('service_providers').select('id', { count: 'exact', head: true }),
        supabase.from('security_audit_log').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalTenders: tenders.count || 0,
        activeTenders: activeTenders.count || 0,
        totalConsortiums: consortiums.count || 0,
        totalServiceProviders: serviceProviders.count || 0,
        recentAuditLogs: auditCount.count || 0,
      });

      // Load automation logs
      const { data: autoLogs } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(20);
      
      setAutomationLogs(autoLogs || []);

      // Load audit logs
      const { data: securityLogs } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      setAuditLogs(securityLogs || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const triggerScraper = async () => {
    try {
      toast({
        title: 'Starting Scraper',
        description: 'Manual scraper triggered...',
      });

      const { data, error } = await supabase.functions.invoke('manual-scraper-trigger', {
        body: { manual_trigger: true },
      });

      if (error) throw error;

      toast({
        title: 'Scraper Started',
        description: 'Tender scraping is in progress',
      });

      // Refresh automation logs
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error('Scraper trigger error:', error);
      toast({
        title: 'Error',
        description: 'Failed to trigger scraper',
        variant: 'destructive',
      });
    }
  };

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>
        <Button onClick={triggerScraper} size="lg">
          <Activity className="h-4 w-4 mr-2" />
          Run Scraper
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenders}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeTenders} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Consortiums</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalConsortiums}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalServiceProviders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentAuditLogs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="default">Operational</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Logs Tabs */}
      <Tabs defaultValue="automation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="automation">Automation Logs</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Automation Runs</CardTitle>
              <CardDescription>Edge function execution history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {automationLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No automation logs yet</p>
                ) : (
                  automationLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{log.function_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.executed_at).toLocaleString()}
                        </p>
                        {log.error_message && (
                          <p className="text-sm text-destructive mt-1">{log.error_message}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {log.duration_ms && (
                          <span className="text-sm text-muted-foreground">{log.duration_ms}ms</span>
                        )}
                        <Badge variant={log.status === 'completed' ? 'default' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Audit Log</CardTitle>
              <CardDescription>Recent security-sensitive operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No audit logs yet</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{log.table_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="outline">{log.action_type}</Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
