import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Mail,
  Table2,
  MessageSquare,
  Hash,
  Send,
  Webhook,
  Plus,
  Trash2,
  Power,
  Linkedin,
  CheckCircle2,
} from "lucide-react";

type Integration = {
  id: string;
  name: string;
  provider: string;
  webhook_url: string;
  events: string[];
  is_active: boolean;
  last_triggered_at: string | null;
  last_status: string | null;
  last_error: string | null;
  delivery_count: number;
  failure_count: number;
};

type AppGuide = {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  blurb: string;
  cost: string;
  needsWebhook: boolean;
  steps: string[];
  placeholder?: string;
};

const APPS: AppGuide[] = [
  {
    id: "gmail",
    name: "Gmail / Email",
    icon: Mail,
    blurb: "Tender alerts and deadline reminders straight to your inbox.",
    cost: "Free — built in",
    needsWebhook: false,
    steps: [
      "Open the Preferences tab and switch on Email Notifications.",
      "Alerts go to the email address you signed up with.",
      "Check your Promotions or Spam tab the first time, and mark the message as 'Not spam' so future alerts land in your inbox.",
    ],
  },
  {
    id: "google_sheets",
    name: "Google Sheets",
    icon: Table2,
    blurb: "Every matching tender added as a new row in your own spreadsheet.",
    cost: "Free",
    needsWebhook: true,
    placeholder: "https://script.google.com/macros/s/.../exec",
    steps: [
      "Create a new Google Sheet with headers: Title, Organisation, County, Category, Deadline, Budget, Link.",
      "Click Extensions → Apps Script and paste a doPost(e) script that appends JSON.parse(e.postData.contents).tender to the sheet.",
      "Click Deploy → New deployment → Web app, set 'Who has access' to Anyone, and copy the web app URL.",
      "Paste that URL below as the webhook URL, then press Test.",
    ],
  },
  {
    id: "slack",
    name: "Slack",
    icon: Hash,
    blurb: "Alerts posted into the Slack channel your bid team uses.",
    cost: "Free",
    needsWebhook: true,
    placeholder: "https://hooks.slack.com/services/T000/B000/XXXX",
    steps: [
      "Go to api.slack.com/apps and create an app for your workspace.",
      "Open Incoming Webhooks, turn them on, and click 'Add New Webhook to Workspace'.",
      "Pick the channel that should receive tender alerts and copy the webhook URL.",
      "Paste it below and press Test — a sample tender should appear in the channel.",
    ],
  },
  {
    id: "discord",
    name: "Discord",
    icon: MessageSquare,
    blurb: "Alerts posted to a channel in your Discord server.",
    cost: "Free",
    needsWebhook: true,
    placeholder: "https://discord.com/api/webhooks/...",
    steps: [
      "Open your Discord server → Channel settings → Integrations → Webhooks.",
      "Click New Webhook, name it TenderAlert and choose the channel.",
      "Copy the webhook URL and paste it below, then press Test.",
    ],
  },
  {
    id: "telegram",
    name: "Telegram (your own chat)",
    icon: Send,
    blurb: "Alerts sent to your personal Telegram chat or your own group.",
    cost: "Free",
    needsWebhook: true,
    placeholder: "https://api.telegram.org/bot<token>/sendMessage?chat_id=<id>",
    steps: [
      "Message @BotFather on Telegram and run /newbot to get a bot token.",
      "Start a chat with your new bot, then open api.telegram.org/bot<token>/getUpdates to find your chat id.",
      "Paste the sendMessage URL below with your token and chat id filled in, then press Test.",
      "Prefer zero setup? Just join our public channel @supplychain_coded instead.",
    ],
  },
  {
    id: "webhook",
    name: "Custom webhook / automation",
    icon: Webhook,
    blurb: "Send tender events to n8n, Zapier, Make, your CRM or your own AI agent.",
    cost: "Free",
    needsWebhook: true,
    placeholder: "https://hooks.zapier.com/hooks/catch/...",
    steps: [
      "In n8n, Zapier or Make, create a workflow starting with a Webhook / Catch Hook trigger.",
      "Copy the trigger URL it gives you and paste it below.",
      "Press Test — the sample payload teaches the workflow the field names.",
      "Add an optional API key below if your endpoint requires an Authorization header.",
    ],
  },
];

const EVENTS = ["tender.matched", "tender.created", "rfq.created", "deadline.approaching"];

