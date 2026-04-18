import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Copy, Plus, Trash2, Send } from 'lucide-react';

const PROJECT_REF = 'mwggjriyxxknotymfsvp';

export default function AdminWebhooksPage() {
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [outbound, setOutbound] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [newSource, setNewSource] = useState('mygov');
  const [newName, setNewName] = useState('Browse AI - MyGov');
  const [newOutName, setNewOutName] = useState('n8n CRM workflow');
  const [newOutUrl, setNewOutUrl] = useState('');
  const [newOutEvents, setNewOutEvents] = useState('tender.created,rfq.created,user.signup');

  const load = async () => {
    const [ep, ob, lg] = await Promise.all([
      supabase.from('webhook_endpoints').select('*').order('created_at', { ascending: false }),
      supabase.from('outbound_webhooks').select('*').order('created_at', { ascending: false }),
      supabase.from('webhook_ingestion_log').select('*').order('created_at', { ascending: false }).limit(20),
    ]);
    setEndpoints(ep.data || []);
    setOutbound(ob.data || []);
    setLogs(lg.data || []);
  };
  useEffect(() => { load(); }, []);

  const createEndpoint = async () => {
    const secret = crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase.from('webhook_endpoints').insert({
      name: newName, source: newSource, secret, is_active: true,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Created', description: 'Webhook endpoint added' }); load(); }
  };

  const createOutbound = async () => {
    if (!newOutUrl) return;
    const { error } = await supabase.from('outbound_webhooks').insert({
      name: newOutName, url: newOutUrl,
      event_types: newOutEvents.split(',').map(s => s.trim()).filter(Boolean),
      is_active: true,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Created', description: 'n8n webhook saved' }); setNewOutUrl(''); load(); }
  };

  const deleteEndpoint = async (id: string) => {
    await supabase.from('webhook_endpoints').delete().eq('id', id); load();
  };
  const deleteOutbound = async (id: string) => {
    await supabase.from('outbound_webhooks').delete().eq('id', id); load();
  };

  const testOutbound = async (url: string) => {
    const { data, error } = await supabase.functions.invoke('n8n-event-dispatcher', {
      body: { event_type: 'test.ping', data: { message: 'Hello from TenderAlert', timestamp: new Date().toISOString() } },
    });
    if (error) toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    else toast({ title: 'Sent', description: `Dispatched to ${data?.dispatched || 0} webhook(s)` });
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Pasted to clipboard' });
  };

  const buildWebhookUrl = (source: string) =>
    `https://${PROJECT_REF}.supabase.co/functions/v1/browse-ai-webhook?source=${source}`;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold">Webhooks & Integrations</h1>
        <p className="text-muted-foreground">Manage Browse AI ingestion endpoints and n8n outbound automation.</p>
      </div>

      {/* INBOUND */}
      <Card>
        <CardHeader>
          <CardTitle>Inbound Webhooks (Browse AI → TenderAlert)</CardTitle>
          <CardDescription>
            Create one endpoint per data source. Paste the URL into Browse AI's "Webhooks" integration and add the secret as header <code className="text-xs bg-muted px-1 rounded">x-webhook-secret</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div>
              <Label>Source slug (URL param)</Label>
              <Input value={newSource} onChange={e => setNewSource(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="mygov" />
            </div>
            <div className="flex items-end">
              <Button onClick={createEndpoint} className="w-full"><Plus className="w-4 h-4 mr-2" />Create endpoint</Button>
            </div>
          </div>

          <div className="space-y-3">
            {endpoints.map(ep => (
              <div key={ep.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{ep.name}</div>
                    <Badge variant={ep.is_active ? 'default' : 'secondary'}>{ep.source}</Badge>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteEndpoint(ep.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <Label className="text-xs">Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={buildWebhookUrl(ep.source)} className="font-mono text-xs" />
                      <Button size="sm" variant="outline" onClick={() => copy(buildWebhookUrl(ep.source))}><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Secret (header: x-webhook-secret)</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={ep.secret} className="font-mono text-xs" type="password" />
                      <Button size="sm" variant="outline" onClick={() => copy(ep.secret)}><Copy className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total received: {ep.total_received} · Last: {ep.last_received_at ? new Date(ep.last_received_at).toLocaleString() : 'never'}
                  </div>
                </div>
              </div>
            ))}
            {endpoints.length === 0 && <p className="text-sm text-muted-foreground">No endpoints yet. Create one above for MyGov.</p>}
          </div>
        </CardContent>
      </Card>

      {/* OUTBOUND */}
      <Card>
        <CardHeader>
          <CardTitle>Outbound Webhooks (TenderAlert → n8n)</CardTitle>
          <CardDescription>
            Lovable will POST events to these URLs (e.g. n8n trigger nodes). Use event types to filter, or <code className="text-xs bg-muted px-1 rounded">*</code> for all.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={newOutName} onChange={e => setNewOutName(e.target.value)} />
            </div>
            <div>
              <Label>n8n Webhook URL</Label>
              <Input value={newOutUrl} onChange={e => setNewOutUrl(e.target.value)} placeholder="https://n8n.example.com/webhook/..." />
            </div>
            <div className="md:col-span-2">
              <Label>Event types (comma-separated, or *)</Label>
              <Input value={newOutEvents} onChange={e => setNewOutEvents(e.target.value)} />
            </div>
          </div>
          <Button onClick={createOutbound}><Plus className="w-4 h-4 mr-2" />Add n8n webhook</Button>

          <div className="space-y-3">
            {outbound.map(o => (
              <div key={o.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-xs text-muted-foreground truncate font-mono">{o.url}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(o.event_types || []).map((e: string) => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Sent: {o.total_sent} · Last: {o.last_triggered_at ? new Date(o.last_triggered_at).toLocaleString() : 'never'}</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => testOutbound(o.url)}><Send className="w-4 h-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteOutbound(o.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
            {outbound.length === 0 && <p className="text-sm text-muted-foreground">No outbound webhooks configured.</p>}
          </div>
        </CardContent>
      </Card>

      {/* LOGS */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Inbound Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {logs.map(l => (
              <div key={l.id} className="flex items-center justify-between border-b py-2">
                <div>
                  <Badge variant={l.status === 'success' ? 'default' : l.status === 'unauthorized' ? 'destructive' : 'secondary'}>{l.status}</Badge>
                  <span className="ml-2 font-medium">{l.source}</span>
                  <span className="ml-2 text-muted-foreground">saved {l.items_saved}/{l.items_processed}</span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</span>
              </div>
            ))}
            {logs.length === 0 && <p className="text-muted-foreground">No webhook activity yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
