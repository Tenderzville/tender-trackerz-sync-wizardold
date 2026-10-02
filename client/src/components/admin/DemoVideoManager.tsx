import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function toEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return null;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith('/embed/')) return `https://www.youtube.com${u.pathname}`;
      if (u.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${u.pathname.split('/')[2]}`;
    }
  } catch { /* invalid */ }
  return null;
}

export function DemoVideoManager() {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('site_settings').select('value').eq('key', 'demo_video_url').maybeSingle()
      .then(({ data }) => {
        const v = (data?.value as { url?: string } | null)?.url;
        if (typeof v === 'string') setUrl(v);
      });
  }, []);

  const embed = toEmbedUrl(url.trim());

  const save = async () => {
    const trimmed = url.trim();
    if (trimmed && !embed) {
      toast({ title: 'Only YouTube links are allowed', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('site_settings').upsert(
      { key: 'demo_video_url', value: { url: trimmed }, updated_at: new Date().toISOString(), updated_by: user?.id ?? null },
      { onConflict: 'key' },
    );
    setSaving(false);
    if (error) toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    else toast({ title: trimmed ? 'Demo video published' : 'Demo video removed' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage demo video</CardTitle>
        <CardDescription>
          Paste a YouTube link (watch, youtu.be or Shorts). It plays when visitors click "Watch Demo" on the homepage. Leave blank and save to hide it.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={(e) => setUrl(e.target.value)} maxLength={300} />
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
        {url && !embed && <p className="text-sm text-destructive">Not a valid YouTube link.</p>}
        {embed && (
          <div className="aspect-video rounded-lg overflow-hidden border">
            <iframe src={embed} title="Demo preview" className="w-full h-full" allow="encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
