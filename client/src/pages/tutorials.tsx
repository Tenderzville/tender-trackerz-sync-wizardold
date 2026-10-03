import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';
import { toEmbedUrl } from '@/components/admin/DemoVideoManager';
import { PlayCircle, Clock } from 'lucide-react';

export interface Tutorial {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  audience: string;
  duration: string | null;
  youtube_url: string | null;
  sort_order: number;
  is_published: boolean;
}

const AUDIENCES = ['all', 'supplier', 'buyer', 'marketplace'] as const;

export default function TutorialsPage() {
  const [items, setItems] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof AUDIENCES)[number]>('all');
  const [playing, setPlaying] = useState<string | null>(null);

  useEffect(() => {
    (supabase as any).from('tutorials').select('*').eq('is_published', true).order('sort_order')
      .then(({ data }: { data: Tutorial[] | null }) => { setItems(data ?? []); setLoading(false); });
  }, []);

  const shown = items.filter((t) => filter === 'all' || t.audience === filter || t.audience === 'all');
  const videos = items.filter((t) => toEmbedUrl(t.youtube_url ?? '')).map((t) => ({
    '@type': 'VideoObject',
    name: t.title,
    description: t.description ?? t.title,
    embedUrl: toEmbedUrl(t.youtube_url!),
    thumbnailUrl: `https://img.youtube.com/vi/${toEmbedUrl(t.youtube_url!)!.split('/').pop()}/hqdefault.jpg`,
    uploadDate: '2026-10-03',
  }));

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <SEO
        title="Video Tutorials: How to Use TenderAlert"
        description="Short step-by-step videos for Kenyan suppliers and buyers: sign up, set preferences, find tenders, post RFQs and use the marketplace."
        path="/tutorials"
        jsonLd={videos.length ? { '@context': 'https://schema.org', '@graph': videos } : undefined}
      />
      <h1 className="text-3xl font-bold mb-2">Video tutorials</h1>
      <p className="text-muted-foreground mb-6">Short, step-by-step videos to get the most out of TenderAlert.</p>

      <div className="flex flex-wrap gap-2 mb-6">
        {AUDIENCES.map((a) => (
          <Button key={a} size="sm" variant={filter === a ? 'default' : 'outline'} onClick={() => setFilter(a)} className="capitalize">
            {a === 'all' ? 'All' : a}
          </Button>
        ))}
      </div>

      {loading ? <p className="text-muted-foreground">Loading…</p> : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((t) => {
            const embed = toEmbedUrl(t.youtube_url ?? '');
            return (
              <Card key={t.id} className="overflow-hidden flex flex-col">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  {embed && playing === t.id ? (
                    <iframe src={`${embed}?autoplay=1`} title={t.title} className="w-full h-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  ) : embed ? (
                    <button onClick={() => setPlaying(t.id)} className="w-full h-full relative group" aria-label={`Play ${t.title}`}>
                      <img src={`https://img.youtube.com/vi/${embed.split('/').pop()}/hqdefault.jpg`} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <PlayCircle className="absolute inset-0 m-auto h-14 w-14 text-primary-foreground drop-shadow-lg group-hover:scale-110 transition" />
                    </button>
                  ) : (
                    <span className="text-sm text-muted-foreground">Coming soon</span>
                  )}
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="capitalize">{t.audience === 'all' ? 'Everyone' : t.audience}</Badge>
                    {t.duration && <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{t.duration}</span>}
                  </div>
                  <CardTitle className="text-lg">{t.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0"><CardDescription>{t.description}</CardDescription></CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <p className="mt-8 text-sm text-muted-foreground">Prefer reading? See our <Link href="/blog" className="underline">how-to guides</Link>.</p>
    </div>
  );
}
