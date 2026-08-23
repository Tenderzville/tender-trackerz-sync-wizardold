import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Radio, Check, ChevronDown, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useCountyFocus, type TenderScope } from "@/hooks/use-county-focus";

type TickerTender = {
  id: number;
  title: string;
  location: string | null;
  organization: string | null;
  deadline: string;
};

export const KENYA_COUNTIES = [
  "Mombasa","Kwale","Kilifi","Tana River","Lamu","Taita Taveta","Garissa","Wajir","Mandera","Marsabit",
  "Isiolo","Meru","Tharaka Nithi","Embu","Kitui","Machakos","Makueni","Nyandarua","Nyeri","Kirinyaga",
  "Murang'a","Kiambu","Turkana","West Pokot","Samburu","Trans Nzoia","Uasin Gishu","Elgeyo Marakwet",
  "Nandi","Baringo","Laikipia","Nakuru","Narok","Kajiado","Kericho","Bomet","Kakamega","Vihiga",
  "Bungoma","Busia","Siaya","Kisumu","Homa Bay","Migori","Kisii","Nyamira","Nairobi",
];

function detectCounty(t: TickerTender): string {
  const haystack = `${t.location ?? ""} ${t.organization ?? ""} ${t.title}`.toLowerCase();
  const hit = KENYA_COUNTIES.find((c) => haystack.includes(c.toLowerCase()));
  return hit ?? "National";
}

function daysLeft(deadline: string): number {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000));
}

function CountyPicker() {
  const { counties, setCounties, toggleCounty } = useCountyFocus();
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () => KENYA_COUNTIES.filter((c) => c.toLowerCase().includes(search.trim().toLowerCase())),
    [search],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 text-xs">
          <MapPin className="h-3.5 w-3.5" />
          {counties.length === 0 ? "All counties" : `${counties.length} selected`}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search counties…"
          className="h-8 mb-2"
          aria-label="Search Kenyan counties"
        />
        <div className="max-h-56 overflow-y-auto pr-1">
          {filtered.map((c) => {
            const active = counties.includes(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => toggleCounty(c)}
                aria-pressed={active}
                className="flex w-full items-center justify-between rounded px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span>{c}</span>
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="px-2 py-3 text-sm text-muted-foreground">No county matches.</p>
          )}
        </div>
        {counties.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={() => setCounties([])}
          >
            <X className="mr-1 h-3.5 w-3.5" /> Clear selection
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function TenderTicker() {
  const { scope, setScope, counties, toggleCounty } = useCountyFocus();

  const { data } = useQuery({
    queryKey: ["landing-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("id,title,location,organization,deadline")
        .eq("status", "active")
        .gt("deadline", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as TickerTender[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const all = data ?? [];

  const items = useMemo(() => {
    const tagged = all.map((t) => ({ ...t, county: detectCounty(t) }));
    let list = tagged;
    if (scope === "national") list = tagged.filter((t) => t.county === "National");
    if (scope === "county") list = tagged.filter((t) => t.county !== "National");
    if (counties.length > 0 && scope !== "national") {
      list = list.filter((t) => counties.includes(t.county));
    }
    return list.slice(0, 24);
  }, [all, scope, counties]);

  if (all.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div
      className="w-full border-y border-border bg-card/60 backdrop-blur overflow-hidden"
      aria-label="Live tender headlines from Kenyan counties"
    >
      <div className="container mx-auto flex flex-wrap items-center gap-3 pt-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-1">
            <Radio className="h-3.5 w-3.5" /> Live tenders
          </span>
        </div>

        <Tabs value={scope} onValueChange={(v) => setScope(v as TenderScope)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 py-1">All</TabsTrigger>
            <TabsTrigger value="national" className="text-xs px-2.5 py-1">National</TabsTrigger>
            <TabsTrigger value="county" className="text-xs px-2.5 py-1">County</TabsTrigger>
          </TabsList>
        </Tabs>

        {scope !== "national" && <CountyPicker />}

        {scope !== "national" && counties.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {counties.map((c) => (
              <Badge
                key={c}
                variant="secondary"
                className="cursor-pointer text-[11px]"
                onClick={() => toggleCounty(c)}
              >
                {c} <X className="ml-1 h-3 w-3" />
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="container mx-auto">
        <div className="group relative overflow-hidden py-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No live tenders match this filter right now. Try another county or switch tabs.
            </p>
          ) : (
            <div className="flex w-max gap-8 animate-[ticker_60s_linear_infinite] group-hover:[animation-play-state:paused]">
              {loop.map((t, i) => (
                <a
                  key={`${t.id}-${i}`}
                  href="/auth"
                  className="flex items-center gap-2 text-sm whitespace-nowrap hover:text-primary transition-colors"
                >
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <MapPin className="h-3 w-3" />
                    {detectCounty(t)}
                  </span>
                  <span className="font-medium text-foreground/90">
                    {t.title.length > 78 ? `${t.title.slice(0, 78)}…` : t.title}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    closes in {daysLeft(t.deadline)}d
                  </span>
                  <span className="text-border">•</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TenderTicker;
