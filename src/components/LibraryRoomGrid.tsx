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

/* ── Wooden door face with a hanging carved sign (symbol + room name) ── */
function WoodenDoor({ roomKey, label, emoji, h, goldH }: {
  roomKey: string; label: string; emoji: string; h: number; goldH: number;
}) {
  // Warm oak palette — independent of room hue so all doors feel like one trunk.
  const wood1 = `hsl(28 38% 22%)`;
  const wood2 = `hsl(26 42% 16%)`;
  const wood3 = `hsl(30 36% 28%)`;
  const grainDark = `hsl(24 40% 12% / 0.55)`;
  const grainLight = `hsl(32 45% 35% / 0.35)`;

  // Plank count varies by door for subtle individuality.
  const plankCount = 5;
  const planks = Array.from({ length: plankCount }, (_, i) => i);

  // Sign tint shifts very slightly with room hue so it feels related to its chamber.
  const signWood1 = `hsl(${28} 40% 30%)`;
  const signWood2 = `hsl(${28} 45% 22%)`;
  const signText = `hsl(${goldH} 70% 78%)`;
  const signGlow = `hsl(${goldH} 80% 55% / 0.5)`;

  // Short title — split into up to 2 lines for the sign.
  const words = label.replace(/&/g, "and").split(" ").filter(Boolean);
  let line1 = words[0] ?? label;
  let line2 = words.slice(1).join(" ");
  if (!line2 && line1.length > 9) {
    // single long word — keep on one line, shrink will handle it
  }

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

      {/* Door face fills the circular chamber */}
      <rect x="0" y="0" width="100" height="100" fill={`url(#door-light-${roomKey})`} />

      {/* Vertical planks with grain */}
      {planks.map((i) => {
        const plankW = 100 / plankCount;
        const x = i * plankW;
        return (
          <g key={i}>
            {/* plank seam shadow */}
            <line x1={x} y1="0" x2={x} y2="100" stroke={grainDark} strokeWidth="0.8" />
            {/* faint grain streaks */}
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

      {/* Horizontal cross-beam (hobbit-door bar) */}
      <rect x="2" y="56" width="96" height="6" fill={wood2} opacity="0.85" />
      <rect x="2" y="56" width="96" height="1" fill={grainDark} />
      <rect x="2" y="61" width="96" height="1" fill={grainDark} />

      {/* Round iron knob on the bar */}
      <circle cx="68" cy="59" r="2.4" fill={`hsl(35 25% 18%)`} />
      <circle cx="68" cy="58.4" r="1" fill={`hsl(45 35% 45% / 0.7)`} />

      {/* Hanging sign — rope + carved wooden plaque with symbol + name */}
      {/* rope */}
      <line x1="38" y1="6" x2="42" y2="20" stroke={`hsl(30 30% 22%)`} strokeWidth="0.6" />
      <line x1="62" y1="6" x2="58" y2="20" stroke={`hsl(30 30% 22%)`} strokeWidth="0.6" />

      {/* plaque */}
      <g>
        <rect
          x="20"
          y="18"
          width="60"
          height="32"
          rx="3"
          fill={`url(#sign-wood-${roomKey})`}
          stroke={`hsl(${goldH} 50% 30% / 0.8)`}
          strokeWidth="0.6"
        />
        {/* inner engraved bevel */}
        <rect
          x="22"
          y="20"
          width="56"
          height="28"
          rx="2"
          fill="none"
          stroke={`hsl(${goldH} 60% 50% / 0.35)`}
          strokeWidth="0.4"
        />

        {/* symbol */}
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

        {/* room name — engraved gold */}
        {line2 ? (
          <>
            <text
              x="56"
              y="31"
              fontSize="5.2"
              textAnchor="middle"
              fontFamily="ui-serif, Georgia, serif"
              fill={signText}
              style={{ letterSpacing: "0.05em" }}
            >
              {line1.toUpperCase()}
            </text>
            <text
              x="56"
              y="40"
              fontSize="5.2"
              textAnchor="middle"
              fontFamily="ui-serif, Georgia, serif"
              fill={signText}
              style={{ letterSpacing: "0.05em" }}
            >
              {line2.toUpperCase()}
            </text>
          </>
        ) : (
          <text
            x="56"
            y="37"
            fontSize="5.4"
            textAnchor="middle"
            fontFamily="ui-serif, Georgia, serif"
            fill={signText}
            style={{ letterSpacing: "0.05em" }}
          >
            {line1.toUpperCase()}
          </text>
        )}
      </g>

      {/* Floor shadow under door */}
      <rect x="0" y="92" width="100" height="8" fill={`hsl(20 30% 6% / 0.55)`} />

      {/* Warm threshold light spilling under the door */}
      <ellipse cx="50" cy="95" rx="36" ry="3" fill={`hsl(${goldH} 80% 55% / 0.35)`} />
    </svg>
  );
}

/* ── Room Tile — round doorway carved into the trunk ── */
function RoomTile({ room, idx, seasonShift, onSelect }: { room: Room; idx: number; seasonShift: number; onSelect: (key: string) => void }) {
  const h = room.accentH + seasonShift;
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
      {/* Portal ring */}
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
            boxShadow: `inset 0 0 18px hsl(20 40% 4% / 0.85), inset 0 0 0 1px hsl(${goldH} 50% 30% / 0.4)`,
          }}
        >
          <WoodenDoor
            roomKey={room.key}
            label={roomLabel(room.key, room.label)}
            emoji={room.emoji}
            h={h}
            goldH={goldH}
          />

          {/* Threshold illumination on hover/tap */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 group-active:opacity-100 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 100%, hsl(${goldH} 80% 55% / 0.28), transparent 65%)`,
            }}
          />
        </div>
      </div>

      {/* Engraved title beneath the portal */}
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
