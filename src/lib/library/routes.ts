/**
 * PLANeTary Library of Life routes (Heartwood). Kept beside the Library module
 * rather than in the shared ROUTES object: `src/lib/routes.ts` is bundled into
 * the committed MCP Edge Function, so adding there would change that deployed
 * artifact. Promote these into ROUTES when an Edge redeploy is planned.
 *
 * The species key is opaque and always URL-encoded, never transformed.
 */
export const LIBRARY_LIFE_PATTERNS = {
  HOME: "/library/life/:speciesKey",
  SPECIES: "/library/life/:speciesKey/species-distribution",
  READER: "/library/life/:speciesKey/read/:chapterId",
} as const;

export const LIBRARY_LIFE_ROUTES = {
  HOME: (speciesKey: string) => `/library/life/${encodeURIComponent(speciesKey)}` as const,
  SPECIES: (speciesKey: string) => `/library/life/${encodeURIComponent(speciesKey)}/species-distribution` as const,
  READER: (speciesKey: string, chapterId: string) =>
    `/library/life/${encodeURIComponent(speciesKey)}/read/${encodeURIComponent(chapterId)}` as const,
} as const;
