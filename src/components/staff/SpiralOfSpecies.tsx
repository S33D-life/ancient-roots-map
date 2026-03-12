/**
 * Spiral of Species — Living navigation hub connecting Staff Room,
 * Value Tree, Ancient Friends map, Species Hives, and Heart Ledger.
 *
 * Structure:
 *   Center:  Golden ensō seed
 *   Inner:   36 founding staffs (spiral layout)
 *   Outer:   Species circles (12 staffs each) linking to Hives
 *   Threads: Mycelial SVG connections
 */
import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Heart, TreeDeciduous, Sprout, ArrowRight, ChevronLeft, Sparkles } from "lucide-react";
import { getSpiralStaffs, getGridStaffs, type SpiralStaff, type GridStaff } from "@/utils/staffRoomData";
import { CIRCLES, SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/integrations/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

/* ─── Types ───────────────────────────────────────────────────── */
interface StaffMetrics {
  heartsGenerated: number;
  influenceEarned: number;
  treesMapped: number;
}

interface CircleGroup {
  speciesCode: SpeciesCode;
  speciesName: string;
  totalStaffs: number;
  circleCount: number;
  staffs: GridStaff[];
}

/* ─── Species accent palette (botanical gold to forest green) ── */
const SPECIES_ACCENT: Partial<Record<SpeciesCode, string>> = {
  YEW: "hsl(15 70% 45%)",
  OAK: "hsl(42 85% 45%)",
  ASH: "hsl(90 40% 45%)",
  BEE: "hsl(120 45% 40%)",
  HOL: "hsl(150 55% 38%)",
  HORN: "hsl(30 60% 48%)",
};
const fallbackAccent = (i: number) => `hsl(${42 + i * 25} 60% 45%)`;

/* ─── Build species circle groups ─────────────────────────────── */
function buildSpeciesGroups(): CircleGroup[] {
  const grid = getGridStaffs();
  const configs: { speciesCode: SpeciesCode; circleNum: number; count: number }[] = [
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

  const speciesMap = new Map<string, CircleGroup>();
  let offset = 36;

  for (const cfg of configs) {
    const staffs = grid.slice(offset, offset + cfg.count);
    offset += cfg.count;

    const existing = speciesMap.get(cfg.speciesCode);
    if (existing) {
      existing.totalStaffs += cfg.count;
      existing.circleCount += 1;
      existing.staffs.push(...staffs);
    } else {
      speciesMap.set(cfg.speciesCode, {
        speciesCode: cfg.speciesCode,
        speciesName: SPECIES_MAP[cfg.speciesCode]?.name || cfg.speciesCode,
        totalStaffs: cfg.count,
        circleCount: 1,
        staffs,
      });
    }
  }

  return Array.from(speciesMap.values());
}

/* ─── Simple metrics hook (aggregate from heart_transactions) ── */
function useStaffMetrics(): Record<string, StaffMetrics> {
  const [metrics, setMetrics] = useState<Record<string, StaffMetrics>>({});

  useEffect(() => {
    // Lightweight aggregate — no heavy queries
    const load = async () => {
      try {
        const { data } = await supabase
          .from("heart_transactions")
          .select("heart_type, amount")
          .in("heart_type", ["staff_claim", "sower", "wanderer"])
          .limit(500);

        if (data && data.length > 0) {
          const totalHearts = data.reduce((s, r) => s + (r.amount || 0), 0);
          // Distribute evenly as a demonstration — real implementation would join on staff_id
          setMetrics({ _global: { heartsGenerated: totalHearts, influenceEarned: 0, treesMapped: 0 } });
        }
      } catch {
        // Silent fail — metrics are enhancement only
      }
    };
    load();
  }, []);

  return metrics;
}

/* ═══════════════════════════════════════════════════════════════ */
/* ═══ Main Component ══════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════ */
const SpiralOfSpecies = () => {
  const spiralStaffs = useMemo(() => getSpiralStaffs(), []);
  const speciesGroups = useMemo(() => buildSpeciesGroups(), []);
  const metrics = useStaffMetrics();
  const navigate = useNavigate();

  const [selectedSpecies, setSelectedSpecies] = useState<CircleGroup | null>(null);
  const [hoveredStaff, setHoveredStaff] = useState<number | null>(null);

  const globalHearts = metrics._global?.heartsGenerated || 0;

  return (
    <div className="rounded-2xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Gold accent bar */}
      <div
        className="h-0.5"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.6), hsl(42 85% 55% / 0.2), transparent)",
        }}
      />

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-2">
            <Sprout className="w-4 h-4" style={{ color: "hsl(42, 85%, 55%)" }} />
            <h3 className="text-sm font-serif text-foreground tracking-wide">
              Spiral of Species
            </h3>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground max-w-md mx-auto">
            The living navigation hub — 36 origin staffs spiral outward into species circles,
            connecting every staff to its hive, its trees, and the heart of the economy.
          </p>
          {globalHearts > 0 && (
            <div className="inline-flex items-center gap-1 text-[9px] font-serif text-muted-foreground/70">
              <Heart className="w-2.5 h-2.5" style={{ color: "hsl(0 70% 55%)" }} />
              <span>{globalHearts.toLocaleString()} hearts flowing</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {selectedSpecies ? (
            <SpeciesCircleView
              key={`species-${selectedSpecies.speciesCode}`}
              group={selectedSpecies}
              onBack={() => setSelectedSpecies(null)}
            />
          ) : (
            <SpiralView
              key="spiral"
              staffs={spiralStaffs}
              speciesGroups={speciesGroups}
              hoveredStaff={hoveredStaff}
              onHoverStaff={setHoveredStaff}
              onSelectSpecies={setSelectedSpecies}
            />
          )}
        </AnimatePresence>

        {/* Legend + links */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-[8px] font-serif text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "hsl(42, 85%, 55%)", opacity: 0.6 }}
            />
            Origin Spiral (36)
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "hsl(120, 50%, 45%)", opacity: 0.5 }}
            />
            Species Circles (108)
          </span>
        </div>

        {/* Cross-navigation links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Value Tree", route: ROUTES.VALUE_TREE_ECONOMY, icon: "🌳" },
            { label: "Heartwood Vault", route: ROUTES.VAULT, icon: "🏛" },
            { label: "Species Hives", route: ROUTES.HIVES, icon: "🐝" },
            { label: "Heart Ledger", route: ROUTES.VALUE_TREE, icon: "💛" },
          ].map((link) => (
            <Link
              key={link.route}
              to={link.route}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[9px] font-serif text-muted-foreground hover:text-foreground transition-colors"
              style={{
                border: "1px solid hsl(var(--border) / 0.3)",
                background: "hsl(var(--card) / 0.3)",
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ═══ Main spiral overview ════════════════════════════════════ */
function SpiralView({
  staffs,
  speciesGroups,
  hoveredStaff,
  onHoverStaff,
  onSelectSpecies,
}: {
  staffs: SpiralStaff[];
  speciesGroups: CircleGroup[];
  hoveredStaff: number | null;
  onHoverStaff: (i: number | null) => void;
  onSelectSpecies: (g: CircleGroup) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mx-auto"
      style={{ width: "min(100%, 500px)", aspectRatio: "1" }}
    >
      {/* Background rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
        {/* Outer orbit ring */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="hsl(42 85% 55% / 0.04)" strokeWidth="0.3" />
        {/* Inner orbit ring */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="hsl(42 85% 55% / 0.06)" strokeWidth="0.3" />
        {/* Core glow */}
        <circle cx="50" cy="50" r="8" fill="hsl(42 85% 55% / 0.03)" />

        {/* Mycelial connections — center to species clusters */}
        {speciesGroups.map((g, gi) => {
          const angle = (gi / speciesGroups.length) * Math.PI * 2 - Math.PI / 2;
          const x2 = 50 + 43 * Math.cos(angle);
          const y2 = 50 + 43 * Math.sin(angle);
          const cx1 = 50 + 15 * Math.cos(angle + 0.15);
          const cy1 = 50 + 15 * Math.sin(angle + 0.15);
          return (
            <path
              key={`thread-${g.speciesCode}`}
              d={`M 50 50 Q ${cx1} ${cy1} ${x2} ${y2}`}
              fill="none"
              stroke="hsl(42 85% 55% / 0.06)"
              strokeWidth="0.25"
              strokeDasharray="1.5 2"
            />
          );
        })}
      </svg>

      {/* ── Golden ensō center ── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
          className="text-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 120, delay: 0.2 }}
        >
          <div
            className="w-14 h-14 mx-auto rounded-full flex items-center justify-center"
            style={{
              border: "2px solid hsl(42 85% 55% / 0.25)",
              background: "radial-gradient(circle, hsl(42 85% 55% / 0.08), transparent 70%)",
              boxShadow: "0 0 30px hsl(42 85% 55% / 0.1)",
            }}
          >
            {/* Ensō circle with seed dot */}
            <svg viewBox="0 0 40 40" className="w-8 h-8">
              <circle
                cx="20"
                cy="20"
                r="14"
                fill="none"
                stroke="hsl(42 85% 55% / 0.5)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="80"
                strokeDashoffset="8"
              />
              <circle cx="20" cy="20" r="2.5" fill="hsl(42 85% 55% / 0.7)" />
            </svg>
          </div>
          <p
            className="text-[6px] font-serif tracking-[0.2em] uppercase mt-1"
            style={{ color: "hsl(42 85% 55% / 0.5)" }}
          >
            Origin
          </p>
        </motion.div>
      </div>

      {/* ── 36 Origin staffs — inner spiral ring ── */}
      {staffs.map((staff, i) => {
        // Golden spiral placement
        const goldenAngle = 137.508;
        const angleRad = (i * goldenAngle * Math.PI) / 180;
        const r = 22 + (i / 36) * 10; // spiral out from 22% to 32%
        const x = 50 + r * Math.cos(angleRad);
        const y = 50 + r * Math.sin(angleRad);
        const isHovered = hoveredStaff === i;
        const accentColor = SPECIES_ACCENT[staff.code as SpeciesCode] || fallbackAccent(i);

        return (
          <HoverCard key={`origin-${staff.code}`} openDelay={100} closeDelay={50}>
            <HoverCardTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: Math.min(0.3 + i * 0.02, 1),
                  type: "spring",
                  stiffness: 200,
                }}
                className="absolute"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isHovered ? 20 : 1,
                }}
                onMouseEnter={() => onHoverStaff(i)}
                onMouseLeave={() => onHoverStaff(null)}
              >
                <Link to={ROUTES.STAFF(staff.code)} className="block relative">
                  {/* Subtle pulse glow */}
                  <div
                    className="absolute inset-[-3px] rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${accentColor}15, transparent 70%)`,
                      animation: `pulse ${4 + (i % 3)}s ease-in-out infinite`,
                      willChange: "opacity",
                    }}
                  />
                  <div
                    className="relative w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border flex items-center justify-center transition-all duration-300"
                    style={{
                      borderColor: `${accentColor}50`,
                      backgroundColor: `${accentColor}18`,
                      boxShadow: isHovered
                        ? `0 0 12px ${accentColor}40`
                        : `0 0 4px ${accentColor}12`,
                      transform: isHovered ? "scale(1.8)" : "scale(1)",
                    }}
                  >
                    <span
                      className="text-[4px] sm:text-[5px] font-serif font-bold"
                      style={{ color: accentColor }}
                    >
                      ◈
                    </span>
                  </div>
                </Link>
              </motion.div>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-48 p-3" sideOffset={8}>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-semibold text-foreground">
                    {staff.displayCode}
                  </span>
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                    style={{
                      background: "hsl(42 85% 55% / 0.1)",
                      color: "hsl(42 85% 55%)",
                    }}
                  >
                    #{String(i + 1).padStart(3, "0")}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">{staff.species}</p>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground/70">
                  <span className="flex items-center gap-0.5">
                    <Heart className="w-2.5 h-2.5" style={{ color: "hsl(0 70% 55%)" }} />
                    —
                  </span>
                  <span className="flex items-center gap-0.5">
                    <TreeDeciduous className="w-2.5 h-2.5" style={{ color: "hsl(120 45% 45%)" }} />
                    —
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" style={{ color: "hsl(42 85% 55%)" }} />
                    —
                  </span>
                </div>
                <p
                  className="text-[8px] font-serif italic"
                  style={{ color: "hsl(42 85% 55% / 0.6)" }}
                >
                  Tap to view full legend →
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}

      {/* ── Species circle clusters — outer ring ── */}
      {speciesGroups.map((group, gi) => {
        const angle = (gi / speciesGroups.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 44;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        const accent = SPECIES_ACCENT[group.speciesCode] || fallbackAccent(gi);

        return (
          <motion.div
            key={`species-${group.speciesCode}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + gi * 0.08, type: "spring", stiffness: 140 }}
            className="absolute group"
            style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
          >
            <button
              onClick={() => onSelectSpecies(group)}
              className="block relative focus:outline-none"
            >
              {/* Outer glow ring */}
              <div
                className="absolute inset-[-8px] rounded-full"
                style={{
                  background: `radial-gradient(circle, ${accent}12, transparent 70%)`,
                  animation: "pulse 6s ease-in-out infinite",
                }}
              />
              {/* Node */}
              <div
                className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 group-hover:scale-125"
                style={{
                  borderColor: `${accent}35`,
                  backgroundColor: `${accent}08`,
                  boxShadow: `0 0 18px ${accent}15`,
                }}
              >
                <div className="text-center leading-none">
                  <span
                    className="text-[8px] sm:text-[9px] font-serif font-bold block"
                    style={{ color: accent }}
                  >
                    {group.totalStaffs}
                  </span>
                </div>
              </div>
            </button>
            {/* Label below */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 hidden sm:block pointer-events-none">
              <p
                className="text-[6px] font-serif text-center whitespace-nowrap tracking-wider uppercase"
                style={{ color: `${accent}80` }}
              >
                {group.speciesName}
              </p>
            </div>
            {/* Hover tooltip for mobile */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-30 pointer-events-none">
              <div className="bg-card border border-border rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center">
                <p className="text-[9px] font-serif text-foreground font-medium">
                  {group.speciesName}
                </p>
                <p className="text-[7px] font-serif text-muted-foreground">
                  {group.circleCount} circle{group.circleCount > 1 ? "s" : ""} · {group.totalStaffs} staffs
                </p>
                <p className="text-[6px] font-serif mt-0.5" style={{ color: "hsl(42 85% 55% / 0.6)" }}>
                  Tap to explore circle →
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* ═══ Species Circle Detail ═══════════════════════════════════ */
function SpeciesCircleView({
  group,
  onBack,
}: {
  group: CircleGroup;
  onBack: () => void;
}) {
  const accent = SPECIES_ACCENT[group.speciesCode] || "hsl(42 60% 45%)";
  const hiveFamily = group.speciesName.toLowerCase().replace(/\s+/g, "-");

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg border border-border/30 bg-card/30 hover:bg-card/60 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h4 className="text-sm font-serif text-foreground">{group.speciesName} Circle</h4>
          <p className="text-[9px] font-serif text-muted-foreground">
            {group.totalStaffs} staffs · {group.circleCount} circle{group.circleCount > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Circle of staffs */}
      <div className="relative mx-auto" style={{ width: "min(100%, 320px)", aspectRatio: "1" }}>
        {/* Ring */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="36" fill="none" stroke={`${accent}15`} strokeWidth="0.5" />
          <circle cx="50" cy="50" r="8" fill={`${accent}06`} />
        </svg>

        {/* Center */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-lg font-serif font-bold text-foreground">
              {group.totalStaffs}
            </span>
            <p
              className="text-[7px] font-serif uppercase tracking-widest"
              style={{ color: accent }}
            >
              {group.speciesName}
            </p>
          </div>
        </div>

        {/* Staff nodes */}
        {group.staffs.map((staff, i) => {
          const angle = (i / Math.max(group.staffs.length, 12)) * Math.PI * 2 - Math.PI / 2;
          const radius = 36;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);

          return (
            <motion.div
              key={staff.code}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.03, type: "spring", stiffness: 180 }}
              className="absolute group"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <Link to={ROUTES.STAFF(staff.code)} className="block relative">
                <div
                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full border flex items-center justify-center transition-all duration-200 group-hover:scale-150 group-hover:z-10"
                  style={{
                    borderColor: `${accent}50`,
                    backgroundColor: `${accent}15`,
                    boxShadow: `0 0 8px ${accent}15`,
                  }}
                >
                  <span className="text-[6px] sm:text-[7px] font-serif font-bold" style={{ color: accent }}>
                    {i + 1}
                  </span>
                </div>
              </Link>
              {/* Tooltip */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block z-20 pointer-events-none">
                <div className="bg-card border border-border rounded-lg px-2 py-1 whitespace-nowrap shadow-xl text-center">
                  <p className="text-[8px] font-serif text-foreground font-medium">{staff.code}</p>
                  <p className="text-[6px] text-muted-foreground">Token #{staff.tokenId}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <Link
          to={ROUTES.HIVE(hiveFamily)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-serif text-foreground transition-colors"
          style={{
            border: `1px solid ${accent}30`,
            background: `${accent}08`,
          }}
        >
          🐝 Visit {group.speciesName} Hive
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          to={ROUTES.VALUE_TREE_ECONOMY}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-serif text-muted-foreground hover:text-foreground transition-colors"
          style={{
            border: "1px solid hsl(var(--border) / 0.3)",
          }}
        >
          🌳 View in Value Tree
        </Link>
      </div>
    </motion.div>
  );
}

export default SpiralOfSpecies;
