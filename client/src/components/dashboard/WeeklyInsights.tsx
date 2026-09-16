import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Lightbulb, CalendarClock, Coins, Gauge, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/** Weekly rotating, action-oriented tips for Kenyan bidders. */
const TIPS: { title: string; body: string; action: string }[] = [
  {
    title: "Check your AGPO certificate expiry today",
    body: "AGPO certificates run for two years. An expired certificate disqualifies an otherwise winning bid at the preliminary stage.",
    action: "Diarise renewal 60 days before expiry so you never lose a reserved tender.",
  },
  {
    title: "Bid where fewer people bid",
    body: "Tenders outside Nairobi and in specialised categories routinely attract a third of the bidders that generic supply tenders do.",
    action: "Add two counties you can genuinely deliver in to your preferences and watch the match list change.",
  },
  {
    title: "Start with the mandatory documents, not the price",
    body: "Most Kenyan bids fail on preliminary compliance — tax compliance certificate, CR12, business permit, audited accounts — long before price is opened.",
    action: "Keep one folder with all statutory documents dated within the last six months.",
  },
  {
    title: "Price against the award history, not a guess",
    body: "Awarded amounts in your category tell you the realistic band buyers accept. Bidding far below it invites an abnormally-low-bid query.",
    action: "Open a similar past award before you finalise your rate build-up.",
  },
  {
    title: "Ask questions before the clarification deadline",
    body: "Clarifications are answered to all bidders in writing and often reveal how the buyer will score the bid.",
    action: "Send at least one written clarification on any tender you seriously intend to win.",
  },
  {
    title: "Build a consortium for tenders one size above you",
    body: "Turnover and past-experience thresholds are the most common reason small firms are locked out of bigger work.",
    action: "Partner with a firm whose capacity complements yours and register the arrangement properly.",
  },
  {
    title: "Never pay for a tender document you can download free",
    body: "MyGov, eGP and county portals publish documents at no cost. Any 'agent' charging for access is reselling public information.",
    action: "Use the source link on every tender here to go straight to the official portal.",
  },
  {
    title: "Watch your bid bond validity",
    body: "A bid security that expires before the tender validity period ends is an automatic disqualification.",
    action: "Match the bond validity to the tender validity plus 30 days.",
  },
];

function isoWeek(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function kes(n: number) {
  if (!n) return "—";
  if (n >= 1_000_000_000) return `KES ${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `KES ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `KES ${(n / 1_000).toFixed(0)}K`;
  return `KES ${n}`;
}

export function WeeklyInsights() {
  const { user } = useAuth();
  const tip = TIPS[isoWeek(new Date()) % TIPS.length];

  const { data: prefs } = useQuery({
    queryKey: ["weekly-insights-prefs", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_preferences")
        .select("sectors, counties")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data as { sectors: string[] | null; counties: string[] | null } | null;
    },
  });

  const { data: kpis } = useQuery({
    queryKey: ["weekly-insights", prefs?.counties, prefs?.sectors],
    queryFn: async () => {
      const today = new Date();
      const in7 = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);
      const in21 = new Date(today.getTime() + 21 * 86400000).toISOString().slice(0, 10);
      const last7 = new Date(today.getTime() - 7 * 86400000).toISOString();

      let q = supabase
        .from("tenders")
        .select("id, budget_estimate, deadline, created_at, category, location")
        .eq("status", "active")
        .gte("deadline", today.toISOString().slice(0, 10))
        .limit(1000);

      const counties = prefs?.counties ?? [];
      const sectors = prefs?.sectors ?? [];
      if (counties.length) q = q.or(counties.map((c) => `location.ilike.%${c}%`).join(","));

      const { data, error } = await q;
      if (error) throw error;

      let rows = data || [];
      if (sectors.length) {
        const matched = rows.filter((r) =>
          sectors.some((s) => (r.category || "").toLowerCase().includes(s.split(" ")[0].toLowerCase())),
        );
        if (matched.length) rows = matched;
      }

      const openValue = rows.reduce((sum, r) => sum + (r.budget_estimate || 0), 0);
      const newThisWeek = rows.filter((r) => r.created_at && r.created_at >= last7).length;
      const readyToBid = rows.filter((r) => r.deadline >= in7 && r.deadline <= in21).length;
      const closingSoon = rows.filter((r) => r.deadline < in7).length;

      return {
        matched: rows.length,
        openValue,
        newThisWeek,
        readyToBid,
        closingSoon,
        tailored: counties.length > 0 || sectors.length > 0,
      };
    },
  });

  return (
    <section className="mb-8 grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-primary" />
            Your numbers this week
          </CardTitle>
          <CardDescription>
            {kpis?.tailored
              ? "Based on the counties and sectors in your preferences."
              : "Across all live tenders — set your preferences to make these numbers yours."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Open to you</span>
              </div>
              <p className="text-2xl font-bold">{kpis?.matched ?? "—"}</p>
              <p className="text-xs text-muted-foreground">{kpis?.newThisWeek ?? 0} added in 7 days</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Coins className="h-4 w-4" />
                <span className="text-xs">Value on the table</span>
              </div>
              <p className="text-2xl font-bold">{kpis ? kes(kpis.openValue) : "—"}</p>
              <p className="text-xs text-muted-foreground">Published budgets only</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span className="text-xs">Enough time to bid</span>
              </div>
              <p className="text-2xl font-bold">{kpis?.readyToBid ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Closing in 7–21 days</p>
            </div>
            <div>
              <div className="mb-1 flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="h-4 w-4" />
                <span className="text-xs">Act now</span>
              </div>
              <p className="text-2xl font-bold text-destructive">{kpis?.closingSoon ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Closing within 7 days</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/smart-matches">
                See the matches <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            {!kpis?.tailored && (
              <Button size="sm" variant="outline" asChild>
                <Link href="/settings">Set my counties and sectors</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-500/30 bg-amber-50/50 dark:bg-amber-900/10">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-amber-600" />
            Tip of the week
          </CardTitle>
          <Badge variant="outline" className="w-fit">
            Week {isoWeek(new Date())}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-semibold">{tip.title}</p>
          <p className="text-sm text-muted-foreground">{tip.body}</p>
          <p className="text-sm font-medium">{tip.action}</p>
        </CardContent>
      </Card>
    </section>
  );
}

export default WeeklyInsights;
