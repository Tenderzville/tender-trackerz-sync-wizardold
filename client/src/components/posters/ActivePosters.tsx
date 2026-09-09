import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getViewUrl } from "@/lib/storage";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface PosterView {
  id: number;
  title: string;
  description: string | null;
  link_url: string | null;
  county: string | null;
  url: string;
}

export function ActivePosters({ className }: { className?: string }) {
  const { data: posters = [] } = useQuery({
    queryKey: ["active-posters"],
    queryFn: async (): Promise<PosterView[]> => {
      const nowIso = new Date().toISOString();
      const { data, error } = await (supabase as any)
        .from("tender_posters")
        .select("*")
        .eq("is_active", true)
        .lte("starts_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;

      const rows = (data || []).filter((p: any) => !p.ends_at || p.ends_at > nowIso);
      const out: PosterView[] = [];
      for (const p of rows) {
        try {
          out.push({
            id: p.id,
            title: p.title,
            description: p.description,
            link_url: p.link_url,
            county: p.county,
            url: await getViewUrl("tender-posters", p.image_path),
          });
        } catch {
          /* skip unreadable poster */
        }
      }
      return out;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (posters.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="mb-4 text-xl font-semibold">Featured tender notices</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posters.map((p) => {
          const inner = (
            <Card className="overflow-hidden h-full transition-shadow hover:shadow-lg">
              <img src={p.url} alt={p.title} loading="lazy" className="h-40 w-full object-cover" />
              <div className="space-y-1 p-4">
                <Badge variant="outline">{p.county || "National"}</Badge>
                <h3 className="font-medium leading-snug">{p.title}</h3>
                {p.description && (
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                )}
              </div>
            </Card>
          );
          return p.link_url ? (
            <a key={p.id} href={p.link_url} target="_blank" rel="noopener noreferrer">
              {inner}
            </a>
          ) : (
            <div key={p.id}>{inner}</div>
          );
        })}
      </div>
    </section>
  );
}
