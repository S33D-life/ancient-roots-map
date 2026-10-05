/** Pilot-only reference index. No taxonomy, encounter evidence or write API. */
export interface RecordRef { provider: string; record_type?: string; id?: string; [key: string]: unknown }
export interface CouncilAppearance {
  record_type: "council_appearance";
  circle_ref: RecordRef;
  companion_id: string;
  role: string;
  subject_binding: { state: string; ref: RecordRef | null; approved_by?: string; approved_on?: string };
  represented_by: RecordRef[];
  supported_by: RecordRef[];
  chapter_editions: RecordRef[];
  encounter_ref: RecordRef | null;
  encounter_state: { code: string; label: string; as_of: string } | null;
  consent: { personal_material: string; source_ref: RecordRef };
  harvest_ref: RecordRef | null;
  visibility: "REVIEW_ONLY";
  provenance: Record<string, unknown>;
}
export interface TreeLink { id: string; name: string; species_key: string | null }
export interface SpeciesLink { id: string; species_key: string; slug: string | null; scientific_name: string | null; family: string | null }
export interface HiveLink { id: string; slug: string; display_name: string; family_name: string }
export interface ReadResult<T> { data: T | null; error: unknown | null }
export interface AppearanceReader {
  tree(id: string): Promise<ReadResult<TreeLink>>;
  species(key: string): Promise<ReadResult<SpeciesLink>>;
  hive(family: string): Promise<ReadResult<HiveLink>>;
}
export interface AppearanceProjection {
  circle: RecordRef;
  companionId: string;
  status: "UNRESOLVED" | "UNAVAILABLE" | "SUBJECT_MISSING" | "SPECIES_MISSING" | "HIVE_MISSING" | "RESOLVED";
  tree: TreeLink | null;
  species: SpeciesLink | null;
  hive: HiveLink | null;
  /** Metadata only; never rendered as field evidence or supporting claims. */
  representedBy: RecordRef[];
  supportedBy: RecordRef[];
  editions: RecordRef[];
  encounterRef: RecordRef | null;
  encounterState: CouncilAppearance["encounter_state"];
  consent: CouncilAppearance["consent"];
  provenance: CouncilAppearance["provenance"];
  harvestRef: RecordRef | null;
  visibility: CouncilAppearance["visibility"];
}

export const appearanceKey = (a: CouncilAppearance) => `${a.circle_ref.id}/${a.companion_id}`;
export const appearancesForSubject = (items: readonly CouncilAppearance[], ref: RecordRef) =>
  items.filter(a => a.subject_binding.ref?.provider === ref.provider &&
    a.subject_binding.ref?.record_type === ref.record_type && a.subject_binding.ref?.id === ref.id &&
    a.subject_binding.state === "BOUND_TO_EXISTING_RECORD");

/** Public output is deliberately empty until separate publication approval. */
export async function resolveCouncilAppearance(
  a: CouncilAppearance, reader: AppearanceReader, audience: "review" | "public",
): Promise<AppearanceProjection | null> {
  if (audience === "public") return null;
  const out: AppearanceProjection = {
    circle: a.circle_ref, companionId: a.companion_id, status: "UNRESOLVED",
    tree: null, species: null, hive: null,
    representedBy: a.represented_by, supportedBy: a.supported_by,
    editions: a.chapter_editions, encounterRef: a.encounter_ref, encounterState: a.encounter_state,
    consent: a.consent, provenance: a.provenance, harvestRef: a.harvest_ref, visibility: a.visibility,
  };
  const ref = a.subject_binding.ref;
  if (a.subject_binding.state !== "BOUND_TO_EXISTING_RECORD" || !ref?.id || ref.provider !== "s33d" || ref.record_type !== "trees") return out;
  try {
    const tree = await reader.tree(ref.id);
    if (tree.error) { out.status = "UNAVAILABLE"; return out; }
    if (!tree.data || tree.data.id !== ref.id) { out.status = "SUBJECT_MISSING"; return out; }
    out.tree = tree.data;
    if (!out.tree.species_key) { out.status = "SPECIES_MISSING"; return out; }
    const species = await reader.species(out.tree.species_key);
    if (species.error) { out.status = "UNAVAILABLE"; return out; }
    if (!species.data || species.data.species_key !== out.tree.species_key) { out.status = "SPECIES_MISSING"; return out; }
    out.species = species.data;
    if (!out.species.family) { out.status = "HIVE_MISSING"; return out; }
    const hive = await reader.hive(out.species.family);
    if (hive.error) { out.status = "UNAVAILABLE"; return out; }
    if (!hive.data || hive.data.family_name !== out.species.family) { out.status = "HIVE_MISSING"; return out; }
    out.hive = hive.data;
    out.status = "RESOLVED";
  } catch { out.status = "UNAVAILABLE"; }
  return out;
}
