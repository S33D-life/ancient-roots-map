/**
 * LibraryRoomGrid — Architectural room tiles for the Heartwood Library.
 * Each room has a unique micro-animation, themed hover glow, and seasonal ambient shift.
 * "Every room in the library breathes differently."
 */
import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { HEARTWOOD_ROOMS } from "@/config/heartwoodRooms";

/* ── Canonical label resolver ──
 * Structural room *names* derive from the Heartwood registry (single source of
 * truth), keyed by room key and by alias slug (e.g. "ancient-friends" → gallery).
 * Visual accents — emoji, accentH, particle, atmospheric `desc` — stay local.
 * Tiles that are not Heartwood rooms (atlas, life-groves, press, tree-data-commons)
 * fall back to their local `label`. */
const REGISTRY_LABEL: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const room of HEARTWOOD_ROOMS) {
    map[room.key] = room.label;
    for (const alias of room.aliases ?? []) {
      const slug = alias.split("/").pop();
      if (slug) map[slug] = room.label;
    }
  }
  return map;
})();

/** Display name for a tile: registry label if it's a Heartwood room, else the local fallback. */
function roomLabel(key: string, fallback: string): string {
  return REGISTRY_LABEL[key] ?? fallback;
}

/* ── Room definitions — visual accents local, names derive from the registry ──
 * `emoji` + `desc` + `accentH` + `particle` are local visual/atmospheric accents.
 * `label` is a fallback name only; the displayed name comes from `roomLabel()`. */
type Room = { key: string; emoji: string; label: string; desc: string; accentH: number; particle: string };

const PRIMARY: Room[] = [
  { key: "staff-room",      emoji: "🪵", label: "Staff Room",      desc: "144 Sacred Staffs",                        accentH: 280, particle: "wand"    },
  { key: "star-trail",      emoji: "✨", label: "Star Trail",      desc: "Your Journey",                             accentH: 340, particle: "spark"   },
  { key: "ancient-friends", emoji: "🌳", label: "Ancient Friends", desc: "Gallery of Ancient Trees",                 accentH: 140, particle: "leaf"    },
  { key: "atlas",           emoji: "🗺", label: "Map Room",        desc: "Atlas · Countries · Bio Regions",          accentH: 200, particle: "compass" },
  { key: "life-groves",     emoji: "🌿", label: "Life Groves",     desc: "Births, memorials, unions & family trees", accentH: 105, particle: "leaf"    },
  { key: "quest-cave",      emoji: "🕯", label: "Quest Cave",      desc: "Species paths, hives & ancient ways",      accentH: 35,  particle: "spark"   },
  { key: "arborium",        emoji: "🌿", label: "The Arborium",    desc: "Living field guide of the forest",         accentH: 95,  particle: "leaf"    },
];

const LIVING_LIBRARY: Room[] = [
  { key: "music-room",    emoji: "🎵", label: "Music Room",       desc: "Tree Radio",                    accentH: 260, particle: "wave"    },
  { key: "bookshelf",     emoji: "📚", label: "Bookshelf",        desc: "Your Reading Journey",          accentH: 25,  particle: "shimmer" },
  { key: "scrolls",       emoji: "📜", label: "Scrolls & Records", desc: "Council Records",               accentH: 42,  particle: "shimmer" },
  { key: "press",         emoji: "🪶", label: "Print Press",      desc: "Where reading becomes writing", accentH: 35,  particle: "shimmer" },
  { key: "vault",         emoji: "🔐", label: "Vault",            desc: "Staff, Tokens & Treasures",     accentH: 270, particle: "shimmer" },
];

const GROWING_SPACES: Room[] = [
  { key: "seed-cellar", emoji: "📦", label: "Seed Cellar", desc: "Living Data Archive",         accentH: 30,  particle: "seed" },
  { key: "greenhouse",  emoji: "🌱", label: "Greenhouse",  desc: "Houseplants & Saplings",      accentH: 130, particle: "leaf" },
  { key: "wishlist",    emoji: "⭐", label: "Wishing Tree", desc: "Trees you dream to visit",    accentH: 45,  particle: "star" },
];

