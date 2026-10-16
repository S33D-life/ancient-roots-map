/**
 * S33D data adapter — the single read surface TETOL uses for real S33D records.
 *
 *   TETOL  →  S33D data adapter  →  existing Supabase tables / app registries
 *
 * Read-only (Phase 1–2). Every record carries its canonical web route, its
 * spatial address and where it came from, so both interfaces point at the
 * same entity. Column lists are explicit (never "*"): the trees table is
 * public, but fields such as created_by, access_notes and metadata are not
 * needed for spatial browsing and are kept out of the bridge.
 */
import { ROUTES } from "@/lib/routes";
import { ROOM_BY_KEY, type AccessLevel } from "@/config/heartwoodRooms";
import { COUNCIL_CYCLES, type CouncilSession } from "@/data/council/councilCycles";
import { routeToSpatial } from "./spatialRegistry";
import { resolveStaff, type StaffIdentity } from "./staffIdentity";
import type { S33DReadClient } from "./readOnlyClient";

/* ── Provenance ───────────────────────────────────────────────── */

export type ProvenanceSource = "supabase" | "app-config" | "notion" | "chain";

export interface Provenance {
  source: ProvenanceSource;
  /** Table, config module or Notion data source the record was read from. */
  location: string;
  sourceId: string;
  /** updated_at / last_edited_time when the source offers one. */
  revision: string | null;
}

interface Linked {
  canonicalRoute: string;
  spatialAddress: string | null;
  provenance: Provenance[];
}

function spatialFor(route: string): string | null {
  return routeToSpatial(route)?.address ?? null;
}

/* ── Ancient Friend ───────────────────────────────────────────── */

const FRIEND_SUMMARY_COLUMNS =
  "id, name, species, species_key, latitude, longitude, nation, estimated_age, photo_thumb_url, merged_into_tree_id, updated_at";

const FRIEND_DETAIL_COLUMNS =
  "id, name, species, species_key, latitude, longitude, nation, state, bioregion, estimated_age, age_min, age_max, age_confidence, girth_cm, description, lore_text, what3words, photo_thumb_url, photo_processed_url, source_name, source_url, location_confidence, merged_into_tree_id, updated_at";

export interface AncientFriendSummary extends Linked {
  kind: "ancient_friend";
  id: string;
  name: string;
  species: string;
  speciesKey: string | null;
  latitude: number | null;
  longitude: number | null;
  nation: string | null;
  estimatedAge: number | null;
  thumbnailUrl: string | null;
}

export interface AncientFriend extends AncientFriendSummary {
  state: string | null;
  bioregion: string | null;
  ageRange: { min: number | null; max: number | null; confidence: string | null };
  girthCm: number | null;
  description: string | null;
  lore: string | null;
  what3words: string | null;
  photoUrl: string | null;
  externalSource: { name: string | null; url: string | null };
  locationConfidence: string | null;
  /** Set when the requested id had been merged into another tree. */
  mergedFrom: string | null;
}

type SummaryRow = {
  id: string;
  name: string;
  species: string;
  species_key: string | null;
  latitude: number | null;
  longitude: number | null;
  nation: string | null;
  estimated_age: number | null;
  photo_thumb_url: string | null;
  updated_at: string;
};

function toSummary(row: SummaryRow): AncientFriendSummary {
  const canonicalRoute = ROUTES.TREE(row.id);
  return {
    kind: "ancient_friend",
    id: row.id,
    name: row.name,
    species: row.species,
    speciesKey: row.species_key,
    latitude: row.latitude,
    longitude: row.longitude,
    nation: row.nation,
    estimatedAge: row.estimated_age,
    thumbnailUrl: row.photo_thumb_url,
    canonicalRoute,
    spatialAddress: spatialFor(canonicalRoute),
    provenance: [{ source: "supabase", location: "public.trees", sourceId: row.id, revision: row.updated_at }],
  };
}

/* ── Staff ────────────────────────────────────────────────────── */

export interface StaffRecord extends Linked, StaffIdentity {
  kind: "staff";
  /** Row in public.staffs when one matches; owner fields are intentionally not read. */
  registryRow: { id: string; tokenId: number; verifiedAt: string | null } | null;
}

/* ── Council ──────────────────────────────────────────────────── */

export interface CouncilRecord extends Linked {
  kind: "council_record";
  id: string;
  title: string;
  moonPhase: CouncilSession["moonPhase"];
  gatheringDate: string;
  invocation: string;
  focusAreas: string[];
  /** True when the newest hard-coded session is already in the past. */
  stale: boolean;
}

/* ── Heartwood room ───────────────────────────────────────────── */

export interface HeartwoodRoomRecord extends Linked {
  kind: "heartwood_room";
  key: string;
  label: string;
  subtitle: string | null;
  access: AccessLevel;
}

/* ── Adapter ──────────────────────────────────────────────────── */

