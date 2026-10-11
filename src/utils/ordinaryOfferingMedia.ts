import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isPrivateOfferingMedia } from '@/utils/offeringMedia';

export interface OrdinaryMedia {
  id: string;
  media_url?: string | null;
  photos?: string[] | null;
  thumbnail_url?: string | null;
}

export async function ordinaryMediaUrl(id: string, reference: string): Promise<string | null> {
  if (!isPrivateOfferingMedia(reference)) return reference;
  const { data, error } = await supabase.functions.invoke('ordinary-offering-media', {
    body: { offering_id: id, reference },
  });
  return !error && typeof data?.url === 'string' ? data.url : null;
}

// Display projection only. Never save signed URLs back onto Offering records.
export function useOrdinaryMediaUrls(rows: OrdinaryMedia[]): Record<string, string> {
  const references = rows.flatMap(row => [row.media_url, row.thumbnail_url, ...(row.photos ?? [])]
    .filter((url): url is string => !!url && isPrivateOfferingMedia(url)).map(reference => ({ id: row.id, reference })));
  const key = JSON.stringify(references);
  const [result, setResult] = useState<{ key: string; urls: Record<string, string> }>({ key: '', urls: {} });
  useEffect(() => {
    if (key === "[]") return;
    let cancelled = false;
    let generation = 0;
    let deferred: ReturnType<typeof setTimeout> | undefined;
    const refresh = async () => {
      const currentGeneration = ++generation;
      const pairs = await Promise.all((JSON.parse(key) as typeof references).map(async ({ id, reference }) => {
        try { return [reference, await ordinaryMediaUrl(id, reference)] as const; }
        catch { return [reference, null] as const; }
      }));
      if (!cancelled && currentGeneration === generation) setResult({ key, urls: Object.fromEntries(pairs.filter((pair): pair is readonly [string, string] => pair[1] !== null)) });
    };
    void refresh();
    // Recheck audience before the five-minute links expire; avoid a long-lived
    // shared browser cache. Clear links when the authentication context changes.
    const timer = setInterval(() => void refresh(), 240000);
    const { data } = supabase.auth.onAuthStateChange(() => {
      ++generation;
      setResult({ key: '', urls: {} });
      clearTimeout(deferred);
      deferred = setTimeout(() => void refresh(), 0);
    });
    return () => { cancelled = true; ++generation; clearTimeout(deferred); clearInterval(timer); data.subscription.unsubscribe(); };
  }, [key]);
  return result.key === key ? result.urls : {};
}

export function displayMediaUrl(reference: string | null | undefined, urls: Record<string, string>): string | null {
  if (!reference) return null;
  return isPrivateOfferingMedia(reference) ? urls[reference] ?? null : reference;
}

export function mediaReferences(row: Omit<OrdinaryMedia, 'id'>): string[] {
  return [row.media_url, row.thumbnail_url, ...(row.photos ?? [])].filter((url): url is string => !!url);
}

export function assertMediaAudience(visibility: string, references: string[]): void {
  const publicManaged = references.some(url => /\/storage\/v1\/(?:object|render\/image)\/(?:public|authenticated|sign)\/offerings\//.test(url));
  if (visibility !== 'public' && publicManaged) {
    throw new Error('This media still has a public copy. Keep its current audience until protected delivery is complete.');
  }
  if (visibility === 'public' && references.some(isPrivateOfferingMedia)) {
    throw new Error('This media is protected. Publishing it needs an explicit public-media copy first.');
  }
}
