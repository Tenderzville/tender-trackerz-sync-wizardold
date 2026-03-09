import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, FileText, Activity, Database, AlertCircle, Download, Zap, History, Megaphone, Check, X, GraduationCap, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import { useI18n } from '@/lib/i18n';

interface Stats {
  totalUsers: number;
  totalTenders: number;
  activeTenders: number;
  totalConsortiums: number;
  totalServiceProviders: number;
  recentAuditLogs: number;
  historicalAwards: number;
  earlyUserCount: number;
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

interface PendingAd {
  id: number;
  title: string;
  description: string | null;
  ad_type: string;
  amount: number;
  payment_status: string;
  is_active: boolean;
  created_at: string;
  payment_reference: string | null;
  user_id: string;
  provider_id: number;
}

interface PendingContent {
  id: number;
  title: string;
  description: string | null;
  category?: string;
  level?: string;
  format?: string;
  payment_status: string;
  amount: number;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  type: 'guide' | 'template' | 'course';
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [automationLogs, setAutomationLogs] = useState<AutomationLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [pendingAds, setPendingAds] = useState<PendingAd[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [importingData, setImportingData] = useState(false);
  const [importOffset, setImportOffset] = useState(0);

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
      const [users, tenders, activeTenders, consortiums, serviceProviders, auditCount, historicalCount, earlyUsers] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }),
        supabase.from('tenders').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('consortiums').select('id', { count: 'exact', head: true }),
        supabase.from('service_providers').select('id', { count: 'exact', head: true }),
        supabase.from('security_audit_log').select('id', { count: 'exact', head: true }),
        supabase.from('historical_tender_awards').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_early_user', true),
      ]);

      setStats({
        totalUsers: users.count || 0,
        totalTenders: tenders.count || 0,
        activeTenders: activeTenders.count || 0,
        totalConsortiums: consortiums.count || 0,
        totalServiceProviders: serviceProviders.count || 0,
        recentAuditLogs: auditCount.count || 0,
        historicalAwards: historicalCount.count || 0,
        earlyUserCount: earlyUsers.count || 0,
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

      // Load pending ads (paid but not activated)
      const { data: ads } = await supabase
        .from('service_provider_ads')
        .select('*')
        .eq('payment_status', 'paid')
        .eq('is_active', false)
        .order('created_at', { ascending: false });
      setPendingAds(ads || []);

      // Load pending learning content
      await loadPendingContent();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({ title: 'Error', description: 'Failed to load dashboard data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingContent = async () => {
    try {
      const [guides, templates, courses] = await Promise.all([
        supabase.from('learning_guides').select('id, title, description, category, payment_status, amount, is_approved, created_at, user_id').eq('is_approved', false).order('created_at', { ascending: false }),
        supabase.from('learning_templates').select('id, title, description, format, category, payment_status, amount, is_approved, created_at, user_id').eq('is_approved', false).order('created_at', { ascending: false }),
        supabase.from('learning_courses').select('id, title, description, level, payment_status, amount, is_approved, created_at, user_id').eq('is_approved', false).order('created_at', { ascending: false }),
      ]);

      const allContent: PendingContent[] = [
        ...(guides.data || []).map((g: any) => ({ ...g, type: 'guide' as const })),
        ...(templates.data || []).map((t: any) => ({ ...t, type: 'template' as const })),
        ...(courses.data || []).map((c: any) => ({ ...c, type: 'course' as const })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setPendingContent(allContent);
    } catch (error) {
      console.error('Error loading pending content:', error);
    }
  };

  const approveContent = async (item: PendingContent) => {
    try {
      const table = item.type === 'guide' ? 'learning_guides' : item.type === 'template' ? 'learning_templates' : 'learning_courses';
      const { error } = await supabase
        .from(table)
        .update({ is_approved: true, is_published: true })
        .eq('id', item.id);

      if (error) throw error;

      toast({ title: 'Content Approved', description: `"${item.title}" is now published. Payment of KSh ${item.amount} can be collected.` });
      setPendingContent(prev => prev.filter(c => !(c.id === item.id && c.type === item.type)));
    } catch (error) {
      console.error('Approve content error:', error);
      toast({ title: 'Error', description: 'Failed to approve content', variant: 'destructive' });
    }
  };

  const rejectContent = async (item: PendingContent) => {
    try {
      const table = item.type === 'guide' ? 'learning_guides' : item.type === 'template' ? 'learning_templates' : 'learning_courses';
      const { error } = await supabase
        .from(table)
        .update({ payment_status: 'rejected', is_approved: false, is_published: false })
        .eq('id', item.id);

      if (error) throw error;

      toast({ title: 'Content Rejected', description: `"${item.title}" has been rejected.` });
      setPendingContent(prev => prev.filter(c => !(c.id === item.id && c.type === item.type)));
    } catch (error) {
      console.error('Reject content error:', error);
      toast({ title: 'Error', description: 'Failed to reject content', variant: 'destructive' });
    }
  };

  const triggerPaymentCollection = async (item: PendingContent) => {
    try {
      const table = item.type === 'guide' ? 'learning_guides' : item.type === 'template' ? 'learning_templates' : 'learning_courses';

      // Initialize Paystack payment for the content creator
      const { data: profile } = await supabase.from('profiles').select('email').eq('id', item.user_id).single();
      if (!profile?.email) {
        toast({ title: 'Error', description: 'Could not find user email for payment', variant: 'destructive' });
        return;
      }

      const { data, error } = await supabase.functions.invoke('paystack-payment', {
        body: {
          action: 'initialize',
          plan: `learning_${item.type}`,
          email: profile.email,
          user_id: item.user_id,
          amount: item.amount * 100, // Paystack uses kobo/cents
          callback_url: `${window.location.origin}/subscription/callback?learning_type=${item.type}&learning_id=${item.id}`,
        },
      });

      if (error) throw error;

      // Update payment status
      await supabase.from(table).update({ payment_status: 'invoice_sent' }).eq('id', item.id);

      toast({
        title: 'Payment Link Generated',
        description: `Payment link sent for KSh ${item.amount}. Reference: ${data?.data?.reference || 'pending'}`,
      });

      loadPendingContent();
    } catch (error) {
      console.error('Payment collection error:', error);
      toast({ title: 'Error', description: 'Failed to generate payment link', variant: 'destructive' });
    }
  };

  const approveAd = async (adId: number) => {
    try {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + 1);

      const { error } = await supabase
        .from('service_provider_ads')
        .update({
          is_active: true,
          starts_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', adId);

      if (error) throw error;

      toast({ title: 'Ad Approved', description: 'The advertisement is now active for 30 days.' });
      setPendingAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (error) {
      console.error('Approve ad error:', error);
      toast({ title: 'Error', description: 'Failed to approve ad', variant: 'destructive' });
    }
  };

  const rejectAd = async (adId: number) => {
    try {
      const { error } = await supabase
        .from('service_provider_ads')
        .update({ payment_status: 'rejected', is_active: false })
        .eq('id', adId);

      if (error) throw error;

      toast({ title: 'Ad Rejected', description: 'The advertisement has been rejected.' });
      setPendingAds(prev => prev.filter(ad => ad.id !== adId));
    } catch (error) {
      console.error('Reject ad error:', error);
      toast({ title: 'Error', description: 'Failed to reject ad', variant: 'destructive' });
    }
  };

  const triggerScraper = async () => {
    try {
      toast({ title: 'Starting Tender Sync', description: 'Fetching latest tenders from government portals...' });
      const { data, error } = await supabase.functions.invoke('firecrawl-tender-scraper', { body: { source: 'all' } });
      if (error) throw error;
      toast({ title: 'Sync Complete', description: data.message || 'Tender sync finished' });
      setTimeout(loadDashboardData, 2000);
    } catch (error) {
      console.error('Tender sync error:', error);
      toast({ title: 'Error', description: 'Failed to sync tenders', variant: 'destructive' });
    }
  };

  const importHistoricalData = async () => {
    try {
      setImportingData(true);
      toast({ title: 'Importing Historical Data', description: `Importing batch from offset ${importOffset}...` });
      const { data, error } = await supabase.functions.invoke('import-historical-data', { body: { limit: 5000, offset: importOffset } });
      if (error) throw error;
      const nextOffset = data.stats?.next_offset || importOffset + 5000;
      setImportOffset(nextOffset);
      toast({ title: 'Import Complete', description: `${data.stats?.saved || 0} records imported.` });
      loadDashboardData();
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import Error', description: error instanceof Error ? error.message : 'Failed to import data', variant: 'destructive' });
    } finally {
      setImportingData(false);
    }
  };

  const checkSubscriptionExpiry = async () => {
    try {
      toast({ title: 'Running Subscription Check', description: 'Checking for expired subscriptions...' });
      const { data, error } = await supabase.functions.invoke('check-subscription-expiry', {});
      if (error) throw error;
      toast({ title: 'Check Complete', description: `Found ${data.stats?.expired || 0} expired, ${data.stats?.expiring_soon || 0} expiring soon` });
      loadDashboardData();
    } catch (error) {
      console.error('Subscription check error:', error);
      toast({ title: 'Error', description: 'Failed to check subscriptions', variant: 'destructive' });
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'template': return <FileText className="h-4 w-4" />;
      case 'course': return <GraduationCap className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'guide': return 'Guide';
      case 'template': return 'Template';
      case 'course': return 'Course';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            {t('admin.title')}
          </h1>
          <p className="text-muted-foreground mt-1">System overview and management</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={triggerScraper} size="lg">
            <Zap className="h-4 w-4 mr-2" />
            {t('admin.runScraper')}
          </Button>
          <Button onClick={importHistoricalData} size="lg" variant="outline" disabled={importingData}>
            <Download className="h-4 w-4 mr-2" />
            {importingData ? 'Importing...' : t('admin.importHistorical')}
          </Button>
          <Button onClick={checkSubscriptionExpiry} size="lg" variant="secondary">
            <History className="h-4 w-4 mr-2" />
            Check Expiry
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(pendingAds.length > 0 || pendingContent.length > 0) && (
        <div className="space-y-2">
          {pendingAds.length > 0 && (
            <Card className="border-2 border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Megaphone className="h-5 w-5 text-amber-600" />
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    {pendingAds.length} paid ad(s) awaiting approval
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {pendingContent.length > 0 && (
            <Card className="border-2 border-blue-500/30 bg-blue-50/50 dark:bg-blue-900/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    {pendingContent.length} learning content submission(s) awaiting review
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTenders}</div>
            <p className="text-xs text-muted-foreground">{stats?.activeTenders} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Providers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalServiceProviders}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Historical Awards</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.historicalAwards?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">For AI analysis</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="learning" className="space-y-4">
        <TabsList>
          <TabsTrigger value="learning" className="gap-1">
            <GraduationCap className="h-3.5 w-3.5" />
            Learning Content {pendingContent.length > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5">{pendingContent.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="ads" className="gap-1">
            <Megaphone className="h-3.5 w-3.5" />
            {t('admin.adApproval')} {pendingAds.length > 0 && <Badge variant="destructive" className="ml-1 text-xs px-1.5">{pendingAds.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="automation">Automation Logs</TabsTrigger>
          <TabsTrigger value="security">Security Audit</TabsTrigger>
        </TabsList>

        {/* Learning Content Tab */}
        <TabsContent value="learning" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Learning Content Submissions</CardTitle>
              <CardDescription>Review, approve/reject guides, templates, and courses. Trigger payment collection after approval.</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingContent.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No content pending review</p>
              ) : (
                <div className="space-y-3">
                  {pendingContent.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(item.type)}
                            <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                            {item.category && <Badge variant="secondary">{item.category}</Badge>}
                            {item.level && <Badge variant="secondary">{item.level}</Badge>}
                            {item.format && <Badge variant="secondary">{item.format}</Badge>}
                          </div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Badge variant="outline">KSh {item.amount.toLocaleString()}</Badge>
                            <Badge variant={item.payment_status === 'paid' ? 'default' : 'secondary'}>{item.payment_status}</Badge>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" onClick={() => approveContent(item)} className="gap-1">
                          <Check className="h-4 w-4" /> Approve & Publish
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => triggerPaymentCollection(item)} className="gap-1">
                          <Zap className="h-4 w-4" /> Collect Payment
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectContent(item)} className="gap-1">
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ad Approval Tab */}
        <TabsContent value="ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.adApproval')}</CardTitle>
              <CardDescription>Review and activate paid marketplace advertisements</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAds.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No ads pending approval</p>
              ) : (
                <div className="space-y-3">
                  {pendingAds.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{ad.title}</p>
                        {ad.description && <p className="text-sm text-muted-foreground mt-1">{ad.description}</p>}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Badge variant="outline">KSh {ad.amount.toLocaleString()}</Badge>
                          <Badge variant="outline">{ad.ad_type}</Badge>
                          {ad.payment_reference && <span>Ref: {ad.payment_reference}</span>}
                          <span>{new Date(ad.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm" onClick={() => approveAd(ad.id)} className="gap-1">
                          <Check className="h-4 w-4" />
                          {t('admin.approve')}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectAd(ad.id)} className="gap-1">
                          <X className="h-4 w-4" />
                          {t('admin.reject')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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
                        <p className="text-sm text-muted-foreground">{new Date(log.executed_at).toLocaleString()}</p>
                        {log.error_message && <p className="text-sm text-destructive mt-1">{log.error_message}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {log.duration_ms && <span className="text-sm text-muted-foreground">{log.duration_ms}ms</span>}
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
                        <p className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString()}</p>
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