export default function ConnectAppsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<AppGuide | null>(null);
  const [form, setForm] = useState({ name: "", webhook_url: "", api_key: "", events: ["tender.matched"] as string[] });

  // LinkedIn shout-out opt-in
  const [liOptIn, setLiOptIn] = useState(false);
  const [liUrl, setLiUrl] = useState("");
  const [savingLi, setSavingLi] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: integrations }, { data: profile }] = await Promise.all([
      supabase
        .from("user_integrations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("linkedin_tag_opt_in, linkedin_profile_url")
        .eq("id", user.id)
        .maybeSingle(),
    ]);
    setItems((integrations as Integration[]) || []);
    if (profile) {
      setLiOptIn(Boolean((profile as any).linkedin_tag_opt_in));
      setLiUrl(((profile as any).linkedin_profile_url as string) || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const openGuide = (app: AppGuide) => {
    setActive(app);
    setForm({ name: app.name, webhook_url: "", api_key: "", events: ["tender.matched"] });
  };

  const save = async () => {
    if (!user || !active) return;
    const url = form.webhook_url.trim();
    if (!url) return toast({ title: "Add the URL from step above", variant: "destructive" });
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return toast({ title: "That doesn't look like a valid link", variant: "destructive" });
    }
    if (parsed.protocol !== "https:") {
      return toast({ title: "The link must start with https://", variant: "destructive" });
    }
    const { error } = await supabase.from("user_integrations").insert({
      user_id: user.id,
      name: form.name.trim() || active.name,
      provider: active.id,
      webhook_url: url,
      api_key: form.api_key.trim() || null,
      events: form.events.length ? form.events : ["tender.matched"],
    });
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: `${active.name} connected` });
    setActive(null);
    load();
  };

  const sendTest = async (it: Integration) => {
    toast({ title: "Sending a test…" });
    const { data, error } = await supabase.functions.invoke("user-integration-dispatcher", {
      body: { action: "test", integration_id: it.id },
    });
    if (error) return toast({ title: "Test failed", description: error.message, variant: "destructive" });
    toast({ title: data?.ok ? "Test delivered ✓" : "Test failed", description: data?.detail || "" });
    load();
  };

  const toggle = async (it: Integration) => {
    await supabase.from("user_integrations").update({ is_active: !it.is_active }).eq("id", it.id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this connection?")) return;
    await supabase.from("user_integrations").delete().eq("id", id);
    load();
  };

  const saveLinkedIn = async () => {
    if (!user) return;
    setSavingLi(true);
    const { error } = await supabase
      .from("profiles")
      .update({ linkedin_tag_opt_in: liOptIn, linkedin_profile_url: liUrl.trim() || null })
      .eq("id", user.id);
    setSavingLi(false);
    if (error) return toast({ title: "Could not save", description: error.message, variant: "destructive" });
    toast({ title: liOptIn ? "You'll be mentioned in the monthly post" : "You won't be mentioned" });
  };

  if (!user) return <p className="text-muted-foreground">Sign in to connect your apps.</p>;

  const connectedProviders = new Set(items.map((i) => i.provider));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Connect your apps</h2>
        <p className="text-sm text-muted-foreground">
          Get matching tenders wherever you already work. All of these are free to set up.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {APPS.map((app) => {
          const Icon = app.icon;
          const isConnected = connectedProviders.has(app.id);
          return (
            <Card key={app.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className="h-5 w-5 text-primary" />
                  {app.name}
                  {isConnected && (
                    <Badge variant="secondary" className="ml-auto gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{app.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{app.cost}</span>
                <Button size="sm" variant={isConnected ? "outline" : "default"} onClick={() => openGuide(app)}>
                  {app.needsWebhook ? (isConnected ? "Add another" : "Connect") : "How to switch on"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* LinkedIn monthly shout-out consent */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Linkedin className="h-5 w-5 text-primary" />
            Monthly LinkedIn welcome post
          </CardTitle>
          <CardDescription>
            Once a month we publish a post welcoming new members. You decide whether your name and LinkedIn
            profile appear in it — it is off unless you switch it on.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Mention me in the monthly post</p>
              <p className="text-sm text-muted-foreground">
                Free visibility for your business in front of buyers and partners.
              </p>
            </div>
            <Switch checked={liOptIn} onCheckedChange={setLiOptIn} />
          </div>
          {liOptIn && (
            <div className="space-y-2">
              <Label htmlFor="li-url">Your LinkedIn profile or company page (optional)</Label>
              <Input
                id="li-url"
                value={liUrl}
                onChange={(e) => setLiUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-name"
              />
            </div>
          )}
          <Button onClick={saveLinkedIn} disabled={savingLi}>
            {savingLi ? "Saving…" : "Save choice"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing connections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your connections ({items.length})</CardTitle>
          <CardDescription>Delivery status updates each time we send an alert.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nothing connected yet. Pick an app above to get started.
            </p>
          )}
          {items.map((it) => (
            <div key={it.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{it.name}</span>
                    <Badge variant="outline">{it.provider}</Badge>
                    {it.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Paused</Badge>}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{it.webhook_url}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {it.delivery_count} delivered · {it.failure_count} failed
                    {it.last_triggered_at && ` · last ${new Date(it.last_triggered_at).toLocaleString()}`}
                  </p>
                  {it.last_error && <p className="mt-1 text-xs text-destructive">{it.last_error}</p>}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button size="sm" variant="outline" onClick={() => sendTest(it)}>
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Test
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggle(it)}>
                    <Power className="mr-1 h-3.5 w-3.5" />
                    {it.is_active ? "Pause" : "Enable"}
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => remove(it.id)}>
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Setup guide dialog */}
      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{active?.name}</DialogTitle>
            <DialogDescription>{active?.blurb}</DialogDescription>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                {active.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>

              {active.needsWebhook && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="conn-name">Name this connection</Label>
                    <Input
                      id="conn-name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conn-url">URL from the steps above</Label>
                    <Input
                      id="conn-url"
                      value={form.webhook_url}
                      onChange={(e) => setForm({ ...form, webhook_url: e.target.value })}
                      placeholder={active.placeholder}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conn-key">API key (only if your endpoint needs one)</Label>
                    <Input
                      id="conn-key"
                      type="password"
                      value={form.api_key}
                      onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>What should we send?</Label>
                    <div className="flex flex-wrap gap-2">
                      {EVENTS.map((ev) => {
                        const on = form.events.includes(ev);
                        return (
                          <Badge
                            key={ev}
                            variant={on ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() =>
                              setForm({
                                ...form,
                                events: on ? form.events.filter((e) => e !== ev) : [...form.events, ev],
                              })
                            }
                          >
                            {ev}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <Button onClick={save} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Save connection
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