const COMMUNITY_ATLAS: Room[] = [
  { key: "tree-data-commons", emoji: "🔭", label: "Tree Data Commons", desc: "Knowledge Observatory",     accentH: 160, particle: "page"  },
  { key: "rhythms",           emoji: "🌿", label: "Rhythms",           desc: "Seasonal Cycle Markets",    accentH: 150, particle: "leaf"  },
  { key: "tap-root",          emoji: "⚙️", label: "Dev Room",           desc: "Tap Root · Infrastructure", accentH: 210, particle: "spark" },
];

/* ── Seasonal ambient hue offset (subtle) ── */
function getSeasonalShift(): number {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 5;   // spring — slightly warmer
  if (month >= 5 && month <= 7) return 10;  // summer — golden push
  if (month >= 8 && month <= 10) return -5; // autumn — cooler amber
  return -10;                                // winter — blue-cool shift
}

/* ── Micro-animation particles ── */
function RoomParticles({ type, accentH }: { type: string; accentH: number }) {
  const particles = useMemo(() => {
    switch (type) {
      case "leaf":
        return Array.from({ length: 3 }, (_, i) => ({
          id: i,
          x: 20 + i * 30,
          delay: i * 0.8,
          char: "🍃",
          animation: { y: [0, -6, 0], rotate: [0, 15, -10, 0], opacity: [0.3, 0.6, 0.3] },
          duration: 3 + i * 0.5,
        }));
      case "wave":
        return Array.from({ length: 4 }, (_, i) => ({
          id: i,
          x: 15 + i * 20,
          delay: i * 0.3,
          char: "",
          animation: { scaleY: [0.3, 1, 0.3], opacity: [0.2, 0.5, 0.2] },
          duration: 1.5 + i * 0.2,
        }));
      case "shimmer":
        return Array.from({ length: 5 }, (_, i) => ({
          id: i,
          x: 10 + i * 18,
          delay: i * 0.4,
          char: "✦",
          animation: { opacity: [0, 0.6, 0], scale: [0.8, 1.1, 0.8] },
          duration: 2.5 + i * 0.3,
        }));
      case "spark":
        return Array.from({ length: 3 }, (_, i) => ({
          id: i,
          x: 25 + i * 25,
          delay: i * 0.6,
          char: "✧",
          animation: { opacity: [0.1, 0.7, 0.1], y: [0, -4, 0] },
          duration: 2 + i * 0.4,
        }));
      default:
        return [];
    }
  }, [type]);

  if (type === "wave") {
    return (
      <div className="absolute bottom-2 right-3 flex items-end gap-[3px] pointer-events-none z-0">
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="w-[2px] rounded-full"
            style={{ background: `hsl(${accentH} 50% 55% / 0.4)`, height: 12 }}
            animate={p.animation}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute text-[8px] select-none"
          style={{
            left: `${p.x}%`,
            bottom: "12%",
            color: `hsl(${accentH} 40% 55% / 0.5)`,
          }}
          animate={p.animation}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        >
          {p.char}
        </motion.span>
      ))}
    </div>
  );
}

