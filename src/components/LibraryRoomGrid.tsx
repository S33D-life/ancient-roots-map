/**
 * LibraryRoomGrid — Architectural room tiles for the Heartwood Library.
 * Each room has a unique micro-animation, themed hover glow, and seasonal ambient shift.
 * "Every room in the library breathes differently."
 */
import { useMemo } from "react";
import { motion } from "framer-motion";

/* ── Room definitions with theme colors — grouped ── */
type Room = { key: string; label: string; desc: string; accentH: number; particle: string };

const YOUR_SPACES: Room[] = [
  { key: "staff-room",    label: "🪵 Staff Room",      desc: "144 Sacred Staffs",        accentH: 280, particle: "wand"       },
  { key: "greenhouse",    label: "🌱 Greenhouse",       desc: "Houseplants & Saplings",   accentH: 130, particle: "leaf"       },
  { key: "wishlist",      label: "⭐ Wishing Tree",     desc: "Trees you dream to visit",  accentH: 45,  particle: "star"       },
  { key: "bookshelf",     label: "📚 Bookshelf",        desc: "Your Reading Journey",     accentH: 25,  particle: "shimmer"    },
  { key: "creators-path", label: "🎨 Creator's Path",   desc: "Your Journey",             accentH: 340, particle: "spark"      },
  { key: "vault",         label: "🔐 Vault",            desc: "Staff, Tokens & Treasures", accentH: 270, particle: "shimmer"    },
];

const COMMUNITY: Room[] = [
  { key: "gallery",       label: "🗺 Map Room",         desc: "Ancient Friends Atlas",    accentH: 200, particle: "compass"    },
  { key: "music-room",    label: "🎵 Music Room",       desc: "Tree Radio",               accentH: 260, particle: "wave"       },
  { key: "seed-cellar",   label: "📦 Seed Cellar",      desc: "Living Data Archive",      accentH: 30,  particle: "seed"       },
  { key: "rhythms",       label: "🌿 Rhythms",          desc: "Seasonal Cycle Markets",   accentH: 150, particle: "leaf"       },
  { key: "tree-resources",label: "📖 Tree Resources",   desc: "Project Directory",        accentH: 160, particle: "page"       },
  { key: "ledger",        label: "📜 Scrolls & Ledger", desc: "Council Records",          accentH: 42,  particle: "shimmer"    },
  { key: "press",         label: "🪶 Printing Press",   desc: "Where reading becomes writing", accentH: 35, particle: "shimmer"  },
];

const ALL_ROOMS = [...YOUR_SPACES, ...COMMUNITY];

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

/* ── Room Tile ── */
function RoomTile({ room, idx, seasonShift, onSelect }: { room: Room; idx: number; seasonShift: number; onSelect: (key: string) => void }) {
  const h = room.accentH + seasonShift;
  return (
    <motion.button
      key={room.key}
      onClick={() => onSelect(room.key)}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.35, ease: "easeOut" }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      className="group relative rounded-xl text-left transition-shadow duration-300 overflow-hidden"
      style={{
        background: `linear-gradient(145deg, hsl(${h} 18% 12% / 0.9), hsl(${h} 14% 8% / 0.95))`,
        border: `1px solid hsl(${h} 30% 25% / 0.3)`,
        boxShadow: `0 2px 8px hsl(${h} 20% 8% / 0.4), inset 0 1px 0 hsl(${h} 30% 30% / 0.08)`,
        padding: "1.25rem 1.5rem",
      }}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 80%, hsl(${h} 60% 40% / 0.12), transparent 70%)`,
          boxShadow: `inset 0 -1px 0 hsl(${h} 50% 45% / 0.1)`,
        }}
      />
      <div
        className="absolute bottom-0 left-[15%] right-[15%] h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, hsl(${h} 55% 50% / 0.3), transparent)` }}
      />
      <RoomParticles type={room.particle} accentH={h} />
      <h3
        className="font-serif text-sm md:text-base mb-1 relative z-10 transition-colors duration-300"
        style={{ color: `hsl(${h} 55% 72% / 0.9)` }}
      >
        {room.label}
      </h3>
      <p
        className="text-xs relative z-10 transition-colors duration-300"
        style={{ color: `hsl(${h} 25% 55% / 0.5)` }}
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
      className="font-serif text-[11px] tracking-[0.15em] uppercase col-span-2 md:col-span-3 mt-2 mb--1"
      style={{ color: `hsl(${38 + seasonShift} 30% 50% / 0.45)` }}
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

  return (
    <div className="w-full max-w-2xl">
      <p
        className="font-serif text-xs tracking-[0.2em] uppercase text-center mb-5"
        style={{ color: `hsl(${38 + seasonShift} 30% 50% / 0.5)` }}
      >
        Rooms of the Library
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        <SectionHeader label="Your Spaces" seasonShift={seasonShift} />
        {YOUR_SPACES.map((room, idx) => (
          <RoomTile key={room.key} room={room} idx={idx} seasonShift={seasonShift} onSelect={onRoomSelect} />
        ))}

        <SectionHeader label="Community" seasonShift={seasonShift} />
        {COMMUNITY.map((room, idx) => (
          <RoomTile key={room.key} room={room} idx={idx + YOUR_SPACES.length} seasonShift={seasonShift} onSelect={onRoomSelect} />
        ))}
      </div>
    </div>
  );
}
