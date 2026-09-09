import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FileUploadField } from "@/components/upload/FileUploadField";
import { StoredFile, getViewUrl } from "@/lib/storage";
import { KENYA_COUNTIES } from "@/lib/counties";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2, Pencil, Image as ImageIcon } from "lucide-react";

const BUCKET = "tender-posters";

export interface Poster {
  id: number;
  title: string;
  description: string | null;
  image_path: string;
  link_url: string | null;
  county: string | null;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
}

const empty = {
  id: 0,
  title: "",
  description: "",
  image_path: "",
  link_url: "",
  county: "National",
  is_active: true,
  ends_at: "",
};

export function PosterManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [image, setImage] = useState<StoredFile[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const { data: posters = [], isLoading } = useQuery({
    queryKey: ["admin-posters"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("tender_posters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []) as Poster[];
      const urls: Record<string, string> = {};
      await Promise.all(
        rows.map(async (r) => {
          try {
            urls[r.image_path] = await getViewUrl(BUCKET, r.image_path);
          } catch {
            /* ignore preview failures */
          }
        })
      );
      setPreviews(urls);
      return rows;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (!form.title.trim()) throw new Error("Title is required");
      const image_path = image[0]?.path || form.image_path;
      if (!image_path) throw new Error("Please upload a poster image");

      const payload: Record<string, any> = {
        title: form.title.trim(),
        description: form.description || null,
        image_path,
        link_url: form.link_url || null,
        county: form.county || null,
        is_active: form.is_active,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      };

      if (form.id) {
        const { error } = await (supabase as any).from("tender_posters").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from("tender_posters")
          .insert({ ...payload, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["active-posters"] });
      setOpen(false);
      setForm({ ...empty });
      setImage([]);
      toast({ title: "Poster saved" });
    },
    onError: (e: any) => toast({ title: "Could not save poster", description: e.message, variant: "destructive" }),
  });

  const togglePublish = useMutation({
    mutationFn: async (p: Poster) => {
      const { error } = await (supabase as any)
        .from("tender_posters")
        .update({ is_active: !p.is_active })
        .eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-posters"] });
      qc.invalidateQueries({ queryKey: ["active-posters"] });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const startEdit = (p: Poster) => {
    setForm({
      id: p.id,
      title: p.title,
      description: p.description || "",
      image_path: p.image_path,
      link_url: p.link_url || "",
      county: p.county || "National",
      is_active: p.is_active,
      ends_at: p.ends_at ? p.ends_at.slice(0, 10) : "",
    });
    setImage([]);
    setOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" /> Tender Posters
          </CardTitle>
          <CardDescription>Publish county-tagged tender posters shown to all users.</CardDescription>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setForm({ ...empty });
            setImage([]);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> New poster
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {!isLoading && posters.length === 0 && (
          <p className="text-sm text-muted-foreground">No posters yet.</p>
        )}
        {posters.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-lg border p-3">
            {previews[p.image_path] ? (
              <img src={previews[p.image_path]} alt={p.title} className="h-14 w-20 rounded object-cover" />
            ) : (
              <div className="h-14 w-20 rounded bg-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{p.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant="outline">{p.county || "National"}</Badge>
                <Badge variant={p.is_active ? "default" : "secondary"}>
                  {p.is_active ? "Published" : "Hidden"}
                </Badge>
                {p.ends_at && (
                  <span className="text-xs text-muted-foreground">
                    ends {new Date(p.ends_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={p.is_active} onCheckedChange={() => togglePublish.mutate(p)} />
              <Button size="sm" variant="ghost" onClick={() => startEdit(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit poster" : "New poster"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={160} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                maxLength={500}
              />
            </div>
            <div>
              <Label>County</Label>
              <Select value={form.county} onValueChange={(v) => setForm({ ...form, county: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="National">National</SelectItem>
                  {KENYA_COUNTIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Link (optional)</Label>
              <Input
                placeholder="https://…"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Show until (optional)</Label>
              <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
            </div>
            <div>
              <Label>Poster image *</Label>
              <FileUploadField
                bucket={BUCKET}
                label="Upload image"
                accept={["image/*"]}
                maxFiles={1}
                multiple={false}
                maxSizeMB={3}
                value={image}
                onChange={setImage}
              />
              {form.image_path && image.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Current image kept unless you upload a new one.</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Published</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save poster"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
