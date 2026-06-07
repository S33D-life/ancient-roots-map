/**
 * LibraryRoomGrid — Architectural room tiles for the Heartwood Library.
 * Each room has a unique micro-animation, themed hover glow, and seasonal ambient shift.
 * "Every room in the library breathes differently."
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
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

/* ── Room interior glyph — symbolic silhouette behind the doorway ── */
function RoomInterior({ roomKey, h }: { roomKey: string; h: number }) {
  const chamber = `radial-gradient(ellipse at 50% 75%, hsl(${h} 55% 38% / 0.55), hsl(${h} 30% 14% / 0.95) 75%)`;

  const silhouette: Record<string, JSX.Element> = {
    "staff-room": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        <rect x="18" y="34" width="4" height="48" fill={`hsl(${h} 45% 38% / 0.55)`} />
        <rect x="32" y="28" width="4" height="54" fill={`hsl(${h} 45% 42% / 0.6)`} />
        <rect x="46" y="32" width="4" height="50" fill={`hsl(${h} 45% 40% / 0.55)`} />
        <rect x="60" y="26" width="4" height="56" fill={`hsl(${h} 45% 44% / 0.6)`} />
        <rect x="74" y="30" width="4" height="52" fill={`hsl(${h} 45% 40% / 0.55)`} />
      </svg>
    ),
    "star-trail": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-70">
        {[[25,70],[40,55],[55,40],[70,30],[82,22]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r={1.2} fill={`hsl(45 80% 70% / ${0.4 + i*0.1})`} />
        ))}
      </svg>
    ),
    "ancient-friends": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        <ellipse cx="50" cy="48" rx="26" ry="22" fill={`hsl(${h} 40% 35% / 0.6)`} />
        <rect x="47" y="60" width="6" height="28" fill={`hsl(25 40% 25% / 0.7)`} />
      </svg>
    ),
    "atlas": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-50">
        <path d="M15 55 Q35 40 50 55 T85 50" stroke={`hsl(${h} 50% 55% / 0.6)`} strokeWidth="1" fill="none" />
        <path d="M20 70 Q45 60 70 72" stroke={`hsl(${h} 40% 50% / 0.4)`} strokeWidth="1" fill="none" />
        <circle cx="58" cy="48" r="2" fill={`hsl(${h} 70% 65% / 0.8)`} />
      </svg>
    ),
    "life-groves": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-55">
        {[30,50,70].map((x,i)=>(
          <g key={i}>
            <circle cx={x} cy={50-i%2*4} r={10} fill={`hsl(${h+i*8} 45% 38% / 0.55)`} />
            <rect x={x-1} y={56} width={2} height={20} fill={`hsl(25 35% 22% / 0.6)`} />
          </g>
        ))}
      </svg>
    ),
    "quest-cave": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-70">
        <circle cx="50" cy="52" r="6" fill={`hsl(35 90% 60% / 0.5)`} />
        <circle cx="50" cy="52" r="2.5" fill={`hsl(45 95% 75% / 0.95)`} />
        <path d="M50 56 L50 78" stroke={`hsl(25 40% 28% / 0.7)`} strokeWidth="1.5" />
      </svg>
    ),
    "arborium": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-55">
        {[25,45,65,85].map((y,i)=>(
          <rect key={i} x="25" y={y-3} width="50" height="2" fill={`hsl(${h} 35% 35% / 0.6)`} />
        ))}
        {[35,55,75].map((x,i)=>(
          <circle key={i} cx={x} cy={25} r={3} fill={`hsl(${h+10} 50% 45% / 0.5)`} />
        ))}
      </svg>
    ),
    "music-room": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-65">
        <circle cx="50" cy="46" r="4" fill={`hsl(35 85% 60% / 0.7)`} />
        <rect x="48" y="50" width="4" height="18" fill={`hsl(25 30% 25% / 0.6)`} />
        {[20,30,40,55,70,80].map((x,i)=>(
          <rect key={i} x={x} y={78-(i%3)*4} width={2} height={(i%3)*4+4} fill={`hsl(${h} 50% 55% / 0.5)`} />
        ))}
      </svg>
    ),
    "bookshelf": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        {[22,32,42,52,62,72].map((x,i)=>(
          <rect key={i} x={x} y={30+(i%2)*3} width={6} height={45-(i%2)*3} fill={`hsl(${h+i*4} 40% 38% / 0.6)`} />
        ))}
      </svg>
    ),
    "scrolls": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        {[40,55,70].map((y,i)=>(
          <g key={i}>
            <circle cx="32" cy={y} r="3" fill={`hsl(${h} 40% 50% / 0.6)`} />
            <rect x="32" y={y-2} width="36" height="4" fill={`hsl(${h} 35% 45% / 0.5)`} />
            <circle cx="68" cy={y} r="3" fill={`hsl(${h} 40% 50% / 0.6)`} />
          </g>
        ))}
      </svg>
    ),
    "press": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-55">
        <path d="M50 28 L52 60 L48 60 Z" fill={`hsl(${h} 50% 55% / 0.6)`} />
        <rect x="35" y="62" width="30" height="14" fill={`hsl(${h} 30% 35% / 0.5)`} />
      </svg>
    ),
    "vault": (
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-60">
        <circle cx="50" cy="50" r="18" fill="none" stroke={`hsl(${h} 50% 50% / 0.55)`} strokeWidth="2" />
        <circle cx="50" cy="50" r="3" fill={`hsl(${h} 60% 60% / 0.7)`} />
      </svg>
    ),
  };

  return (
    <div className="absolute inset-0" style={{ background: chamber }}>
      {silhouette[roomKey] ?? null}
    </div>
  );
}