/* ── Ember drift — always visible near mantle area (used externally too) ── */
export function EmberDrift() {
  const embers = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 15 + Math.random() * 70,
        size: 2 + Math.random() * 3,
        delay: i * 1.2,
        duration: 4 + Math.random() * 3,
      })),
    []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {embers.map((e) => (
        <motion.div
          key={e.id}
          className="absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: "10%",
            width: e.size,
            height: e.size,
            background: "hsl(25 90% 55% / 0.6)",
            boxShadow: "0 0 6px hsl(25 80% 50% / 0.4)",
          }}
          animate={{
            y: [0, -40 - Math.random() * 30],
            x: [0, (Math.random() - 0.5) * 20],
            opacity: [0, 0.7, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: e.duration,
            repeat: Infinity,
            delay: e.delay,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/* ── Room temperature families ──
 * Each room belongs to an ecological tonal family. The oak trunk stays consistent;
 * only the light beneath the door, the sign glow, and the interior warmth shift. */
function familyHue(key: string): number {
  switch (key) {
    // Golden / Amber
    case "staff-room":
    case "bookshelf":
    case "scrolls":
    case "press":
    case "seed-cellar":
      return 38;
    // Green living glow
    case "ancient-friends":
    case "arborium":
    case "life-groves":
    case "greenhouse":
    case "rhythms":
      return 128;
    // Blue cartographic
    case "atlas":
    case "tree-data-commons":
      return 205;
    // Violet resonant
    case "music-room":
    case "star-trail":
    case "vault":
      return 268;
    // Ember cave
    case "quest-cave":
    case "tap-root":
      return 22;
    // Wishing — soft warm star
    case "wishlist":
      return 48;
    default:
      return 38;
  }
}

/* Deterministic small asymmetry seed from a string key (0..1). */
function asymSeed(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const v = ((h >>> 0) % 1000) / 1000;
  return v;
}

/* ── Faint interior glimpse — silhouettes seen through the threshold spill ──
 * Drawn just above the floor, where warm light bleeds beneath the door.
 * Atmospheric implication, not illustration. */
function InteriorGlimpse({ roomKey, tempH }: { roomKey: string; tempH: number }) {
  const stroke = `hsl(${tempH} 60% 70% / 0.22)`;
  const fill = `hsl(${tempH} 50% 18% / 0.55)`;
  const warm = `hsl(${tempH} 80% 60% / 0.18)`;

  switch (roomKey.replace(/-(l|r)$/, "")) {
    case "staff-room":
      // Three leaning staffs in shadow + ember low glow
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          <line x1="40" y1="92" x2="44" y2="68" stroke={fill} strokeWidth="1.2" />
          <line x1="50" y1="92" x2="49" y2="64" stroke={fill} strokeWidth="1.4" />
          <line x1="60" y1="92" x2="56" y2="70" stroke={fill} strokeWidth="1.1" />
          <circle cx="49" cy="64" r="1.1" fill={stroke} />
        </g>
      );
    case "scrolls":
      // Shelf depth + candle edge
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="24" ry="2" fill={warm} />
          <line x1="30" y1="88" x2="70" y2="88" stroke={fill} strokeWidth="0.6" />
          <rect x="34" y="82" width="3" height="6" fill={fill} />
          <rect x="38.5" y="80" width="3" height="8" fill={fill} />
          <rect x="43" y="83" width="3" height="5" fill={fill} />
          <rect x="58" y="81" width="3" height="7" fill={fill} />
          <rect x="62.5" y="84" width="3" height="4" fill={fill} />
          <circle cx="52" cy="84" r="1" fill={`hsl(38 90% 65% / 0.65)`} />
        </g>
      );
    case "music-room":
      // Dim equalizer bars + violet resonance
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          {[36, 41, 46, 51, 56, 61].map((x, i) => (
            <rect
              key={i}
              x={x}
              y={88 - (3 + ((i * 7) % 6))}
              width="2"
              height={3 + ((i * 7) % 6)}
              fill={fill}
              opacity="0.85"
            />
          ))}
        </g>
      );
    case "arborium":
      // Herbarium leaf silhouettes on shelf
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          <line x1="32" y1="88" x2="68" y2="88" stroke={fill} strokeWidth="0.5" />
          <ellipse cx="38" cy="85" rx="3" ry="1.6" fill={fill} />
          <ellipse cx="46" cy="84" rx="2.6" ry="1.4" fill={fill} />
          <ellipse cx="55" cy="85" rx="3.2" ry="1.6" fill={fill} />
          <ellipse cx="63" cy="84" rx="2.4" ry="1.3" fill={fill} />
        </g>
      );
    case "ancient-friends":
    case "life-groves":
    case "greenhouse":
    case "rhythms":
      // Distant grove silhouettes
      return (
        <g opacity="0.85">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          <path d="M34 88 Q36 78 40 88 Z" fill={fill} />
          <path d="M44 88 Q47 74 51 88 Z" fill={fill} />
          <path d="M55 88 Q58 80 62 88 Z" fill={fill} />
        </g>
      );
    case "atlas":
    case "tree-data-commons":
      // Faint map lines + brass compass dot
      return (
        <g opacity="0.85">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          <path d="M32 87 Q45 82 68 88" stroke={stroke} strokeWidth="0.5" fill="none" />
          <path d="M34 90 Q52 86 66 90" stroke={stroke} strokeWidth="0.4" fill="none" />
          <circle cx="50" cy="86" r="1.4" fill="none" stroke={`hsl(40 50% 55% / 0.55)`} strokeWidth="0.4" />
          <line x1="50" y1="84.6" x2="50" y2="87.4" stroke={`hsl(40 60% 60% / 0.6)`} strokeWidth="0.3" />
        </g>
      );
    case "bookshelf":
      // Stacked books + a reading chair silhouette
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          <rect x="35" y="82" width="2.5" height="6" fill={fill} />
          <rect x="38" y="80" width="2.5" height="8" fill={fill} />
          <rect x="41" y="83" width="2.5" height="5" fill={fill} />
          <path d="M55 88 Q55 82 60 82 L62 82 Q62 88 62 88 Z" fill={fill} />
          <rect x="56" y="86" width="6" height="2" fill={fill} />
        </g>
      );
    case "star-trail":
      // Faint star points
      return (
        <g opacity="0.9">
          <ellipse cx="50" cy="91" rx="20" ry="2" fill={warm} />
          {[
            [36, 84], [44, 80], [52, 85], [58, 79], [64, 83],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="0.6" fill={`hsl(${tempH} 80% 80% / 0.7)`} />
          ))}
        </g>
      );
    case "quest-cave":
    case "tap-root":
      // Ember low glow + cave wall hint
      return (
        <g opacity="0.95">
          <ellipse cx="50" cy="91" rx="22" ry="2.2" fill={`hsl(20 90% 55% / 0.28)`} />
          <circle cx="50" cy="89" r="2" fill={`hsl(22 95% 60% / 0.6)`} />
        </g>
      );
    case "seed-cellar":
    case "wishlist":
      return (
        <g opacity="0.85">
          <ellipse cx="50" cy="91" rx="22" ry="2" fill={warm} />
          {[40, 46, 52, 58, 64].map((x, i) => (
            <circle key={i} cx={x} cy={87 - (i % 2)} r="0.9" fill={fill} />
          ))}
        </g>
      );
    case "vault":
      return (
        <g opacity="0.85">
          <ellipse cx="50" cy="91" rx="20" ry="2" fill={warm} />
          <rect x="44" y="82" width="12" height="7" fill={fill} />
          <circle cx="50" cy="85.5" r="1" fill={`hsl(${tempH} 60% 60% / 0.6)`} />
        </g>
      );
    case "press":
      return (
        <g opacity="0.85">
          <ellipse cx="50" cy="91" rx="20" ry="2" fill={warm} />
          <rect x="40" y="82" width="20" height="6" fill={fill} />
          <line x1="40" y1="85" x2="60" y2="85" stroke={stroke} strokeWidth="0.4" />
        </g>
      );
    default:
      return (
        <g opacity="0.6">
          <ellipse cx="50" cy="91" rx="20" ry="2" fill={warm} />
        </g>
      );
  }
}

