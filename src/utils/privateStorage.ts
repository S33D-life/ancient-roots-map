/**
 * privateStorage — helpers for reading files held in private storage buckets.
 *
 * Bug report screenshots and collaborator documents are stored in private
 * buckets, so their raw URLs are not fetchable. These helpers turn a stored
 * URL (or path) into a short-lived signed URL for the current viewer.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_EXPIRY_SECONDS = 60 * 30;

/** Extract the object path inside a bucket from a stored URL or raw path. */
export function storagePath(bucket: string, urlOrPath: string): string | null {
  if (!urlOrPath) return null;
  const marker = `/${bucket}/`;
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) {
    // Already a bare path
    return urlOrPath.replace(/^\/+/, "") || null;
  }
  const path = urlOrPath.slice(idx + marker.length);
  return path ? decodeURIComponent(path.split("?")[0]) : null;
}

/** Create a short-lived signed URL, or null when access is not permitted. */
export async function signedStorageUrl(
  bucket: string,
  urlOrPath: string,
  expiresIn = DEFAULT_EXPIRY_SECONDS,
): Promise<string | null> {
  const path = storagePath(bucket, urlOrPath);
  if (!path) return null;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/** Open a private file in a new tab using a freshly signed URL. */
export async function openSignedStorageUrl(bucket: string, urlOrPath: string): Promise<boolean> {
  const signed = await signedStorageUrl(bucket, urlOrPath);
  if (!signed) return false;
  window.open(signed, "_blank", "noopener,noreferrer");
  return true;
}

/** Resolve a list of stored URLs into signed URLs for display. */
export function useSignedStorageUrls(bucket: string, urls: string[] | null | undefined) {
  const [signed, setSigned] = useState<string[]>([]);
  const key = (urls ?? []).join("|");

  useEffect(() => {
    let cancelled = false;
    const list = urls ?? [];
    if (list.length === 0) {
      setSigned([]);
      return;
    }
    (async () => {
      const resolved = await Promise.all(list.map((u) => signedStorageUrl(bucket, u)));
      if (!cancelled) setSigned(resolved.filter((u): u is string => !!u));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bucket, key]);

  return signed;
}
