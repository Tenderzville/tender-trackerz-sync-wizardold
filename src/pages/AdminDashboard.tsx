import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheck, 
  Users, 
  FileText, 
  BarChart3,
  RefreshCw,
  Database,
  AlertTriangle
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Stats queries
  const { data: tendersCount } = useQuery({
    queryKey: ['admin-tenders-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: historicalCount } = useQuery({
    queryKey: ['admin-historical-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('historical_tender_awards')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: providersCount } = useQuery({
    queryKey: ['admin-providers-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('service_providers')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: automationLogs } = useQuery({
    queryKey: ['admin-automation-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*')
        .order('executed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  // Import historical data from HuggingFace
  const handleImportHistoricalData = async () => {
    setIsImporting(true);
    setImportResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('import-historical-data', {
        body: { source: 'huggingface' }
      });

      if (error) throw error;
      setImportResult(`Successfully imported ${data.imported || 0} historical contracts!`);
    } catch (err: any) {
      setImportResult(`Error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Trigger manual scraper
  const handleTriggerScraper = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('tender-scraper');
      if (error) throw error;
      alert(`Scraper triggered! Found ${data?.tenders_found || 0} tenders.`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  // Security: Redirect non-admins
  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration and monitoring</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tendersCount ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Active Tenders</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{historicalCount?.toLocaleString() ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Historical Awards</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{providersCount ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Service Providers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{automationLogs?.length ?? '-'}</p>
                <p className="text-xs text-muted-foreground">Recent Jobs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Import Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Import 39,000+ real Kenyan procurement contracts from HuggingFace dataset 
              for accurate win probability calculations.
            </p>
            <Button 
              onClick={handleImportHistoricalData} 
              disabled={isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Database className="w-4 h-4 mr-2" />
                  Import from HuggingFace
                </>
              )}
            </Button>
            {importResult && (
              <p className={`text-sm mt-3 ${importResult.includes('Error') ? 'text-destructive' : 'text-primary'}`}>
                {importResult}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Trigger Tender Scraper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Manually trigger the tender scraper to fetch new tenders from 
              government portals and save them to the database.
            </p>
            <Button onClick={handleTriggerScraper} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Scraper Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Automation Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Automation Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {automationLogs?.length === 0 ? (
            <p className="text-muted-foreground">No automation logs yet.</p>
          ) : (
            <div className="space-y-3">
              {automationLogs?.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{log.function_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(log.executed_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={log.status === 'completed' ? 'success' : log.status === 'failed' ? 'destructive' : 'secondary'}>
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Warning */}
      <Card className="border-warning">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Security Notice</p>
              <p className="text-sm text-muted-foreground mt-1">
                Admin access is protected by server-side role verification. Never share admin 
                credentials or access with unauthorized personnel. All actions are logged.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
