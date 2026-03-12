/**
 * StaffSpiralNavigator — Navigable spiral structure showing:
 * - Center: Ancient Friends emblem
 * - Inner Ring: 36 Origin Spiral staffs
 * - Outer Layer: 9 species circles (108 expansion staffs)
 * Clicking a species circle reveals its 12 staffs.
 */
import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Crown, ChevronLeft, TreeDeciduous, ArrowRight } from "lucide-react";
import { getSpiralStaffs, getGridStaffs, type SpiralStaff, type GridStaff } from "@/utils/staffRoomData";
import { CIRCLES, SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import FullscreenWrapper from "@/components/FullscreenWrapper";

/* ─── Deterministic species hue ───────────────────────────────── */
const HUE_PALETTE = [42, 120, 150, 30, 280, 200, 60, 340, 90, 170] as const;
const speciesHue = (i: number) => `hsl(${HUE_PALETTE[i % HUE_PALETTE.length]}, 70%, 50%)`;

/* ─── Expansion circle descriptor ─────────────────────────────── */
interface CircleGroup {
  id: number;
  label: string;
  speciesCode: SpeciesCode;
  speciesName: string;
  circleNum: number;
  staffs: GridStaff[];
}

function buildCircleGroups(): CircleGroup[] {
  const grid = getGridStaffs();
  const groups: CircleGroup[] = [];

  // Circles start at index 36 in the grid
  const circleConfigs: { speciesCode: SpeciesCode; circleNum: number; count: number }[] = [
    { speciesCode: "YEW", circleNum: 1, count: 12 },
    { speciesCode: "YEW", circleNum: 2, count: 12 },
    { speciesCode: "YEW", circleNum: 3, count: 12 },
    { speciesCode: "OAK", circleNum: 1, count: 12 },
    { speciesCode: "OAK", circleNum: 2, count: 12 },
    { speciesCode: "OAK", circleNum: 3, count: 12 },
    { speciesCode: "ASH", circleNum: 1, count: 12 },
    { speciesCode: "BEE", circleNum: 1, count: 12 },
    { speciesCode: "HOL", circleNum: 1, count: 12 },
  ];

  let offset = 36;
  circleConfigs.forEach((cfg, idx) => {
    const staffs = grid.slice(offset, offset + cfg.count);
    const speciesName = SPECIES_MAP[cfg.speciesCode]?.name || cfg.speciesCode;
    groups.push({
      id: idx + 1,
      label: `${speciesName} Circle ${cfg.circleNum}`,
      speciesCode: cfg.speciesCode,
      speciesName,
      circleNum: cfg.circleNum,
      staffs,
    });
    offset += cfg.count;
  });

  return groups;
}

/* ─── Main Component ──────────────────────────────────────────── */
const StaffSpiralNavigator = () => {
  const spiralStaffs = useMemo(() => getSpiralStaffs(), []);
  const circleGroups = useMemo(() => buildCircleGroups(), []);
  const navigate = useNavigate();

  // Selected circle view (null = overview)
  const [selectedCircle, setSelectedCircle] = useState<CircleGroup | null>(null);

  // Group expansion circles by species for the outer ring display
  const speciesGroups = useMemo(() => {
    const map = new Map<string, CircleGroup[]>();
    circleGroups.forEach((g) => {
      const existing = map.get(g.speciesCode) || [];
      existing.push(g);
      map.set(g.speciesCode, existing);
    });
    return Array.from(map.entries()); // [speciesCode, groups[]]
  }, [circleGroups]);

  return (
    <FullscreenWrapper tone="dark">
    <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Gold accent line */}
      <div
        className="h-0.5"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.5), hsl(280 60% 55% / 0.2), transparent)",
        }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <Crown className="w-4 h-4" style={{ color: "hsl(42, 85%, 55%)" }} />
            <h3 className="text-sm font-serif text-foreground tracking-wide">The Staff Room Spiral</h3>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground max-w-sm mx-auto">
            36 origin staffs at the heart, surrounded by 108 expansion staffs in 9 species circles.
            Each staff is a living node in the ecosystem.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {selectedCircle ? (
            <CircleDetailView
              key={`circle-${selectedCircle.id}`}
              group={selectedCircle}
              onBack={() => setSelectedCircle(null)}
            />
          ) : (
            <SpiralOverview
              key="overview"
              spiralStaffs={spiralStaffs}
              speciesGroups={speciesGroups}
              onSelectCircle={setSelectedCircle}
            />
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[8px] font-serif text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(42, 85%, 55%)", opacity: 0.5 }} />
            Origin Spiral
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(120, 50%, 45%)", opacity: 0.5 }} />
            Species Circles
          </span>
        </div>
      </div>
    </div>
  );
};