export interface S33DDataAdapter {
  getAncientFriend(id: string): Promise<AncientFriend | null>;
  listAncientFriends(options?: { limit?: number; nation?: string }): Promise<AncientFriendSummary[]>;
  getStaff(code: string): Promise<StaffRecord | null>;
  getCouncilRecord(id: string): CouncilRecord | null;
  getCurrentCouncil(): CouncilRecord;
  getHeartwoodRoom(key: string): HeartwoodRoomRecord | null;
  /** Phase 3 — needs the production auth lane. Always null in the read-only bridge. */
  getWanderer(): Promise<null>;
}

const MAX_MERGE_HOPS = 3;
const MAX_LIST = 200;

export function createS33DDataAdapter(
  client: S33DReadClient,
  options: { now?: () => Date } = {},
): S33DDataAdapter {
  const now = options.now ?? (() => new Date());

  function toCouncilRecord(session: CouncilSession): CouncilRecord {
    const canonicalRoute = ROUTES.COUNCIL_SESSION(session.id);
    const newest = COUNCIL_CYCLES[COUNCIL_CYCLES.length - 1];
    return {
      kind: "council_record",
      id: session.id,
      title: session.title,
      moonPhase: session.moonPhase,
      gatheringDate: session.gatheringDate,
      invocation: session.agenda.invocation,
      focusAreas: [...session.agenda.focusAreas],
      stale: new Date(newest.gatheringDate) < now(),
      canonicalRoute,
      spatialAddress: spatialFor(canonicalRoute),
      provenance: [{ source: "app-config", location: "src/data/council/councilCycles.ts", sourceId: session.id, revision: null }],
    };
  }

  return {
    async getAncientFriend(id) {
      let currentId = id;
      let mergedFrom: string | null = null;
      for (let hop = 0; hop <= MAX_MERGE_HOPS; hop++) {
        const { data, error } = await client
          .from("trees")
          .select(FRIEND_DETAIL_COLUMNS)
          .eq("id", currentId)
          .maybeSingle();
        if (error || !data) return null;
        if (data.merged_into_tree_id) {
          mergedFrom = mergedFrom ?? id;
          currentId = data.merged_into_tree_id;
          continue;
        }
        return {
          ...toSummary(data),
          state: data.state,
          bioregion: data.bioregion,
          ageRange: { min: data.age_min, max: data.age_max, confidence: data.age_confidence },
          girthCm: data.girth_cm,
          description: data.description,
          lore: data.lore_text,
          what3words: data.what3words,
          photoUrl: data.photo_processed_url ?? data.photo_thumb_url,
          externalSource: { name: data.source_name, url: data.source_url },
          locationConfidence: data.location_confidence,
          mergedFrom,
        };
      }
      return null;
    },

    async listAncientFriends({ limit = 50, nation } = {}) {
      let query = client
        .from("trees")
        .select(FRIEND_SUMMARY_COLUMNS)
        .is("merged_into_tree_id", null)
        .order("name")
        .limit(Math.min(Math.max(limit, 1), MAX_LIST));
      if (nation) query = query.ilike("nation", nation);
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map(toSummary);
    },

    async getStaff(code) {
      const identity = resolveStaff(code);
      if (!identity) return null;
      const canonicalRoute = ROUTES.STAFF(identity.routeCode);
      // The staffs table comment shows zero-padded ids ("OAK-C1S03"); try both spellings.
      const candidates = [identity.routeCode];
      if (identity.staff !== null) {
        candidates.push(identity.routeCode.replace(/S(\d)$/, "S0$1"));
      }
      const { data } = await client
        .from("staffs")
        .select("id, token_id, verified_at")
        .in("id", candidates)
        .limit(1);
      const row = data?.[0] ?? null;
      const provenance: Provenance[] = [
        { source: "app-config", location: "src/config/staffContract.ts", sourceId: identity.routeCode, revision: null },
      ];
      if (row) provenance.push({ source: "supabase", location: "public.staffs", sourceId: row.id, revision: row.verified_at });
      return {
        kind: "staff",
        ...identity,
        registryRow: row ? { id: row.id, tokenId: row.token_id, verifiedAt: row.verified_at } : null,
        canonicalRoute,
        spatialAddress: spatialFor(canonicalRoute),
        provenance,
      };
    },

    getCouncilRecord(id) {
      const session = COUNCIL_CYCLES.find((c) => c.id === id);
      return session ? toCouncilRecord(session) : null;
    },

    getCurrentCouncil() {
      const today = now();
      today.setHours(0, 0, 0, 0);
      const upcoming = COUNCIL_CYCLES.find((c) => new Date(c.gatheringDate) >= today);
      return toCouncilRecord(upcoming ?? COUNCIL_CYCLES[COUNCIL_CYCLES.length - 1]);
    },

    getHeartwoodRoom(key) {
      const room = ROOM_BY_KEY[key];
      if (!room) return null;
      return {
        kind: "heartwood_room",
        key: room.key,
        label: room.label,
        subtitle: room.subtitle ?? null,
        access: room.access,
        canonicalRoute: room.route,
        spatialAddress: spatialFor(room.route),
        provenance: [{ source: "app-config", location: "src/config/heartwoodRooms.ts", sourceId: room.key, revision: null }],
      };
    },

    async getWanderer() {
      return null;
    },
  };
}