/* ── Wooden door face with a hanging carved sign (symbol + room name) ── */
function WoodenDoor({ roomKey, label, emoji, h, goldH, tempH, seed }: {
  roomKey: string; label: string; emoji: string; h: number; goldH: number; tempH: number; seed: number;
}) {
  // Warm oak palette — independent of room hue so all doors feel like one trunk.
  const wood1 = `hsl(28 38% 22%)`;
  const wood2 = `hsl(26 42% 16%)`;
  const wood3 = `hsl(30 36% 28%)`;
  const grainDark = `hsl(24 40% 12% / 0.55)`;
  const grainLight = `hsl(32 45% 35% / 0.35)`;

  const plankCount = 5;
  const planks = Array.from({ length: plankCount }, (_, i) => i);

  // Sign warmth follows the room's temperature family (subtle).
  const signWood1 = `hsl(28 40% 30%)`;
  const signWood2 = `hsl(28 45% 22%)`;
  const signText = `hsl(${tempH} 55% 78%)`;
  const signGlow = `hsl(${tempH} 80% 55% / 0.5)`;
  const thresholdSpill = `hsl(${tempH} 80% 55% / 0.32)`;

  // Asymmetry: tiny plaque tilt and knob/light offsets seeded by the room key.
  const plaqueTilt = (seed - 0.5) * 2.4;            // ±1.2°
  const plaqueDx = (seed - 0.5) * 1.2;              // ±0.6
  const knobDx = (seed - 0.5) * 6;                  // ±3
  const spillDx = (seed - 0.5) * 6;                 // ±3

  const words = label.replace(/&/g, "and").split(" ").filter(Boolean);
  const line1 = words[0] ?? label;
  const line2 = words.slice(1).join(" ");

  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`door-light-${roomKey}`} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor={wood3} />
          <stop offset="60%" stopColor={wood1} />
          <stop offset="100%" stopColor={wood2} />
        </radialGradient>
        <linearGradient id={`sign-wood-${roomKey}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={signWood1} />
          <stop offset="100%" stopColor={signWood2} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="100" height="100" fill={`url(#door-light-${roomKey})`} />

      {planks.map((i) => {
        const plankW = 100 / plankCount;
        const x = i * plankW;
        return (
          <g key={i}>
            <line x1={x} y1="0" x2={x} y2="100" stroke={grainDark} strokeWidth="0.8" />
            <path
              d={`M${x + plankW * 0.2} 0 Q${x + plankW * 0.5} 50 ${x + plankW * 0.3} 100`}
              stroke={grainLight}
              strokeWidth="0.4"
              fill="none"
              opacity="0.5"
            />
            <path
              d={`M${x + plankW * 0.7} 0 Q${x + plankW * 0.4} 50 ${x + plankW * 0.6} 100`}
              stroke={grainDark}
              strokeWidth="0.35"
              fill="none"
              opacity="0.5"
            />
          </g>
        );
      })}

      {/* Horizontal cross-beam */}
      <rect x="2" y="56" width="96" height="6" fill={wood2} opacity="0.85" />
      <rect x="2" y="56" width="96" height="1" fill={grainDark} />
      <rect x="2" y="61" width="96" height="1" fill={grainDark} />

      {/* Iron knob (slightly offset per door) */}
      <circle cx={68 + knobDx} cy="59" r="2.4" fill={`hsl(35 25% 18%)`} />
      <circle cx={68 + knobDx} cy="58.4" r="1" fill={`hsl(45 35% 45% / 0.7)`} />

      {/* Hanging sign — rope + carved plaque (slightly tilted) */}
      <line x1={38 + plaqueDx} y1="6" x2={42 + plaqueDx} y2="20" stroke={`hsl(30 30% 22%)`} strokeWidth="0.6" />
      <line x1={62 + plaqueDx} y1="6" x2={58 + plaqueDx} y2="20" stroke={`hsl(30 30% 22%)`} strokeWidth="0.6" />

      <g transform={`rotate(${plaqueTilt} 50 34) translate(${plaqueDx} 0)`}>
        <rect
          x="20"
          y="18"
          width="60"
          height="32"
          rx="3"
          fill={`url(#sign-wood-${roomKey})`}
          stroke={`hsl(${tempH} 50% 30% / 0.8)`}
          strokeWidth="0.6"
        />
        <rect
          x="22"
          y="20"
          width="56"
          height="28"
          rx="2"
          fill="none"
          stroke={`hsl(${tempH} 60% 50% / 0.35)`}
          strokeWidth="0.4"
        />

        <text
          x="32"
          y="36"
          fontSize="11"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{ filter: `drop-shadow(0 0 1.5px ${signGlow})` }}
        >
          {emoji}
        </text>

        {line2 ? (
          <>
            <text
              x="56" y="31" fontSize="5.2" textAnchor="middle"
              fontFamily="ui-serif, Georgia, serif" fill={signText}
              style={{ letterSpacing: "0.05em" }}
            >
              {line1.toUpperCase()}
            </text>
            <text
              x="56" y="40" fontSize="5.2" textAnchor="middle"
              fontFamily="ui-serif, Georgia, serif" fill={signText}
              style={{ letterSpacing: "0.05em" }}
            >
              {line2.toUpperCase()}
            </text>
          </>
        ) : (
          <text
            x="56" y="37" fontSize="5.4" textAnchor="middle"
            fontFamily="ui-serif, Georgia, serif" fill={signText}
            style={{ letterSpacing: "0.05em" }}
          >
            {line1.toUpperCase()}
          </text>
        )}
      </g>

      {/* Faint interior glimpse beneath the door */}
      <InteriorGlimpse roomKey={roomKey} tempH={tempH} />

      {/* Floor shadow */}
      <rect x="0" y="92" width="100" height="8" fill={`hsl(20 30% 6% / 0.6)`} />

      {/* Warm threshold light spilling under the door (offset by seed) */}
      <ellipse cx={50 + spillDx} cy="95" rx="36" ry="3" fill={thresholdSpill} />
    </svg>
  );
}

