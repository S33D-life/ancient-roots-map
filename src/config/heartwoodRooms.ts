/**
 * Heartwood Trunk Map — v1 canonical room registry.
 *
 * Single source of truth for room metadata, journey grouping, access levels,
 * and canonical routes. All Heartwood room navigation should derive from this.
 *
 * Rules:
 *   - Canonical route is always /library/:key
 *   - aliases lists stale full-path routes that redirect to canonical
 *   - Do not add rooms without a corresponding component in HeartwoodRoomPage
 *   - Do not rename keys — they form the URL segment
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** The seven stages of the Heartwood journey spine */
export type JourneyStage =
  | "meet"      // Encounter the forest
  | "learn"     // Understand species and ecology
  | "walk"      // Active participation and movement
  | "offer"     // Give, name, pledge
  | "remember"  // Preserve and reflect
  | "steward"   // Guard, grow, govern
  | "evolve";   // Build, iterate, improve

/** Minimum access level to enter this room */
export type AccessLevel =
  | "visitor"   // Public; no auth required
  | "member"    // Signed-in user
  | "steward"   // Curator / keeper role
  | "advanced"; // Admin / dev access

/** P0 = always visible on mobile, P4 = desktop-only / advanced */
export type MobilePriority = 0 | 1 | 2 | 3 | 4;

export interface HeartwoodRoom {
  /** URL segment: /library/:key — do not change */
  key: string;
  /** Primary user-facing room label */
  label: string;
  /** Poetic subtitle for header/context areas */
  subtitle?: string;
  /** Canonical route (always /library/:key) */
  route: string;
  /** Journey stage this room belongs to */
  stage: JourneyStage;
  /** Minimum access level required */
  access: AccessLevel;
  /** Mobile visibility priority */
  mobilePriority: MobilePriority;
  /** What the user IS in this room */
  emotionalRole: string;
  /** Primary CTA label */
  primaryAction: string;
  /** Full-path stale routes that redirect here; used to generate App.tsx redirects */
  aliases?: string[];
}

