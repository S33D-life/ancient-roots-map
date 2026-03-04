import { ROOTSTONES_GROVES as COSTA_RICA_GROVES, ROOTSTONES_TREES as COSTA_RICA_TREES } from "./costa-rica";
import { ROOTSTONES_GROVES as PERU_GROVES, ROOTSTONES_TREES as PERU_TREES } from "./peru";
import { ROOTSTONES_GROVES as INDONESIA_GROVES, ROOTSTONES_TREES as INDONESIA_TREES } from "./indonesia";
import type { Rootstone } from "./types";

export type RootstoneBuckets = { trees: Rootstone[]; groves: Rootstone[] };

const FALLBACK_BY_COUNTRY: Record<string, RootstoneBuckets> = {
  "costa-rica": { trees: COSTA_RICA_TREES, groves: COSTA_RICA_GROVES },
  peru: { trees: PERU_TREES, groves: PERU_GROVES },
  indonesia: { trees: INDONESIA_TREES, groves: INDONESIA_GROVES },
};

type GeneratedModule = {
  default:
    | Rootstone[]
    | {
        country?: string;
        rootstones?: Rootstone[];
        trees?: Rootstone[];
        groves?: Rootstone[];
      };
};

const GENERATED_MODULES = import.meta.glob("./generated/*.json", { eager: true }) as Record<string, GeneratedModule>;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const splitByType = (rootstones: Rootstone[]): RootstoneBuckets => ({
  trees: rootstones.filter((stone) => stone.type === "tree"),
  groves: rootstones.filter((stone) => stone.type === "grove"),
});

const parseGeneratedPayload = (payload: GeneratedModule["default"]): RootstoneBuckets => {
  if (Array.isArray(payload)) return splitByType(payload);
  if (Array.isArray(payload.rootstones)) return splitByType(payload.rootstones);

  const trees = Array.isArray(payload.trees)
    ? payload.trees.filter((stone) => stone.type === "tree")
    : [];
  const groves = Array.isArray(payload.groves)
    ? payload.groves.filter((stone) => stone.type === "grove")
    : [];

  return { trees, groves };
};

const GENERATED_BY_COUNTRY: Record<string, RootstoneBuckets> = Object.fromEntries(
  Object.entries(GENERATED_MODULES).map(([path, mod]) => {
    const byPath = path.split("/").pop()?.replace(/\.json$/, "") || "";
    const payload = mod.default;
    const byCountry = !Array.isArray(payload) && typeof payload.country === "string" ? slugify(payload.country) : "";
    const key = byCountry || slugify(byPath);
    return [key, parseGeneratedPayload(payload)];
  }),
);

export const loadRootstones = (countrySlug: string): RootstoneBuckets => {
  const key = slugify(countrySlug || "");
  const generated = GENERATED_BY_COUNTRY[key];

  if (generated && (generated.trees.length > 0 || generated.groves.length > 0)) {
    return generated;
  }

  return FALLBACK_BY_COUNTRY[key] || { trees: [], groves: [] };
};

export const loadAllRootstones = (): Rootstone[] => {
  const countrySlugs = new Set([
    ...Object.keys(FALLBACK_BY_COUNTRY),
    ...Object.keys(GENERATED_BY_COUNTRY),
  ]);

  const all = Array.from(countrySlugs).flatMap((countrySlug) => {
    const buckets = loadRootstones(countrySlug);
    return [...buckets.trees, ...buckets.groves];
  });

  const seen = new Set<string>();
  return all.filter((stone) => {
    if (seen.has(stone.id)) return false;
    seen.add(stone.id);
    return true;
  });
};

export const loadRootstoneById = (id: string): Rootstone | undefined =>
  loadAllRootstones().find((stone) => stone.id === id);
