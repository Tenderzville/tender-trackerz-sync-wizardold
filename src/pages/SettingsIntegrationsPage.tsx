import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Send, Webhook, Power, ExternalLink } from 'lucide-react';

type Integration = {
  id: string;
  name: string;
  provider: string;
  webhook_url: string;
  api_key: string | null;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  last_status: string | null;
  last_error: string | null;
  delivery_count: number;
  failure_count: number;
};

const PROVIDERS = [
  { value: 'zapier', label: 'Zapier' },
  { value: 'n8n', label: 'n8n' },
  { value: 'make', label: 'Make.com' },
  { value: 'google_sheets', label: 'Google Sheets (via Zapier/Apps Script)' },
  { value: 'excel', label: 'Excel / Power Automate' },
  { value: 'slack', label: 'Slack' },
  { value: 'teams', label: 'Microsoft Teams' },
  { value: 'discord', label: 'Discord' },
  { value: 'custom', label: 'Custom API / AI Agent' },
  { value: 'webhook', label: 'Generic Webhook' },
];

const EVENTS = ['tender.matched', 'tender.created', 'rfq.created', 'deadline.approaching'];

export default function SettingsIntegrationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    provider: 'zapier',
    webhook_url: '',
    api_key: '',
    events: ['tender.matched'] as string[],
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return toast({ title: 'Load failed', description: error.message, variant: 'destructive' });
    setItems((data as Integration[]) || []);
  };

  useEffect(() => { load(); }, [user?.id]);

  const create = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.webhook_url.trim()) {
      return toast({ title: 'Missing fields', description: 'Name and webhook URL are required.', variant: 'destructive' });
    }
    try { new URL(form.webhook_url); } catch {
      return toast({ title: 'Invalid URL', variant: 'destructive' });
    }
    const { error } = await supabase.from('user_integrations').insert({
      user_id: user.id,
      name: form.name.trim(),
      provider: form.provider,
      webhook_url: form.webhook_url.trim(),
      api_key: form.api_key.trim() || null,
      events: form.events,
    });
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Integration added' });
    setForm({ name: '', provider: 'zapier', webhook_url: '', api_key: '', events: ['tender.matched'] });
    load();
  };

  const toggle = async (id: string, is_active: boolean) => {
    await supabase.from('user_integrations').update({ is_active: !is_active }).eq('id', id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this integration?')) return;
    await supabase.from('user_integrations').delete().eq('id', id);
    load();
  };

  const sendTest = async (it: Integration) => {
    toast({ title: 'Sending test…' });
    const { data, error } = await supabase.functions.invoke('user-integration-dispatcher', {
      body: { action: 'test', integration_id: it.id },
    });
    if (error) return toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
    toast({ title: data?.ok ? 'Test delivered ✓' : 'Test failed', description: data?.detail || '' });
    load();
  };

  if (!user) return <div className="container mx-auto p-6">Sign in to manage integrations.</div>;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Webhook className="w-7 h-7" /> My Integrations</h1>
        <p className="text-muted-foreground">
          Forward your matched tenders & RFQ events to Zapier, n8n, Google Sheets, Slack, your own AI agent, or any HTTPS endpoint.
          Need recipes? See the public <a href="/integrations" className="underline text-primary">Integrations directory</a>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add new integration</CardTitle>
          <CardDescription>We POST a JSON payload to your URL whenever the selected events fire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="My Sheets pipeline" />
            </div>
            <div>
              <Label>Provider</Label>
              <Select value={form.provider} onValueChange={v => setForm({ ...form, provider: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PROVIDERS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Webhook URL <span className="text-destructive">*</span></Label>
            <Input value={form.webhook_url} onChange={e => setForm({ ...form, webhook_url: e.target.value })} placeholder="https://hooks.zapier.com/hooks/catch/..." />
          </div>
          <div>
            <Label>API Key / Bearer Token (optional)</Label>
            <Input type="password" value={form.api_key} onChange={e => setForm({ ...form, api_key: e.target.value })} placeholder="Sent as Authorization: Bearer <key>" />
            <p className="text-xs text-muted-foreground mt-1">Stored encrypted-at-rest. Only sent to your URL.</p>
          </div>
          <div>
            <Label>Events</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {EVENTS.map(ev => {
                const on = form.events.includes(ev);
                return (
                  <Badge key={ev} variant={on ? 'default' : 'outline'} className="cursor-pointer"
                    onClick={() => setForm({ ...form, events: on ? form.events.filter(e => e !== ev) : [...form.events, ev] })}>
                    {ev}
                  </Badge>
                );
              })}
            </div>
          </div>
          <Button onClick={create}><Plus className="w-4 h-4 mr-2" />Add integration</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your integrations ({items.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No integrations yet. Add one above to start receiving tender events.</p>
          )}
          {items.map(it => (
            <div key={it.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{it.name}</span>
                    <Badge variant="outline">{it.provider}</Badge>
                    {it.is_active
                      ? <Badge className="bg-green-500/10 text-green-700 border-green-500/20">Active</Badge>
                      : <Badge variant="secondary">Paused</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-1">{it.webhook_url}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {it.events.map(e => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {it.delivery_count} delivered · {it.failure_count} failed
                    {it.last_triggered_at && ` · last ${new Date(it.last_triggered_at).toLocaleString()}`}
                    {it.last_status && ` · ${it.last_status}`}
                  </p>
                  {it.last_error && <p className="text-xs text-destructive mt-1">{it.last_error}</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => sendTest(it)}><Send className="w-3.5 h-3.5 mr-1" />Test</Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(it.id, it.is_active)}><Power className="w-3.5 h-3.5 mr-1" />{it.is_active ? 'Pause' : 'Enable'}</Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(it.id)}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground border rounded-lg p-4 bg-muted/30">
        <strong>Payload shape:</strong>
        <pre className="mt-2 overflow-x-auto">{`POST {your webhook URL}
Headers: { "Content-Type": "application/json", "Authorization": "Bearer <your api key>" }
Body: {
  "event": "tender.matched",
  "user_id": "...",
  "integration_id": "...",
  "timestamp": "ISO 8601",
  "tender": { id, title, organization, category, location, deadline, budget_estimate, source_url, tender_number }
}`}</pre>
        <a href="/integrations" className="inline-flex items-center gap-1 mt-3 text-primary underline">
          See ready-made recipes <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
