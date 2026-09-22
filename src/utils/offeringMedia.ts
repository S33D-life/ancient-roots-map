/**
 * offeringMedia — where offering photographs live, and how they are read back.
 *
 * Public offerings keep using the public `offerings` bucket (tree pages, social
 * previews and NFTree metadata all depend on stable public URLs).
 *
 * Offerings that are not public (private / family / tribe) upload instead to the
 * private `offerings-private` bucket. Those files are never fetchable anonymously,
 * and being signed in is not enough either: viewers ask the `offering-media`
 * function for a media link *by offering id*, and the server checks that
 * offering's own visibility rules before signing. Only the uploader keeps direct
 * access to their own objects (used for the composer preview before an offering
 * row exists).
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { signedStorageUrl } from "@/utils/privateStorage";

export const PUBLIC_OFFERING_BUCKET = "offerings";
export const PRIVATE_OFFERING_BUCKET = "offerings-private";

/** Choose the bucket for a new upload based on the offering's visibility. */
export function bucketForVisibility(visibility: string | null | undefined): string {
  return !visibility || visibility === "public"
    ? PUBLIC_OFFERING_BUCKET
    : PRIVATE_OFFERING_BUCKET;
}

/** True when a stored media URL points at the private offerings bucket. */
export function isPrivateOfferingMedia(url: string | null | undefined): boolean {
  return !!url && url.includes(`/${PRIVATE_OFFERING_BUCKET}/`);
}

/**
 * Upload offering media to the right bucket and return the reference to store
 * on the offering row (a public URL, or a private-bucket URL that must be signed
 * before display).
 */
export async function uploadOfferingMedia(
  path: string,
  body: Blob | File,
  visibility: string | null | undefined,
  options?: { contentType?: string; cacheControl?: string; upsert?: boolean },
): Promise<string> {
  const bucket = bucketForVisibility(visibility);
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    cacheControl: options?.cacheControl ?? "3600",
    contentType: options?.contentType,
    upsert: options?.upsert ?? false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/** Ask the server for a checked, short-lived link to an offering's private media. */
export async function signedOfferingMediaUrl(offeringId: string): Promise<string | null> {
  const { data, error } = await supabase.functions.invoke("offering-media", {
    body: { offering_id: offeringId },
  });
  if (error) return null;
  const url = (data as { url?: string } | null)?.url;
  return typeof url === "string" ? url : null;
}

/**
 * Resolve a stored media URL for display.
 *
 * Public media is returned as-is. Private media is only resolved through the
 * server-side access path, which needs the offering id; the owner-only direct
 * signing fallback exists for media that has no offering row yet (composer
 * preview) and will fail for anybody but the uploader.
 */
export async function resolveOfferingMediaUrl(
  url: string | null | undefined,
  offeringId?: string | null,
): Promise<string | null> {
  if (!url) return null;
  if (!isPrivateOfferingMedia(url)) return url;
  if (offeringId) return signedOfferingMediaUrl(offeringId);
  return signedStorageUrl(PRIVATE_OFFERING_BUCKET, url);
}

/** React helper: resolves a single media URL, signing private media as needed. */
export function useOfferingMediaUrl(
  url: string | null | undefined,
  offeringId?: string | null,
): string | null {
  const [resolved, setResolved] = useState<string | null>(
    url && !isPrivateOfferingMedia(url) ? url : null,
  );

  useEffect(() => {
    let cancelled = false;
    if (!url) {
      setResolved(null);
      return;
    }
    if (!isPrivateOfferingMedia(url)) {
      setResolved(url);
      return;
    }
    setResolved(null);
    (async () => {
      const signed = await resolveOfferingMediaUrl(url, offeringId);
      if (!cancelled) setResolved(signed);
    })();
    return () => {
      cancelled = true;
    };
  }, [url, offeringId]);

  return resolved;
}