/* ── Room Tile — round doorway carved into the trunk ── */
function RoomTile({ room, idx, seasonShift, onSelect }: { room: Room; idx: number; seasonShift: number; onSelect: (key: string) => void }) {
  const h = room.accentH + seasonShift;
  const goldH = 38 + seasonShift;
  const prefersReduced = useReducedMotion();
  const [opening, setOpening] = useState(false);

  const handleSelect = () => {
    if (opening) return;
    if (prefersReduced) {
      onSelect(room.key);
      return;
    }
    setOpening(true);
    // Let the door swing open before navigating
    window.setTimeout(() => onSelect(room.key), 460);
  };

  return (
    <motion.button
      key={room.key}
      onClick={handleSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.4, ease: "easeOut" }}
      whileHover={opening ? undefined : { y: -1 }}
      whileTap={opening ? undefined : { scale: 0.98 }}
      className="group relative flex flex-col items-center text-center px-3 pt-4 pb-4 rounded-2xl transition-all duration-500 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, hsl(${goldH} 25% 12% / 0.55), hsl(${h} 14% 7% / 0.85))`,
        border: `1px solid hsl(${goldH} 30% 22% / 0.25)`,
      }}
    >
      {/* Portal ring */}
      <motion.div
        className="relative aspect-square w-[78%] max-w-[140px] rounded-full mb-3"
        animate={
          opening
            ? {
                boxShadow: [
                  `0 0 0 1px hsl(${goldH} 50% 35% / 0.35), 0 6px 18px hsl(${goldH} 40% 6% / 0.55), inset 0 1px 0 hsl(${goldH} 70% 70% / 0.18)`,
                  `0 0 0 2px hsl(${goldH} 80% 60% / 0.7), 0 0 38px hsl(${goldH} 80% 55% / 0.7), inset 0 1px 0 hsl(${goldH} 90% 85% / 0.5)`,
                ],
              }
            : undefined
        }
        transition={{ duration: 0.45, ease: "easeOut" }}
        style={{
          background: `
            radial-gradient(circle at 50% 35%, hsl(${goldH} 55% 45% / 0.35), transparent 62%),
            conic-gradient(from 210deg, hsl(${goldH} 45% 32%), hsl(${goldH} 60% 48%), hsl(${goldH} 35% 25%), hsl(${goldH} 55% 42%), hsl(${goldH} 45% 32%))
          `,
          padding: 6,
          boxShadow: `
            0 0 0 1px hsl(${goldH} 50% 35% / 0.35),
            0 6px 18px hsl(${goldH} 40% 6% / 0.55),
            inset 0 1px 0 hsl(${goldH} 70% 70% / 0.18)
          `,
          transition: "box-shadow 700ms ease",
        }}
      >
        <div
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{
            boxShadow: `inset 0 0 18px hsl(20 40% 4% / 0.85), inset 0 0 0 1px hsl(${goldH} 50% 30% / 0.4)`,
            perspective: 600,
          }}
        >
          {/* Door splits into two halves that swing open on tap */}
          <motion.div
            className="absolute inset-0"
            style={{
              clipPath: "inset(0 50% 0 0)",
              transformOrigin: "left center",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
            animate={opening ? { rotateY: -82, x: -2 } : { rotateY: 0, x: 0 }}
            transition={{ duration: 0.55, ease: [0.6, 0.05, 0.3, 0.95] }}
          >
            <WoodenDoor
              roomKey={room.key + "-l"}
              label={roomLabel(room.key, room.label)}
              emoji={room.emoji}
              h={h}
              goldH={goldH}
            />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            style={{
              clipPath: "inset(0 0 0 50%)",
              transformOrigin: "right center",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
            animate={opening ? { rotateY: 82, x: 2 } : { rotateY: 0, x: 0 }}
            transition={{ duration: 0.55, ease: [0.6, 0.05, 0.3, 0.95] }}
          >
            <WoodenDoor
              roomKey={room.key + "-r"}
              label={roomLabel(room.key, room.label)}
              emoji={room.emoji}
              h={h}
              goldH={goldH}
            />
          </motion.div>

          {/* Warm interior light revealed as the door opens */}
          <AnimatePresence>
            {opening && (
              <motion.div
                key="interior-glow"
                className="absolute inset-0 rounded-full pointer-events-none"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1.05 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{
                  background: `radial-gradient(circle at 50% 50%, hsl(${goldH} 90% 70% / 0.85), hsl(${goldH} 75% 50% / 0.45) 45%, transparent 75%)`,
                  mixBlendMode: "screen",
                }}
              />
            )}
          </AnimatePresence>

          {/* Threshold illumination on hover/tap (kept for non-opening hover) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 100%, hsl(${goldH} 80% 55% / 0.28), transparent 65%)`,
            }}
          />
        </div>
      </motion.div>

      {/* Engraved title beneath the portal */}
      <motion.h3
        className="font-serif text-[13px] md:text-sm leading-tight tracking-wide relative z-10"
        animate={opening ? { color: `hsl(${goldH} 80% 85% / 1)` } : {}}
        transition={{ duration: 0.45 }}
        style={{
          color: `hsl(${goldH} 55% 70% / 0.92)`,
          textShadow: `0 0 8px hsl(${goldH} 60% 40% / 0.25)`,
        }}
      >
        {roomLabel(room.key, room.label)}
      </motion.h3>
      <p
        className="text-[10.5px] md:text-[11px] mt-1 relative z-10 leading-snug"
        style={{ color: `hsl(${goldH} 20% 60% / 0.4)` }}
      >
        {room.desc}
      </p>
    </motion.button>
  );
}


/* ── Section Header ── */
function SectionHeader({ label, seasonShift }: { label: string; seasonShift: number }) {
  return (
    <p
      className="font-serif text-[10px] tracking-[0.25em] uppercase col-span-2 md:col-span-3 mt-4 mb-1"
      style={{ color: `hsl(${38 + seasonShift} 25% 50% / 0.35)` }}
    >
      {label}
    </p>
  );
}

/* ── Main Grid ── */
interface Props {
  onRoomSelect: (key: string) => void;
}

export default function LibraryRoomGrid({ onRoomSelect }: Props) {
  const seasonShift = useMemo(() => getSeasonalShift(), []);

  const groups: { label: string; rooms: Room[] }[] = [
    { label: "Primary Rooms", rooms: PRIMARY },
    { label: "Living Library", rooms: LIVING_LIBRARY },
    { label: "Growing Spaces", rooms: GROWING_SPACES },
    { label: "Community & Atlas", rooms: COMMUNITY_ATLAS },
  ];

  let runningIdx = 0;

  return (
    <div className="w-full max-w-2xl pb-32">
      <p
        className="font-serif text-xs tracking-[0.2em] uppercase text-center mb-5"
        style={{ color: `hsl(${38 + seasonShift} 30% 50% / 0.5)` }}
      >
        Rooms of the Library
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 md:gap-x-5 md:gap-y-7">
        {groups.map((g) => (
          <div key={g.label} className="contents">
            <SectionHeader label={g.label} seasonShift={seasonShift} />
            {g.rooms.map((room) => {
              const idx = runningIdx++;
              return (
                <RoomTile
                  key={room.key}
                  room={room}
                  idx={idx}
                  seasonShift={seasonShift}
                  onSelect={onRoomSelect}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
