import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Radio } from "lucide-react";

type TickerTender = {
  id: number;
  title: string;
  location: string | null;
  organization: string | null;
  deadline: string;
};

const KENYA_COUNTIES = [
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

export function TenderTicker() {
  const { data } = useQuery({
    queryKey: ["landing-ticker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tenders")
        .select("id,title,location,organization,deadline")
        .eq("status", "active")
        .gt("deadline", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(24);
      if (error) throw error;
      return (data ?? []) as TickerTender[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = data ?? [];
  if (items.length === 0) return null;

  const loop = [...items, ...items];

  return (
    <div
      className="w-full border-y border-border bg-card/60 backdrop-blur overflow-hidden"
      aria-label="Live tender headlines from Kenyan counties"
    >
      <div className="container mx-auto flex items-stretch">
        <div className="hidden sm:flex items-center gap-2 pr-4 py-3 shrink-0 border-r border-border">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
          <span className="text-xs font-semibold uppercase tracking-widest text-primary flex items-center gap-1">
            <Radio className="h-3.5 w-3.5" /> Live tenders
          </span>
        </div>

        <div className="group relative flex-1 overflow-hidden py-3">
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
        </div>
      </div>
    </div>
  );
}

export default TenderTicker;
