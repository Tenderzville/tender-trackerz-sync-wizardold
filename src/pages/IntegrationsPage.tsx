import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Check, Copy, ExternalLink, Sheet, MessageSquare, Workflow, Bot, Zap } from 'lucide-react';

const WEBHOOK_PAYLOAD_SAMPLE = `{
  "event": "tender.created",
  "tender": {
    "id": 1234,
    "title": "Supply of Office Stationery",
    "organization": "Ministry of Education",
    "category": "Goods",
    "location": "Nairobi",
    "deadline": "2026-06-30",
    "budget_estimate": 1500000,
    "tender_number": "MOE/123/2026",
    "source_url": "https://tenders.go.ke/...",
    "scraped_from": "tenders.go.ke"
  }
}`;

function CopyBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      {label && <div className="text-xs text-muted-foreground mb-1">{label}</div>}
      <pre className="bg-muted text-foreground text-xs rounded-md p-3 overflow-x-auto border">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 h-7"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-8">
      <header className="space-y-3">
        <Badge variant="secondary" className="w-fit">For builders & ops teams</Badge>
        <h1 className="text-3xl lg:text-4xl font-bold">Integrations</h1>
        <p className="text-muted-foreground text-lg">
          Pipe TenderAlert events into the tools you already use — Google Sheets, Excel, Slack,
          n8n, Zapier, or your own AI agent. Set up once, never miss a tender again.
        </p>
        <div className="flex gap-2 pt-2">
          <Button asChild>
            <a href="/admin/webhooks">
              <Zap className="w-4 h-4 mr-2" /> Create a webhook
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href="mailto:hello@tenderalert.co.ke">Talk to us</a>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Every time a new tender is added, an RFQ is posted, or a user signs up, we POST a
            JSON payload to your URL. Point it anywhere that accepts a webhook.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CopyBlock label="Example payload" code={WEBHOOK_PAYLOAD_SAMPLE} />
        </CardContent>
      </Card>

      <Tabs defaultValue="sheets" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full h-auto">
          <TabsTrigger value="sheets"><Sheet className="w-4 h-4 mr-2" />Google Sheets / Excel</TabsTrigger>
          <TabsTrigger value="slack"><MessageSquare className="w-4 h-4 mr-2" />Slack / Teams</TabsTrigger>
          <TabsTrigger value="n8n"><Workflow className="w-4 h-4 mr-2" />n8n / Zapier / Make</TabsTrigger>
          <TabsTrigger value="ai"><Bot className="w-4 h-4 mr-2" />AI Agents</TabsTrigger>
        </TabsList>

        <TabsContent value="sheets" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets (via Zapier or Make)</CardTitle>
              <CardDescription>Append every new tender as a row in a sheet. ~5 minutes to set up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Create a new Zap (or Make scenario) with <strong>Webhook → Catch Hook</strong> as the trigger.</li>
                <li>Copy the generated webhook URL.</li>
                <li>Paste it into TenderAlert at <a href="/admin/webhooks" className="text-primary underline">Admin → Webhooks</a>, subscribed to <code>tender.created</code>.</li>
                <li>Add a <strong>Google Sheets → Create Spreadsheet Row</strong> action, mapping the fields below.</li>
              </ol>
              <CopyBlock label="Suggested header row" code={`title,organization,category,location,deadline,budget_estimate,tender_number,source_url`} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Excel (Power Automate)</CardTitle>
              <CardDescription>Native Microsoft 365 connector — no third party needed.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>In Power Automate, create a flow with trigger <strong>"When a HTTP request is received"</strong>.</li>
                <li>Use this JSON schema for the body:</li>
              </ol>
              <CopyBlock code={`{
  "type": "object",
  "properties": {
    "event": { "type": "string" },
    "tender": {
      "type": "object",
      "properties": {
        "title": { "type": "string" },
        "organization": { "type": "string" },
        "deadline": { "type": "string" },
        "budget_estimate": { "type": "number" },
        "source_url": { "type": "string" }
      }
    }
  }
}`} />
              <ol start={3} className="list-decimal list-inside space-y-1 text-sm mt-2">
                <li>Add <strong>Excel Online → Add a row into a table</strong> and map fields.</li>
                <li>Save, copy the generated HTTP POST URL, paste it into Admin → Webhooks.</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="slack" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Slack incoming webhook</CardTitle>
              <CardDescription>Post a formatted message to a channel whenever a matching tender drops.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>In Slack, go to <a className="text-primary underline" href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noreferrer">api.slack.com/messaging/webhooks <ExternalLink className="inline w-3 h-3" /></a> and create an incoming webhook.</li>
                <li>Because Slack expects <code>{`{ "text": "..." }`}</code>, route through Zapier/Make or a small transformer (n8n example below).</li>
              </ol>
              <CopyBlock label="Microsoft Teams version" code={`POST https://outlook.office.com/webhook/<your-teams-webhook>
Content-Type: application/json

{
  "@type": "MessageCard",
  "text": "**New tender:** {{tender.title}}  •  Deadline {{tender.deadline}}  •  [Open]({{tender.source_url}})"
}`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="n8n" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>n8n / Zapier / Make</CardTitle>
              <CardDescription>Trigger on TenderAlert events and chain any of 400+ apps.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>In n8n: add a <strong>Webhook</strong> node, set HTTP method to POST, copy the production URL.</li>
                <li>Paste into Admin → Webhooks, choose events (e.g. <code>tender.created</code>, <code>rfq.created</code>).</li>
                <li>Chain any downstream node: Sheets, Slack, Notion, HubSpot, Email, OpenAI, etc.</li>
              </ol>
              <CopyBlock label="n8n Slack formatter (Function node)" code={`return [{
  json: {
    text: \`*\${$json.tender.title}*\\n\${$json.tender.organization} • Deadline \${$json.tender.deadline}\\n\${$json.tender.source_url}\`
  }
}];`} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom AI agents (LangChain, OpenAI Assistants, custom GPTs)</CardTitle>
              <CardDescription>Feed live tenders into your agent for autonomous bid evaluation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Stand up a small HTTP endpoint (Cloud Function, Lambda, Vercel route) that receives our webhook.</li>
                <li>From the endpoint, call your agent with the tender JSON in the prompt context.</li>
                <li>Use the returned analysis to auto-tag, auto-assign, or push to your CRM.</li>
              </ol>
              <CopyBlock label="Python (FastAPI) example" code={`from fastapi import FastAPI, Request
from openai import OpenAI

app = FastAPI()
client = OpenAI()

@app.post("/tenderalert")
async def ingest(req: Request):
    body = await req.json()
    tender = body["tender"]
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a bid analyst for a Kenyan SME."},
            {"role": "user", "content": f"Should we bid? {tender}"},
        ],
    )
    return {"recommendation": completion.choices[0].message.content}`} />
              <p className="text-xs text-muted-foreground">
                Remember: TenderAlert provides automated data collection and bid-readiness signals.
                Final bid decisions remain with the human team — see our AI disclaimer in the Terms.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Available events</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          {[
            ['tender.created', 'A new tender was ingested and passed quality filters.'],
            ['tender.updated', 'A tracked tender changed (deadline, status, budget).'],
            ['rfq.created', 'A buyer posted a new Request for Quote.'],
            ['rfq.quote.submitted', 'A supplier submitted a quote on your RFQ.'],
            ['user.signup', 'A new account was created.'],
            ['subscription.upgraded', 'A user upgraded to a paid plan.'],
          ].map(([name, desc]) => (
            <div key={name} className="border rounded-md p-3">
              <code className="text-primary text-xs font-semibold">{name}</code>
              <p className="text-muted-foreground mt-1">{desc}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-primary/30">
        <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold">Need a connector we don't list?</p>
            <p className="text-sm text-muted-foreground">HubSpot, Salesforce, Notion, Airtable, custom DB — we can help.</p>
          </div>
          <Button asChild>
            <a href="mailto:hello@tenderalert.co.ke?subject=Integration%20request">Request an integration</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