/* ── Room Tile — round doorway portal carved into the trunk ── */
function RoomTile({ room, idx, seasonShift, onSelect }: { room: Room; idx: number; seasonShift: number; onSelect: (key: string) => void }) {
  const h = room.accentH + seasonShift;
  // Warm golden ring — unifies the threshold language across the library.
  const goldH = 38 + seasonShift;
  return (
    <motion.button
      key={room.key}
      onClick={() => onSelect(room.key)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex flex-col items-center text-center px-3 pt-4 pb-4 rounded-2xl transition-all duration-500 overflow-hidden"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, hsl(${goldH} 25% 12% / 0.55), hsl(${h} 14% 7% / 0.85))`,
        border: `1px solid hsl(${goldH} 30% 22% / 0.25)`,
      }}
    >
      {/* Portal */}
      <div
        className="relative aspect-square w-[78%] max-w-[140px] rounded-full mb-3 transition-all duration-700"
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
        }}
      >
        <div
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{
            boxShadow: `inset 0 0 18px hsl(${h} 30% 4% / 0.85), inset 0 0 0 1px hsl(${goldH} 50% 30% / 0.4)`,
          }}
        >
          <RoomInterior roomKey={room.key} h={h} />
          {/* Sigil glyph centered over chamber */}
          <div
            className="absolute inset-0 flex items-center justify-center text-2xl md:text-3xl transition-transform duration-700 group-hover:scale-105"
            style={{
              filter: `drop-shadow(0 0 6px hsl(${goldH} 70% 55% / 0.35))`,
              opacity: 0.85,
            }}
            aria-hidden="true"
          >
            {room.emoji}
          </div>
          {/* Threshold illumination on hover/tap */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 100%, hsl(${goldH} 80% 55% / 0.22), transparent 65%)`,
            }}
          />
        </div>
      </div>

      {/* Engraved title */}
      <h3
        className="font-serif text-[13px] md:text-sm leading-tight tracking-wide relative z-10"
        style={{
          color: `hsl(${goldH} 55% 70% / 0.92)`,
          textShadow: `0 0 8px hsl(${goldH} 60% 40% / 0.25)`,
        }}
      >
        {roomLabel(room.key, room.label)}
      </h3>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
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