/* ═══ Spiral Overview — Origin Ring + Expansion Orbits ═════════ */
function SpiralOverview({
  spiralStaffs,
  speciesGroups,
  onSelectCircle,
}: {
  spiralStaffs: SpiralStaff[];
  speciesGroups: [string, CircleGroup[]][];
  onSelectCircle: (g: CircleGroup) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mx-auto"
      style={{ width: "min(100%, 460px)", aspectRatio: "1" }}
    >
      {/* ── Background rings ── */}
      <div
        className="absolute inset-[10%] rounded-full"
        style={{
          border: "1px solid hsl(42 85% 55% / 0.06)",
          background: "radial-gradient(circle, transparent 55%, hsl(42 85% 55% / 0.02))",
        }}
      />
      <div
        className="absolute inset-[32%] rounded-full"
        style={{
          border: "1px solid hsl(42 85% 55% / 0.05)",
          background: "radial-gradient(circle, hsl(42 85% 55% / 0.04), transparent 70%)",
        }}
      />

      {/* ── Center emblem ── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ border: "1px solid hsl(42 85% 55% / 0.15)", background: "hsl(42 85% 55% / 0.04)" }}>
            <TreeDeciduous className="w-5 h-5" style={{ color: "hsl(42, 85%, 55%)" }} />
          </div>
          <p className="text-[7px] font-serif text-muted-foreground/60 mt-1 tracking-widest uppercase">Ancient Friends</p>
        </div>
      </div>

      {/* ── Origin Spiral — 36 staffs at radius ~32% ── */}
      {spiralStaffs.map((staff, i) => {
        const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
        const radius = 31;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const color = speciesHue(i);

        return (
          <motion.div
            key={`origin-${staff.code}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(0.1 + i * 0.015, 0.7), type: "spring", stiffness: 200 }}
            className="absolute group"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <Link to={`/staff/${staff.code}`} className="block relative">
              {/* Pulse */}
              <div
            className="absolute inset-[-3px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${color}12, transparent 70%)`,
                  animation: `pulse ${3 + (i % 5)}s ease-in-out infinite`,
                  willChange: "opacity",
                }}
              />
              <div
                className="relative w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-transform group-hover:scale-[2] group-hover:z-20"
                style={{
                  borderColor: `${color}45`,
                  backgroundColor: `${color}18`,
                  boxShadow: `0 0 8px ${color}20`,
                }}
              >
                <span className="text-[5px] sm:text-[6px] font-serif font-bold" style={{ color }}>
                  {i < 12 ? "◈" : "·"}
                </span>
              </div>
            </Link>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block z-30 pointer-events-none">
              <div className="bg-card border border-border rounded-lg px-2 py-1 whitespace-nowrap shadow-xl">
                <p className="text-[8px] font-serif text-foreground font-medium">{staff.displayCode}</p>
                <p className="text-[7px] font-serif text-muted-foreground">{staff.species}</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* ── Expansion Layer — Species circle clusters at radius ~45% ── */}
      {speciesGroups.map(([speciesCode, groups], gi) => {
        // Place species cluster nodes evenly around the outer ring
        const angle = (gi / speciesGroups.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 44;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const speciesName = SPECIES_MAP[speciesCode as SpeciesCode]?.name || speciesCode;
        const totalStaffs = groups.reduce((sum, g) => sum + g.staffs.length, 0);
        const circleCount = groups.length;

        return (
          <motion.div
            key={`species-${speciesCode}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 + gi * 0.06, type: "spring", stiffness: 150 }}
            className="absolute group"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <button
              onClick={() => onSelectCircle(groups[0])}
              className="block relative focus:outline-none"
            >
              {/* Outer glow */}
              <div
                className="absolute inset-[-6px] rounded-full"
                style={{
                  background: "radial-gradient(circle, hsl(120 50% 45% / 0.1), transparent 70%)",
                }}
              />
              <div
                className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-[1.5] group-hover:z-20"
                style={{
                  borderColor: "hsl(120 50% 45% / 0.25)",
                  backgroundColor: "hsl(120 50% 45% / 0.06)",
                  boxShadow: "0 0 16px hsl(120 50% 45% / 0.12)",
                }}
              >
                <div className="text-center">
                  <span className="text-[7px] sm:text-[8px] font-serif font-bold text-foreground">{totalStaffs}</span>
                </div>
              </div>
            </button>
            {/* Tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30 pointer-events-none">
              <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center">
                <p className="text-[9px] font-serif text-foreground font-medium">{speciesName}</p>
                <p className="text-[7px] font-serif text-muted-foreground">
                  {circleCount} circle{circleCount > 1 ? "s" : ""} · {totalStaffs} staffs
                </p>
                <p className="text-[6px] font-serif text-primary/50 mt-0.5">Click to explore</p>
              </div>
            </div>
          </motion.div>
        );
      })}

      {/* ── Mycelial connecting lines (SVG) ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        {/* Radial lines from center to species clusters */}
        {speciesGroups.map(([speciesCode], gi) => {
          const angle = (gi / speciesGroups.length) * Math.PI * 2 - Math.PI / 2;
          const x1 = 50 + 14 * Math.cos(angle);
          const y1 = 50 + 14 * Math.sin(angle);
          const x2 = 50 + 42 * Math.cos(angle);
          const y2 = 50 + 42 * Math.sin(angle);
          return (
            <line
              key={`line-${speciesCode}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="hsl(42 85% 55% / 0.06)"
              strokeWidth="0.3"
              strokeDasharray="1 1.5"
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

/* ═══ Circle Detail View — Shows 12 staffs in a selected circle ═ */
function CircleDetailView({
  group,
  onBack,
}: {
  group: CircleGroup;
  onBack: () => void;
}) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="space-y-4"
    >
      {/* Back button + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg border border-border/30 bg-card/30 hover:bg-card/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h4 className="text-sm font-serif text-foreground">{group.label}</h4>
          <p className="text-[9px] font-serif text-muted-foreground">
            {group.staffs.length} staffs · {group.speciesName}
          </p>
        </div>
      </div>

      {/* Circle of 12 staffs */}
      <div className="relative mx-auto" style={{ width: "min(100%, 300px)", aspectRatio: "1" }}>
        {/* Ring glow */}
        <div
          className="absolute inset-[15%] rounded-full"
          style={{
            border: "1px solid hsl(120 50% 45% / 0.08)",
            background: "radial-gradient(circle, hsl(120 50% 45% / 0.04), transparent 70%)",
          }}
        />
        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-lg font-serif font-bold text-foreground">{group.staffs.length}</span>
            <p className="text-[7px] font-serif text-muted-foreground uppercase tracking-widest">{group.speciesName}</p>
          </div>
        </div>

        {group.staffs.map((staff, i) => {
          const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const radius = 36;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          const color = speciesHue(i + 3); // offset for variety

          return (
            <motion.div
              key={staff.code}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.04, type: "spring", stiffness: 180 }}
              className="absolute group"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <Link to={`/staff/${staff.code}`} className="block relative">
                <div
                  className="absolute inset-[-4px] rounded-full animate-pulse"
                  style={{
                    background: `radial-gradient(circle, ${color}15, transparent 70%)`,
                    animationDuration: `${3 + (i % 4)}s`,
                  }}
                />
                <div
                  className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center transition-transform group-hover:scale-[1.6] group-hover:z-10"
                  style={{
                    borderColor: `${color}50`,
                    backgroundColor: `${color}20`,
                    boxShadow: `0 0 10px ${color}20`,
                  }}
                >
                  <span className="text-[7px] sm:text-[8px] font-serif font-bold" style={{ color }}>
                    {i + 1}
                  </span>
                </div>
              </Link>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center">
                  <p className="text-[8px] font-serif text-foreground font-medium">{staff.code}</p>
                  <p className="text-[7px] font-serif text-muted-foreground">{staff.speciesName}</p>
                  <p className="text-[6px] font-serif text-primary/50 mt-0.5">Token #{staff.tokenId}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View all circles for this species */}
      <div className="text-center">
        <Link
          to="/patron-offering"
          className="group inline-flex items-center gap-1.5 text-[9px] font-serif text-muted-foreground hover:text-foreground transition-colors"
        >
          About the Founding Patron Offering
          <ArrowRight className="w-2.5 h-2.5" />
        </Link>
      </div>
    </motion.div>
  );
}

export default StaffSpiralNavigator;
