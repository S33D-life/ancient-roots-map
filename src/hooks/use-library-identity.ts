/**
 * PLANeTary Library · canonical identity by exact stored key.
 *
 * Reuses the existing exact-key seam (`useSpeciesByKey`). The key is opaque and
 * compared byte-for-byte. If the row carries a slug, the slug must resolve back
 * to the same row and key. Anything else is a STOP: no doorway, no Library page.
 * Never uses free-text resolution, fuzzy matching, GBIF enrichment or key generation.
 */
import { useSpeciesByKey, useSpeciesBySlug } from "@/hooks/use-treeasurus";

export type LibraryIdentityRow = NonNullable<ReturnType<typeof useSpeciesByKey>["data"]>;

export type LibraryIdentity =
  | { status: "loading" }
  | { status: "ready"; row: LibraryIdentityRow }
  | { status: "stop"; reason: "missing-key" | "lookup-error" | "no-row" | "key-mismatch" | "slug-error" | "slug-mismatch" };

export function useLibraryIdentity(speciesKey: string | null | undefined): LibraryIdentity {
  const key = typeof speciesKey === "string" && speciesKey.length > 0 ? speciesKey : null;
  const byKey = useSpeciesByKey(key);
  const row = byKey.data ?? null;
  const slug = row && row.species_key === key ? row.slug ?? undefined : undefined;
  const bySlug = useSpeciesBySlug(slug);

  if (!key) return { status: "stop", reason: "missing-key" };
  if (byKey.isError) return { status: "stop", reason: "lookup-error" };
  if (byKey.isPending) return { status: "loading" };
  if (!row) return { status: "stop", reason: "no-row" };
  if (row.species_key !== key) return { status: "stop", reason: "key-mismatch" };
  if (!slug) return { status: "ready", row };
  if (bySlug.isError) return { status: "stop", reason: "slug-error" };
  if (bySlug.isPending) return { status: "loading" };
  const back = bySlug.data;
  if (!back || back.id !== row.id || back.species_key !== key) return { status: "stop", reason: "slug-mismatch" };
  return { status: "ready", row };
}
