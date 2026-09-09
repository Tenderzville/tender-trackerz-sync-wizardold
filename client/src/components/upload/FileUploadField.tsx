import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { uploadFile, getViewUrl, StoredFile } from "@/lib/storage";
import { Upload, Loader2, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  bucket: string;
  label?: string;
  helpText?: string;
  accept?: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  multiple?: boolean;
  value?: StoredFile[];
  onChange: (files: StoredFile[]) => void;
  className?: string;
}

export function FileUploadField({
  bucket,
  label = "Upload files",
  helpText,
  accept = ["image/*", "application/pdf", ".doc", ".docx", ".xls", ".xlsx"],
  maxFiles = 5,
  maxSizeMB = 3,
  multiple = true,
  value = [],
  onChange,
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const handleFiles = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const picked = Array.from(list);
    if (value.length + picked.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can attach up to ${maxFiles} file(s).`,
        variant: "destructive",
      });
      return;
    }

    setBusy(true);
    const uploaded: StoredFile[] = [];
    for (const file of picked) {
      try {
        uploaded.push(await uploadFile(bucket, file, { maxSizeMB, accept }));
      } catch (e: any) {
        toast({
          title: "Upload failed",
          description: e?.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    }
    setBusy(false);

    if (uploaded.length) {
      onChange([...value, ...uploaded]);
      toast({ title: `${uploaded.length} file(s) uploaded` });
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const open = async (f: StoredFile) => {
    try {
      window.open(await getViewUrl(bucket, f.path), "_blank", "noopener");
    } catch {
      toast({ title: "Could not open file", variant: "destructive" });
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {busy ? "Uploading…" : label}
        </Button>
        <span className="text-xs text-muted-foreground">{helpText || `Max ${maxSizeMB}MB each`}</span>
      </div>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={accept.join(",")}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((f) => (
            <Badge key={f.path} variant="secondary" className="flex items-center gap-1 max-w-[240px]">
              <button type="button" className="truncate" onClick={() => open(f)} title={f.name}>
                {f.name}
              </button>
              <Eye className="h-3 w-3 opacity-60" />
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v.path !== f.path))}
                className="ml-1 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
