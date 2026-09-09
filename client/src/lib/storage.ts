import { supabase } from "@/integrations/supabase/client";

export const PUBLIC_BUCKETS = ["profile-images", "rfq-documents", "quote-attachments"];

export interface StoredFile {
  name: string;
  size: number;
  path: string;
  /** Public URL for public buckets, signed URL for private buckets */
  url: string;
}

const sanitize = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-80);

export async function getViewUrl(bucket: string, path: string): Promise<string> {
  if (PUBLIC_BUCKETS.includes(bucket)) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Uploads a single file into a user-scoped folder ({uid}/...) which every
 * storage policy in this project expects. Returns a usable URL.
 */
export async function uploadFile(
  bucket: string,
  file: File,
  opts: { maxSizeMB?: number; accept?: string[] } = {}
): Promise<StoredFile> {
  const maxSizeMB = opts.maxSizeMB ?? 3;
  if (file.size > maxSizeMB * 1024 * 1024) {
    throw new Error(`"${file.name}" is larger than ${maxSizeMB}MB. Please upload a smaller file.`);
  }
  if (opts.accept?.length) {
    const ok = opts.accept.some((t) =>
      t.startsWith(".")
        ? file.name.toLowerCase().endsWith(t.toLowerCase())
        : t.endsWith("/*")
        ? file.type.startsWith(t.replace("/*", ""))
        : file.type === t
    );
    if (!ok) throw new Error(`"${file.name}" is not a supported file type.`);
  }

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Please sign in before uploading files.");

  const path = `${uid}/${Date.now()}-${sanitize(file.name)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    throw new Error(error.message || "Upload failed. Please try again.");
  }

  const url = await getViewUrl(bucket, path);
  return { name: file.name, size: file.size, path, url };
}