export interface JourneyStageConfig {
  key: JourneyStage;
  /** Short display label */
  label: string;
  /** Poetic one-liner */
  subtitle: string;
  /** Ordered room keys for this stage */
  rooms: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical room registry
// ─────────────────────────────────────────────────────────────────────────────

export const HEARTWOOD_ROOMS: HeartwoodRoom[] = [
  // ── Meet ────────────────────────────────────────────────────────────────────
  {
    key: "gallery",
    label: "Ancient Friends",
    subtitle: "The verified living record",
    route: "/library/gallery",
    stage: "meet",
    access: "visitor",
    mobilePriority: 1,
    emotionalRole: "Wanderer",
    primaryAction: "Meet a tree",
    aliases: ["/library/ancient-friends"],
  },
  {
    key: "staff-room",
    label: "Staff Room",
    subtitle: "Your guide lineage",
    route: "/library/staff-room",
    stage: "meet",
    access: "member",
    mobilePriority: 1,
    emotionalRole: "Seeker",
    primaryAction: "Begin staff ceremony",
  },
  // ── Learn ───────────────────────────────────────────────────────────────────
  {
    key: "arborium",
    label: "The Arborium",
    subtitle: "Field guide to the living world",
    route: "/library/arborium",
    stage: "learn",
    access: "visitor",
    mobilePriority: 0,
    emotionalRole: "Student",
    primaryAction: "Start identifying",
  },
  // ── Walk ────────────────────────────────────────────────────────────────────
  {
    key: "quest-cave",
    label: "Quest Cave",
    subtitle: "Continue the path",
    route: "/library/quest-cave",
    stage: "walk",
    access: "member",
    mobilePriority: 0,
    emotionalRole: "Quester",
    primaryAction: "Continue current quest",
    // Reverse the old redirect: /heartwood/quest-room and /heartwood/quest-cave
    // now redirect to /library/quest-cave as the canonical shell route.
    aliases: ["/heartwood/quest-room", "/heartwood/quest-cave", "/library/quest-room"],
  },
  {
    key: "music-room",
    label: "Music Room",
    subtitle: "Songs offered to trees",
    route: "/library/music-room",
    stage: "walk",
    access: "visitor",
    mobilePriority: 2,
    emotionalRole: "Listener",
    primaryAction: "Play Tree Radio",
  },
  {
    key: "greenhouse",
    label: "Greenhouse",
    subtitle: "Saplings and growing care",
    route: "/library/greenhouse",
    stage: "walk",
    access: "member",
    mobilePriority: 2,
    emotionalRole: "Grower",
    primaryAction: "Add plant or sapling",
  },
  // ── Offer ───────────────────────────────────────────────────────────────────
  {
    key: "wishlist",
    label: "Wishing Tree",
    subtitle: "Trees you dream to visit",
    route: "/library/wishlist",
    stage: "offer",
    access: "member",
    mobilePriority: 1,
    emotionalRole: "Dreamer",
    primaryAction: "Pin a dream",
    aliases: ["/library/wishing-tree"],
  },
  // ── Remember ────────────────────────────────────────────────────────────────
  {
    key: "bookshelf",
    label: "Bookshelf",
    subtitle: "What has moved you",
    route: "/library/bookshelf",
    stage: "remember",
    access: "member",
    mobilePriority: 2,
    emotionalRole: "Reader",
    primaryAction: "Add a book",
  },
  {
    key: "seed-cellar",
    label: "Seed Cellar",
    subtitle: "Living knowledge archive",
    route: "/library/seed-cellar",
    stage: "remember",
    access: "steward",
    mobilePriority: 3,
    emotionalRole: "Keeper",
    primaryAction: "Browse seed library",
  },
  {
    key: "star-trail",
    label: "Star Trail",
    subtitle: "Your path through S33D",
    route: "/library/star-trail",
    stage: "remember",
    access: "member",
    mobilePriority: 0,
    emotionalRole: "Traveller",
    primaryAction: "Continue your path",
    aliases: ["/library/creators-path", "/library/resources", "/library/tree-resources"],
  },
  {
    key: "scrolls",
    label: "Scrolls & Records",
    subtitle: "The remembered rings of the grove",
    route: "/library/scrolls",
    stage: "remember",
    access: "steward",
    mobilePriority: 3,
    emotionalRole: "Archivist",
    primaryAction: "Open records",
    aliases: ["/library/ledger", "/library/volumes", "/library/archive"],
  },
  // ── Steward ─────────────────────────────────────────────────────────────────
  {
    key: "vault",
    label: "Vault",
    subtitle: "Hold value safely",
    route: "/library/vault",
    stage: "steward",
    access: "member",
    mobilePriority: 3,
    emotionalRole: "Guardian",
    primaryAction: "Open personal vault",
    // /vault remains a standalone protected deep-route (VaultPage) — not aliased here.
    // /library/vault is the Heartwood doorway (VaultRoom inside the shell).
  },
  {
    key: "rhythms",
    label: "Rhythms",
    subtitle: "Seasonal ecological cycles",
    route: "/library/rhythms",
    stage: "steward",
    access: "steward",
    mobilePriority: 3,
    emotionalRole: "Steward",
    primaryAction: "View seasonal pulse",
    aliases: ["/library/markets", "/library/cycle-market", "/library/cycle-markets"],
  },
  // ── Evolve ──────────────────────────────────────────────────────────────────
  {
    key: "tap-root",
    label: "Dev Room",
    subtitle: "Tap Root · Tend the system",
    route: "/library/tap-root",
    stage: "evolve",
    access: "advanced",
    mobilePriority: 4,
    emotionalRole: "Builder",
    primaryAction: "View system health",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Journey spine — Meet → Learn → Walk → Offer → Remember → Steward → Evolve
// ─────────────────────────────────────────────────────────────────────────────

export const JOURNEY_STAGES: JourneyStageConfig[] = [
  {
    key: "meet",
    label: "Meet",
    subtitle: "Encounter the living forest",
    rooms: ["gallery", "staff-room"],
  },
  {
    key: "learn",
    label: "Learn",
    subtitle: "Read the forest deeply",
    rooms: ["arborium"],
  },
  {
    key: "walk",
    label: "Walk",
    subtitle: "Move through the land",
    rooms: ["quest-cave", "music-room", "greenhouse"],
  },
  {
    key: "offer",
    label: "Offer",
    subtitle: "Name what you wish to give",
    rooms: ["wishlist"],
  },
  {
    key: "remember",
    label: "Remember",
    subtitle: "Preserve what has mattered",
    rooms: ["bookshelf", "seed-cellar", "star-trail", "scrolls"],
  },
  {
    key: "steward",
    label: "Steward",
    subtitle: "Guard the living economy",
    rooms: ["vault", "rhythms"],
  },
  {
    key: "evolve",
    label: "Evolve",
    subtitle: "Tend the system itself",
    rooms: ["tap-root"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Derived lookup maps
// ─────────────────────────────────────────────────────────────────────────────

/** Fast room lookup by key */
export const ROOM_BY_KEY = Object.fromEntries(
  HEARTWOOD_ROOMS.map((r) => [r.key, r])
) as Record<string, HeartwoodRoom>;

/** All valid room keys (forms /library/:key URL segments) */
export const ROOM_KEYS: string[] = HEARTWOOD_ROOMS.map((r) => r.key);

/** key → label map — matches the shape HeartwoodRoomPage uses */
export const ROOM_LABEL_MAP: Record<string, string> = Object.fromEntries(
  HEARTWOOD_ROOMS.map((r) => [r.key, r.label])
);

/** Journey-ordered room sequence (stage order, rooms within stage in order) */
export const JOURNEY_ROOM_SEQUENCE: string[] = JOURNEY_STAGES.flatMap((s) => s.rooms);

// ─────────────────────────────────────────────────────────────────────────────
// Access level config
// ─────────────────────────────────────────────────────────────────────────────

export interface AccessLevelConfig {
  key: AccessLevel;
  /** Short user-facing label */
  label: string;
  /** One-line description of who qualifies */
  description: string;
}

export const ACCESS_LEVEL_CONFIGS: AccessLevelConfig[] = [
  { key: "visitor",  label: "Visitor",  description: "Public — no sign-in required" },
  { key: "member",   label: "Member",   description: "Sign-in required" },
  { key: "steward",  label: "Steward",  description: "Curator or keeper role" },
  { key: "advanced", label: "Advanced", description: "Admin or developer access" },
];

/** Fast access-level config lookup */
export const ACCESS_LEVEL_BY_KEY: Record<AccessLevel, AccessLevelConfig> = Object.fromEntries(
  ACCESS_LEVEL_CONFIGS.map((a) => [a.key, a])
) as Record<AccessLevel, AccessLevelConfig>;

// ─────────────────────────────────────────────────────────────────────────────
// Derived groupings
// ─────────────────────────────────────────────────────────────────────────────

/** Rooms grouped by journey stage */
export const ROOMS_BY_STAGE: Record<JourneyStage, HeartwoodRoom[]> = Object.fromEntries(
  JOURNEY_STAGES.map((s) => [s.key, s.rooms.map((k) => ROOM_BY_KEY[k]).filter(Boolean)])
) as Record<JourneyStage, HeartwoodRoom[]>;

/** Rooms grouped by access level */
export const ROOMS_BY_ACCESS: Record<AccessLevel, HeartwoodRoom[]> = {
  visitor:  HEARTWOOD_ROOMS.filter((r) => r.access === "visitor"),
  member:   HEARTWOOD_ROOMS.filter((r) => r.access === "member"),
  steward:  HEARTWOOD_ROOMS.filter((r) => r.access === "steward"),
  advanced: HEARTWOOD_ROOMS.filter((r) => r.access === "advanced"),
};

/** Rooms visible without sign-in */
export const PUBLIC_ROOMS: HeartwoodRoom[] = HEARTWOOD_ROOMS.filter((r) => r.access === "visitor");

/** Rooms gated behind the advanced / dev role */
export const ADVANCED_ROOMS: HeartwoodRoom[] = HEARTWOOD_ROOMS.filter((r) => r.access === "advanced");

/** Rooms shown at the given mobile priority or above (lower = higher priority) */
export function getMobileRooms(maxPriority: MobilePriority): HeartwoodRoom[] {
  return HEARTWOOD_ROOMS.filter((r) => r.mobilePriority <= maxPriority);
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical route map  (key | alias-slug → canonical route)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps any room key or alias slug to its canonical /library/:key route.
 * Built from HEARTWOOD_ROOMS so it stays in sync automatically.
 *
 * Non-Heartwood routes (atlas, life-groves, press, …) are NOT included here —
 * keep those in the call-site route map so this file stays library-only.
 */
export const ROOM_ROUTE_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const room of HEARTWOOD_ROOMS) {
    map[room.key] = room.route;
    for (const alias of room.aliases ?? []) {
      // Extract the last path segment as the slug key
      const slug = alias.split("/").pop() ?? "";
      if (slug) map[slug] = room.route;
    }
  }
  return map;
})();
