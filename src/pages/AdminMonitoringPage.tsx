import { useAuth } from '@/hooks/useAuth';
import { SEO } from '@/components/SEO';
import { Navigate } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Youtube, Send, Linkedin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return url;
    }
  } catch { /* noop */ }
  return null;
}

export default function AdminMonitoringPage() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [demoUrl, setDemoUrl] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['site-settings', 'demo_video_url'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*').eq('key', 'demo_video_url').maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings?.value && typeof (settings.value as any).url === 'string') {
      setDemoUrl((settings.value as any).url);
    }
  }, [settings]);

  const { data: monitor, refetch, isFetching } = useQuery({
    queryKey: ['admin-monitoring'],
    queryFn: async () => {
      const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [scrapeLog, tenderCount, queuedCount, shortWindowCount, lastLinkedIn, lastTelegram] = await Promise.all([
        supabase.from('automation_logs').select('*').order('executed_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('tenders').select('*', { count: 'exact', head: true }).gte('created_at', since24h),
        supabase.from('tenders').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('tenders').select('*', { count: 'exact', head: true }).eq('status', 'short_window'),
        supabase.from('tenders').select('linkedin_posted_at').not('linkedin_posted_at', 'is', null).order('linkedin_posted_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('automation_logs').select('*').eq('function_name', 'telegram-tender-notify').order('executed_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      return {
        lastScrape: scrapeLog.data,
        newTenders24h: tenderCount.count ?? 0,
        activeTenders: queuedCount.count ?? 0,
        shortWindow: shortWindowCount.count ?? 0,
        lastLinkedIn: (lastLinkedIn.data as any)?.linkedin_posted_at ?? null,
        lastTelegram: lastTelegram.data,
      };
    },
    refetchInterval: 30_000,
  });

  const saveDemo = useMutation({
    mutationFn: async () => {
      const trimmed = demoUrl.trim();
      if (trimmed && !toEmbedUrl(trimmed)) throw new Error('Only YouTube URLs are allowed');
      const { error } = await supabase.from('site_settings')
        .update({ value: { url: trimmed }, updated_at: new Date().toISOString(), updated_by: user?.id })
        .eq('key', 'demo_video_url');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Demo video saved' });
      qc.invalidateQueries({ queryKey: ['site-settings'] });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  const runNow = async (fn: string) => {
    try {
      const { error } = await supabase.functions.invoke(fn, { body: {} });
      if (error) throw error;
      toast({ title: `${fn} triggered` });
      refetch();
    } catch (e: any) {
      toast({ title: 'Trigger failed', description: e.message, variant: 'destructive' });
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user || !isAdmin) return <Navigate to="/" />;

  const stale = (iso?: string | null, hours = 24) => !iso || (Date.now() - new Date(iso).getTime()) > hours * 3600 * 1000;

  return (
    <div className="space-y-6">
      <SEO title="Admin: Monitoring — TenderAlert Pro" description="Ops dashboard for scraper, LinkedIn and Telegram distribution." path="/admin/monitoring" noindex />
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Monitoring Dashboard</h1>
          <p className="text-muted-foreground">Pipeline health, distribution status and demo content</p>
        </div>
        <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Last Scrape</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stale(monitor?.lastScrape?.executed_at, 12) ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
              <p className="text-lg font-semibold">
                {monitor?.lastScrape?.executed_at ? formatDistanceToNow(new Date(monitor.lastScrape.executed_at), { addSuffix: true }) : 'Never'}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{monitor?.lastScrape?.function_name} · {monitor?.lastScrape?.status}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tenders (24h)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{monitor?.newTenders24h ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{monitor?.activeTenders ?? 0} active · {monitor?.shortWindow ?? 0} short-window</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Linkedin className="w-4 h-4" /> LinkedIn</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stale(monitor?.lastLinkedIn, 96) ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
              <p className="text-sm font-semibold">
                {monitor?.lastLinkedIn ? formatDistanceToNow(new Date(monitor.lastLinkedIn), { addSuffix: true }) : 'Never'}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 h-7 px-2" onClick={() => runNow('linkedin-tender-post')}>Run now</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1"><Send className="w-4 h-4" /> Telegram</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {stale(monitor?.lastTelegram?.executed_at, 24) ? <AlertTriangle className="w-5 h-5 text-warning" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
              <p className="text-sm font-semibold">
                {monitor?.lastTelegram?.executed_at ? formatDistanceToNow(new Date(monitor.lastTelegram.executed_at), { addSuffix: true }) : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={monitor?.lastTelegram?.status === 'completed' ? 'success' as any : 'secondary'}>{monitor?.lastTelegram?.status ?? 'n/a'}</Badge>
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => runNow('telegram-tender-notify')}>Run now</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Youtube className="w-5 h-5 text-red-500" /> Landing Page Demo Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste a YouTube URL (e.g. <code>https://youtu.be/xxxx</code> or <code>https://www.youtube.com/watch?v=xxxx</code>).
            The "Watch Demo" button on the landing page will open this in a modal. Leave blank to hide.
          </p>
          <div className="flex gap-2">
            <Input placeholder="https://www.youtube.com/watch?v=..." value={demoUrl} onChange={(e) => setDemoUrl(e.target.value)} />
            <Button onClick={() => saveDemo.mutate()} disabled={saveDemo.isPending}>Save</Button>
          </div>
          {demoUrl && toEmbedUrl(demoUrl) && (
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe src={toEmbedUrl(demoUrl)!} className="w-full h-full" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
            </div>
          )}
          {demoUrl && !toEmbedUrl(demoUrl) && (
            <p className="text-sm text-destructive">Not a valid YouTube URL.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>How the watchdog works</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>A cron job runs <code>distribution-watchdog</code> every 3 hours. If Telegram has been silent {'>'}24h or LinkedIn {'>'}96h, it invokes the missing function automatically.</p>
          <p>Manual triggers above run the same functions on demand.</p>
        </CardContent>
      </Card>
    </div>
  );
}
