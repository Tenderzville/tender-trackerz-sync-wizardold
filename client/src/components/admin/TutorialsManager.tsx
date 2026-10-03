import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { toEmbedUrl } from './DemoVideoManager';
import type { Tutorial } from '@/pages/tutorials';

export function TutorialsManager() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Tutorial[]>([]);

  const load = () => (supabase as any).from('tutorials').select('*').order('sort_order')
    .then(({ data }: { data: Tutorial[] | null }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const patch = (id: string, p: Partial<Tutorial>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const save = async (t: Tutorial) => {
    const url = (t.youtube_url ?? '').trim();
    if (url && !toEmbedUrl(url)) { toast({ title: 'Only YouTube links are allowed', variant: 'destructive' }); return; }
    const { error } = await (supabase as any).from('tutorials').update({
      youtube_url: url || null, is_published: t.is_published, sort_order: t.sort_order, title: t.title,
    }).eq('id', t.id);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Tutorial saved' }); load(); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tutorial videos</CardTitle>
        <CardDescription>Paste the YouTube link for each tutorial. Videos without a link show "Coming soon" on the Tutorials page.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((t) => (
          <div key={t.id} className="grid gap-2 md:grid-cols-[60px_1fr_1.4fr_auto_auto] items-center border-b pb-3">
            <Input type="number" value={t.sort_order} onChange={(e) => patch(t.id, { sort_order: Number(e.target.value) })} aria-label="Order" />
            <Input value={t.title} onChange={(e) => patch(t.id, { title: e.target.value })} maxLength={120} aria-label="Title" />
            <Input placeholder="https://www.youtube.com/watch?v=..." value={t.youtube_url ?? ''} onChange={(e) => patch(t.id, { youtube_url: e.target.value })} maxLength={300} aria-label="YouTube link" />
            <label className="flex items-center gap-2 text-sm"><Switch checked={t.is_published} onCheckedChange={(v) => patch(t.id, { is_published: v })} />Show</label>
            <Button size="sm" onClick={() => save(t)}>Save</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
