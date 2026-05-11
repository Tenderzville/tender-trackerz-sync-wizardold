import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Check, ExternalLink, Trash2, RefreshCw, Calendar } from 'lucide-react';

type Tender = {
  id: number;
  title: string;
  organization: string;
  category: string | null;
  location: string | null;
  deadline: string | null;
  status: string | null;
  source_url: string | null;
  scraped_from: string | null;
  tender_number: string | null;
  created_at: string;
};

export default function AdminTenderQueuePage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenders')
      .select('id,title,organization,category,location,deadline,status,source_url,scraped_from,tender_number,created_at')
      .eq('status', 'short_window')
      .order('deadline', { ascending: true })
      .limit(200);
    setLoading(false);
    if (error) {
      toast({ title: 'Failed to load', description: error.message, variant: 'destructive' });
      return;
    }
    setItems((data as Tender[]) || []);
  };

  useEffect(() => { load(); }, []);

  const promote = async (id: number) => {
    const { error } = await supabase.from('tenders').update({ status: 'active' }).eq('id', id);
    if (error) return toast({ title: 'Override failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Published to live feed', description: 'Tender forced to active despite short window.' });
    setItems(prev => prev.filter(t => t.id !== id));
  };

  const remove = async (id: number) => {
    const { error } = await supabase.from('tenders').delete().eq('id', id);
    if (error) return toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Removed' });
    setItems(prev => prev.filter(t => t.id !== id));
  };

  const daysLeft = (deadline: string | null) => {
    if (!deadline) return '—';
    const d = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return `${d}d`;
  };

  const filtered = items.filter(t =>
    !search ||
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.organization?.toLowerCase().includes(search.toLowerCase()) ||
    t.tender_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Short-Window Review Queue</h1>
          <p className="text-muted-foreground">
            Tenders excluded from the live feed because the supplier prep window is &lt; 14 days.
            Override to publish, or delete if the listing is invalid.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} tenders pending review</CardTitle>
          <CardDescription>Sorted by soonest deadline. Search by title, entity, or reference.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
          {filtered.map(t => (
            <div key={t.id} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{t.title}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {t.organization} · {t.location || '—'} · {t.category || '—'}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <Badge variant="secondary"><Calendar className="w-3 h-3 mr-1" />{t.deadline} ({daysLeft(t.deadline)})</Badge>
                    {t.tender_number && <Badge variant="outline">{t.tender_number}</Badge>}
                    {t.scraped_from && <Badge variant="outline">{t.scraped_from}</Badge>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {t.source_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={t.source_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />Source
                      </a>
                    </Button>
                  )}
                  <Button size="sm" onClick={() => promote(t.id)}>
                    <Check className="w-4 h-4 mr-1" />Publish anyway
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(t.id)}>
                    <Trash2 className="w-4 h-4 mr-1" />Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center">No short-window tenders pending. 🎉</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
