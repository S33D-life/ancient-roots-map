/**
 * Spiral of Species — Constellation Map with S33D Heart Flow
 * A calm, astronomical-style visualization where staffs appear as stars
 * in a forest galaxy, with heart particles flowing like sap through the system.
 *
 * Structure:
 *   Center:  Golden ensō seed
 *   Inner:   36 founding staffs (golden-angle spiral)
 *   Outer:   Species constellation clusters (12 staffs each)
 *   Future:  Dim outer nodes for unrevealed species
 *   Flow:    Canvas heart particles traveling along spiral paths
 */
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Heart, TreeDeciduous, Sprout, ArrowRight, ChevronLeft, Shield } from "lucide-react";
import { getSpiralStaffs, getGridStaffs, type SpiralStaff, type GridStaff } from "@/utils/staffRoomData";
import { SPECIES_MAP, type SpeciesCode } from "@/config/staffContract";
import { ROUTES } from "@/lib/routes";
import { supabase } from "@/integrations/supabase/client";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SpiralHeartFlow } from "./SpiralHeartFlow";
import FullscreenWrapper from "@/components/FullscreenWrapper";
import { useSpiralInteraction } from "@/hooks/use-spiral-interaction";
import "./spiral-animations.css";

/* ─── Types ───────────────────────────────────────────────────── */
interface EcosystemMetrics {
  totalHearts: number;
  totalTrees: number;
  totalInfluence: number;
  totalOfferings: number;
  byType: Record<string, number>;
}

interface CircleGroup {
  speciesCode: SpeciesCode;
  speciesName: string;
  totalStaffs: number;
  circleCount: number;
  staffs: GridStaff[];
}

/* ─── Constellation palette ──────────────────────────────────── */
const SPECIES_GLOW: Partial<Record<SpeciesCode, { core: string; glow: string }>> = {
  YEW: { core: "hsl(15, 75%, 60%)", glow: "hsl(15, 80%, 50%)" },
  OAK: { core: "hsl(42, 90%, 62%)", glow: "hsl(42, 85%, 50%)" },
  ASH: { core: "hsl(80, 50%, 58%)", glow: "hsl(80, 45%, 45%)" },
  BEE: { core: "hsl(130, 50%, 55%)", glow: "hsl(130, 45%, 42%)" },
  HOL: { core: "hsl(160, 55%, 52%)", glow: "hsl(160, 50%, 40%)" },
  HORN: { core: "hsl(30, 65%, 58%)", glow: "hsl(30, 60%, 45%)" },
};
const fallbackGlow = (i: number) => ({
  core: `hsl(${42 + i * 30}, 60%, 58%)`,
  glow: `hsl(${42 + i * 30}, 55%, 45%)`,
});

/* ─── Future species (dim outer nodes) ───────────────────────── */
const FUTURE_SPECIES = [
  { name: "Rowan", angle: 0 },
  { name: "Hazel", angle: 60 },
  { name: "Willow", angle: 120 },
  { name: "Elder", angle: 180 },
  { name: "Birch", angle: 240 },
  { name: "Pine", angle: 300 },
];

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

/* ─── Ecosystem metrics hook ─────────────────────────────────── */
function useEcosystemMetrics(): EcosystemMetrics {
  const [metrics, setMetrics] = useState<EcosystemMetrics>({
    totalHearts: 0, totalTrees: 0, totalInfluence: 0, totalOfferings: 0, byType: {},
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [heartsRes, treesRes, influenceRes, offeringsRes] = await Promise.all([
          supabase.from("heart_transactions").select("heart_type, amount").limit(1000),
          supabase.from("trees").select("id", { count: "exact", head: true }),
          supabase.from("influence_transactions").select("amount").limit(500),
          supabase.from("offerings").select("id", { count: "exact", head: true }),
        ]);

        const hearts = heartsRes.data || [];
        const totalHearts = hearts.reduce((s, r) => s + (r.amount || 0), 0);
        const byType: Record<string, number> = {};
        for (const h of hearts) {
          byType[h.heart_type] = (byType[h.heart_type] || 0) + (h.amount || 0);
        }

        const totalInfluence = (influenceRes.data || []).reduce((s, r) => s + (r.amount || 0), 0);

        setMetrics({
          totalHearts,
          totalTrees: treesRes.count || 0,
          totalInfluence,
          totalOfferings: offeringsRes.count || 0,
          byType,
        });
      } catch {
        // Silent fail
      }
    };
    load();
  }, []);

  return metrics;
}

/* ─── User staff ownership hook ───────────────────────────────── */
function useUserStaff(): string | null {
  const [staffCode, setStaffCode] = useState<string | null>(null);

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Check ceremony_logs for staff claim
      const { data } = await supabase
        .from("ceremony_logs")
        .select("staff_code")
        .eq("user_id", user.id)
        .eq("ceremony_type", "staff_claim")
        .limit(1)
        .maybeSingle();
      if (data?.staff_code) setStaffCode(data.staff_code);
    };
    check();
  }, []);

  return staffCode;
}

/* ─── SVG spiral path generator ───────────────────────────────── */
function buildSpiralPath(turns: number, startR: number, endR: number, cx: number, cy: number): string {
  const points: string[] = [];
  const steps = turns * 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const angle = t * turns * Math.PI * 2 - Math.PI / 2;
    const r = startR + (endR - startR) * t;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    points.push(`${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.join(" ");
}

/* ═══════════════════════════════════════════════════════════════ */
/* ═══ Main Component ══════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════ */
const SpiralOfSpecies = () => {
  const spiralStaffs = useMemo(() => getSpiralStaffs(), []);
  const speciesGroups = useMemo(() => buildSpeciesGroups(), []);
  const metrics = useEcosystemMetrics();
  const userStaff = useUserStaff();
  const navigate = useNavigate();

  const [selectedSpecies, setSelectedSpecies] = useState<CircleGroup | null>(null);
  const [hoveredStaff, setHoveredStaff] = useState<number | null>(null);

  return (
    <FullscreenWrapper tone="dark" captureFilename="s33d-spiral-of-species">
    <div
      className="rounded-2xl overflow-hidden relative"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, hsl(80 20% 8%), hsl(220 15% 5%) 70%, hsl(260 10% 3%))",
        border: "1px solid hsl(42 85% 55% / 0.12)",
      }}
    >
      {/* Top gold accent */}
      <div
        className="h-px"
        style={{ background: "linear-gradient(90deg, transparent, hsl(42 85% 55% / 0.5), hsl(42 85% 55% / 0.15), transparent)" }}
      />

      <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <Sprout className="w-4 h-4" style={{ color: "hsl(42, 85%, 60%)" }} />
            <h3 className="text-sm font-serif tracking-widest uppercase" style={{ color: "hsl(42, 85%, 70%)" }}>
              Spiral of Species
            </h3>
          </div>
          <p className="text-[10px] font-serif max-w-md mx-auto leading-relaxed" style={{ color: "hsl(42, 30%, 50%)" }}>
            A constellation of 144 sacred staffs — origin spiral at the centre,
            species clusters orbiting outward. Hearts flow like sap through the living forest.
          </p>

          {/* Live ecosystem pulse */}
          <div className="flex items-center justify-center gap-4 text-[9px] font-serif" style={{ color: "hsl(42, 30%, 50%)" }}>
            {metrics.totalHearts > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: "hsl(0, 60%, 60%)" }}>
                <Heart className="w-2.5 h-2.5" />
                {metrics.totalHearts.toLocaleString()} hearts
              </span>
            )}
            {metrics.totalTrees > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: "hsl(120, 45%, 55%)" }}>
                <TreeDeciduous className="w-2.5 h-2.5" />
                {metrics.totalTrees.toLocaleString()} trees
              </span>
            )}
            {metrics.totalInfluence > 0 && (
              <span className="inline-flex items-center gap-1" style={{ color: "hsl(42, 80%, 60%)" }}>
                <Shield className="w-2.5 h-2.5" />
                {metrics.totalInfluence.toLocaleString()} influence
              </span>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {selectedSpecies ? (
            <ConstellationDetail
              key={`detail-${selectedSpecies.speciesCode}`}
              group={selectedSpecies}
              metrics={metrics}
              onBack={() => setSelectedSpecies(null)}
            />
          ) : (
            <ConstellationMap
              key="constellation"
              staffs={spiralStaffs}
              speciesGroups={speciesGroups}
              hoveredStaff={hoveredStaff}
              onHoverStaff={setHoveredStaff}
              onSelectSpecies={setSelectedSpecies}
              metrics={metrics}
              userStaff={userStaff}
            />
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-[8px] font-serif" style={{ color: "hsl(42, 30%, 45%)" }}>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(42, 85%, 60%)", boxShadow: "0 0 6px hsl(42, 85%, 50%)" }} />
            Origin Spiral (36)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(130, 50%, 50%)", boxShadow: "0 0 6px hsl(130, 50%, 40%)" }} />
            Species Circles (108)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(0, 65%, 55%)", boxShadow: "0 0 4px hsl(0, 65%, 45%)" }} />
            Heart Flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full border" style={{ borderColor: "hsl(42, 30%, 30%)" }} />
            Future Species
          </span>
        </div>

        {/* User's staff vault panel */}
        {userStaff && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{
              background: "linear-gradient(135deg, hsl(42 85% 55% / 0.06), hsl(42 85% 55% / 0.02))",
              border: "1px solid hsl(42 85% 55% / 0.15)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "hsl(42 85% 55% / 0.15)",
                    boxShadow: "0 0 12px hsl(42 85% 55% / 0.2)",
                  }}
                >
                  <span className="text-[8px] font-serif font-bold" style={{ color: "hsl(42, 85%, 65%)" }}>✦</span>
                </div>
                <div>
                  <p className="text-[10px] font-serif font-semibold" style={{ color: "hsl(42, 85%, 65%)" }}>
                    Your Staff: {userStaff}
                  </p>
                  <p className="text-[8px] font-serif" style={{ color: "hsl(42, 30%, 50%)" }}>
                    Founding Patron
                  </p>
                </div>
              </div>
              <Link
                to={ROUTES.STAFF(userStaff)}
                className="text-[9px] font-serif px-3 py-1.5 rounded-lg transition-colors"
                style={{
                  border: "1px solid hsl(42 85% 55% / 0.2)",
                  color: "hsl(42, 85%, 60%)",
                }}
              >
                View Staff →
              </Link>
            </div>
          </motion.div>
        )}

        {/* Cross-navigation */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Value Tree", route: ROUTES.VALUE_TREE_ECONOMY, icon: "🌳" },
            { label: "Heartwood Vault", route: ROUTES.VAULT, icon: "🏛" },
            { label: "Species Hives", route: ROUTES.HIVES, icon: "🐝" },
            { label: "Heart Ledger", route: ROUTES.VALUE_TREE, icon: "💛" },
          ].map((link) => (
            <Link
              key={link.route}
              to={link.route}
              className="flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[9px] font-serif transition-colors"
              style={{
                border: "1px solid hsl(42, 85%, 55% / 0.1)",
                background: "hsl(42, 85%, 55% / 0.03)",
                color: "hsl(42, 30%, 55%)",
              }}
            >
              <span>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
    </FullscreenWrapper>
  );
};

/* ═══ Constellation Map ═══════════════════════════════════════ */
function ConstellationMap({
  staffs,
  speciesGroups,
  hoveredStaff,
  onHoverStaff,
  onSelectSpecies,
  metrics,
  userStaff,
}: {
  staffs: SpiralStaff[];
  speciesGroups: CircleGroup[];
  hoveredStaff: number | null;
  onHoverStaff: (i: number | null) => void;
  onSelectSpecies: (g: CircleGroup) => void;
  metrics: EcosystemMetrics;
  userStaff: string | null;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const { isInteracting, interactionProps } = useSpiralInteraction();

  // Track which species is being highlighted for constellation mode
  const [highlightedSpecies, setHighlightedSpecies] = useState<string | null>(null);

  // Focus ripple state
  const [ripple, setRipple] = useState<{ x: number; y: number; color: string; key: number } | null>(null);

  const triggerRipple = useCallback((x: number, y: number, color: string) => {
    setRipple({ x, y, color, key: Date.now() });
  }, []);

  // Pre-compute spiral positions
  const originPositions = useMemo(() => {
    const goldenAngle = 137.508;
    return staffs.map((_, i) => {
      const angleRad = (i * goldenAngle * Math.PI) / 180;
      const r = 18 + (i / 36) * 14;
      return { x: 50 + r * Math.cos(angleRad), y: 50 + r * Math.sin(angleRad) };
    });
  }, [staffs]);

  // Species cluster positions
  const clusterPositions = useMemo(() => {
    return speciesGroups.map((_, gi) => {
      const angle = (gi / speciesGroups.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 42;
      return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle), angle };
    });
  }, [speciesGroups]);

  // Spiral guide path
  const spiralPath = useMemo(() => buildSpiralPath(2.5, 16, 34, 50, 50), []);

  return (
    <motion.div
      ref={mapRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative mx-auto touch-pan-y"
      style={{ width: "min(100%, 560px)", maxHeight: "85vh", aspectRatio: "1" }}
      {...interactionProps}
    >
      {/* Ambient rotation wrapper */}
      <div className={`absolute inset-0 spiral-ambient ${isInteracting ? "is-interacting" : ""}`}>

      {/* Focus ripple overlay */}
      <AnimatePresence>
        {ripple && (
          <div
            key={ripple.key}
            className="focus-ripple"
            style={{
              left: `${ripple.x}%`,
              top: `${ripple.y}%`,
              border: `2px solid ${ripple.color}`,
              boxShadow: `0 0 12px ${ripple.color}`,
            }}
            onAnimationEnd={() => setRipple(null)}
          />
        )}
      </AnimatePresence>
      {/* ── Canvas heart flow layer ── */}
      <SpiralHeartFlow
        containerRef={mapRef}
        originPositions={originPositions}
        clusterPositions={clusterPositions}
        heartCount={metrics.totalHearts}
      />

      {/* ── SVG background layer ── */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        <defs>
          <radialGradient id="centerGlow">
            <stop offset="0%" stopColor="hsl(42, 85%, 55%)" stopOpacity="0.12" />
            <stop offset="50%" stopColor="hsl(42, 85%, 50%)" stopOpacity="0.04" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
          <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.3" />
          </filter>
          {/* Heart glow for value tree lines */}
          <filter id="sapGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.4" />
          </filter>
        </defs>

        {/* Deep space dust — concentric rings */}
        <circle cx="50" cy="50" r="48" fill="none" stroke="hsl(42, 50%, 30%)" strokeWidth="0.08" strokeOpacity="0.15" />
        <circle cx="50" cy="50" r="38" fill="none" stroke="hsl(42, 50%, 35%)" strokeWidth="0.08" strokeOpacity="0.12" />
        <circle cx="50" cy="50" r="28" fill="none" stroke="hsl(42, 60%, 40%)" strokeWidth="0.1" strokeOpacity="0.1" />
        <circle cx="50" cy="50" r="15" fill="none" stroke="hsl(42, 70%, 45%)" strokeWidth="0.1" strokeOpacity="0.08" />

        {/* Golden spiral guide */}
        <motion.path
          d={spiralPath}
          fill="none"
          stroke="hsl(42, 85%, 55%)"
          strokeWidth="0.15"
          strokeOpacity="0.12"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
        />

        {/* Center glow */}
        <circle cx="50" cy="50" r="12" fill="url(#centerGlow)" />

        {/* Value Tree connection lines — golden threads from center outward */}
        {clusterPositions.map((pos, gi) => {
          const cx1 = 50 + 12 * Math.cos(pos.angle + 0.2);
          const cy1 = 50 + 12 * Math.sin(pos.angle + 0.2);
          const accent = SPECIES_GLOW[speciesGroups[gi].speciesCode] || fallbackGlow(gi);
          return (
            <g key={`thread-${gi}`}>
              {/* Mycelial thread */}
              <motion.path
                d={`M 50 50 Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${pos.x.toFixed(1)} ${pos.y.toFixed(1)}`}
                fill="none"
                stroke={accent.glow}
                strokeWidth="0.2"
                strokeOpacity="0.12"
                strokeDasharray="1.2 2.5"
                filter="url(#lineGlow)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 1.5 + gi * 0.1, duration: 1 }}
              />
              {/* Sap flow line (golden, subtler) */}
              <motion.path
                d={`M 50 50 Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${pos.x.toFixed(1)} ${pos.y.toFixed(1)}`}
                fill="none"
                stroke="hsl(42, 85%, 55%)"
                strokeWidth="0.12"
                strokeOpacity="0.06"
                filter="url(#sapGlow)"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 2 + gi * 0.1, duration: 1.2 }}
              />
            </g>
          );
        })}

        {/* Constellation lines between adjacent origin staffs */}
        {originPositions.map((pos, i) => {
          if (i === 0) return null;
          const prev = originPositions[i - 1];
          return (
            <motion.line
              key={`starline-${i}`}
              x1={prev.x} y1={prev.y} x2={pos.x} y2={pos.y}
              stroke="hsl(42, 85%, 55%)"
              strokeWidth="0.1"
              strokeOpacity="0.08"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.015 }}
            />
          );
        })}

        {/* Future species — dim outer ring */}
        {FUTURE_SPECIES.map((fs, i) => {
          const angleRad = (fs.angle * Math.PI) / 180;
          const r = 48;
          const x = 50 + r * Math.cos(angleRad);
          const y = 50 + r * Math.sin(angleRad);
          return (
            <g key={`future-${i}`}>
              <circle cx={x} cy={y} r="1.2" fill="none" stroke="hsl(42, 30%, 25%)" strokeWidth="0.15" strokeDasharray="0.5 0.5" />
              <circle cx={x} cy={y} r="0.3" fill="hsl(42, 30%, 25%)" fillOpacity="0.4" />
            </g>
          );
        })}
      </svg>

      {/* ── Golden ensō center ── */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <motion.div
          className="text-center"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center relative"
            style={{
              border: "1.5px solid hsl(42, 85%, 55% / 0.3)",
              background: "radial-gradient(circle, hsl(42 85% 55% / 0.06), transparent 70%)",
            }}
          >
            <motion.div
              className="absolute inset-[-8px] rounded-full"
              style={{ background: "radial-gradient(circle, hsl(42, 85%, 55% / 0.08), transparent 70%)" }}
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <svg viewBox="0 0 40 40" className="w-9 h-9 relative z-10">
              <circle
                cx="20" cy="20" r="14"
                fill="none"
                stroke="hsl(42, 85%, 60%)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeDasharray="78"
                strokeDashoffset="8"
                opacity="0.6"
              />
              <circle cx="20" cy="20" r="2.5" fill="hsl(42, 85%, 65%)" opacity="0.8" />
            </svg>
          </div>
          <p
            className="text-[7px] font-serif tracking-[0.25em] uppercase mt-1.5"
            style={{ color: "hsl(42, 85%, 55% / 0.5)" }}
          >
            Origin
          </p>
        </motion.div>
      </div>

      {/* ── 36 Origin staffs — star nodes ── */}
      {staffs.map((staff, i) => {
        const pos = originPositions[i];
        const isHovered = hoveredStaff === i;
        const isOwned = userStaff === staff.code;
        const colors = SPECIES_GLOW[staff.code as SpeciesCode] || fallbackGlow(i);

        return (
          <HoverCard key={`star-${staff.code}`} openDelay={80} closeDelay={30}>
            <HoverCardTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.025, type: "spring", stiffness: 200 }}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: isHovered || isOwned ? 25 : 2,
                }}
                onMouseEnter={() => onHoverStaff(i)}
                onMouseLeave={() => onHoverStaff(null)}
              >
                <Link to={ROUTES.STAFF(staff.code)} className="block relative">
                  {/* Owner halo */}
                  {isOwned && (
                    <motion.div
                      className="absolute rounded-full"
                      style={{
                        inset: "-10px",
                        background: "radial-gradient(circle, hsl(42 85% 55% / 0.15), transparent 60%)",
                        border: "1px solid hsl(42 85% 55% / 0.2)",
                      }}
                      animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}
                  {/* Star glow aura */}
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      inset: "-5px",
                      background: `radial-gradient(circle, ${colors.glow}30, transparent 70%)`,
                    }}
                    animate={{
                      scale: isHovered ? [1, 1.3, 1.1] : [1, 1.08, 1],
                      opacity: isHovered ? [0.8, 1, 0.9] : [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: isHovered ? 1.5 : (4 + (i % 4)), repeat: Infinity, ease: "easeInOut" }}
                  />
                  {/* Orbiting activity indicators */}
                  {metrics.totalHearts > 0 && i < 12 && (
                    <motion.div
                      className="absolute"
                      style={{
                        transformOrigin: `3px ${8 + i % 3}px`,
                        backgroundColor: "hsl(0, 65%, 55%)",
                        boxShadow: "0 0 4px hsl(0, 65%, 50%)",
                        width: "3px",
                        height: "3px",
                        borderRadius: "50%",
                        top: "-3px",
                        left: "50%",
                        marginLeft: "-3px",
                      }}
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 12 + i * 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  )}
                  {/* Star core */}
                  <div
                    className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full flex items-center justify-center transition-all duration-500"
                    style={{
                      backgroundColor: isOwned ? colors.core : (isHovered ? colors.core : `${colors.core}60`),
                      boxShadow: isOwned
                        ? `0 0 20px ${colors.glow}90, 0 0 8px hsl(42, 85%, 55% / 0.5)`
                        : isHovered
                          ? `0 0 16px ${colors.glow}80, 0 0 4px ${colors.core}`
                          : `0 0 6px ${colors.glow}30`,
                      transform: isHovered ? "scale(2)" : isOwned ? "scale(1.6)" : "scale(1)",
                    }}
                  >
                    <span
                      className="text-[3px] sm:text-[4px] font-bold"
                      style={{ color: (isHovered || isOwned) ? "hsl(0, 0%, 95%)" : colors.core }}
                    >
                      {(isHovered || isOwned) ? (i + 1) : ""}
                    </span>
                  </div>
                </Link>
              </motion.div>
            </HoverCardTrigger>
            <HoverCardContent
              side="top"
              sideOffset={12}
              className="w-56 p-3 border-border/50"
              style={{
                background: "hsl(220, 15%, 8%)",
                borderColor: isOwned ? "hsl(42, 85%, 55% / 0.3)" : `${colors.glow}30`,
                boxShadow: `0 0 20px ${colors.glow}15`,
              }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-semibold" style={{ color: colors.core }}>
                    {staff.displayCode}
                  </span>
                  <div className="flex items-center gap-1">
                    {isOwned && (
                      <span className="text-[7px] font-serif px-1 py-0.5 rounded" style={{ background: "hsl(42 85% 55% / 0.15)", color: "hsl(42, 85%, 65%)" }}>
                        Your Staff
                      </span>
                    )}
                    <span
                      className="text-[8px] font-mono px-1.5 py-0.5 rounded"
                      style={{ background: `${colors.glow}15`, color: colors.core }}
                    >
                      #{String(i + 1).padStart(3, "0")}
                    </span>
                  </div>
                </div>
                <p className="text-[10px]" style={{ color: "hsl(42, 30%, 60%)" }}>{staff.species}</p>
                {/* Ecosystem indicators */}
                <div className="flex items-center gap-3 text-[9px]" style={{ color: "hsl(42, 20%, 45%)" }}>
                  <span className="flex items-center gap-1">
                    <Heart className="w-2.5 h-2.5" style={{ color: "hsl(0, 65%, 55%)" }} />
                    <span>{metrics.totalHearts > 0 ? Math.floor(metrics.totalHearts / 36) : "—"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <TreeDeciduous className="w-2.5 h-2.5" style={{ color: "hsl(120, 45%, 50%)" }} />
                    <span>{metrics.totalTrees > 0 ? Math.floor(metrics.totalTrees / 36) : "—"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" style={{ color: "hsl(42, 80%, 55%)" }} />
                    <span>{metrics.totalInfluence > 0 ? Math.floor(metrics.totalInfluence / 36) : "—"}</span>
                  </span>
                </div>
                {/* Heart flow source breakdown */}
                {Object.keys(metrics.byType).length > 0 && (
                  <div className="pt-1 border-t" style={{ borderColor: "hsl(42, 20%, 20%)" }}>
                    <p className="text-[7px] font-serif mb-1" style={{ color: "hsl(42, 30%, 45%)" }}>Heart Sources</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(metrics.byType).slice(0, 4).map(([type, amount]) => (
                        <span key={type} className="text-[6px] px-1 py-0.5 rounded" style={{ background: "hsl(0 65% 55% / 0.08)", color: "hsl(0, 50%, 60%)" }}>
                          {type.replace(/_/g, " ")}: {amount}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[7px] font-serif italic" style={{ color: "hsl(42, 85%, 55% / 0.5)" }}>
                  Tap to view full legend →
                </p>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}

      {/* ── Species constellation clusters ── */}
      {speciesGroups.map((group, gi) => {
        const pos = clusterPositions[gi];
        const colors = SPECIES_GLOW[group.speciesCode] || fallbackGlow(gi);
        // Distribute hearts proportionally
        const speciesHeartShare = metrics.totalHearts > 0
          ? Math.floor(metrics.totalHearts * (group.totalStaffs / 144))
          : 0;

        return (
          <motion.div
            key={`cluster-${group.speciesCode}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.3 + gi * 0.1, type: "spring", stiffness: 130 }}
            className="absolute group"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <button
              onClick={() => onSelectSpecies(group)}
              className="block relative focus:outline-none"
            >
              {/* Nebula glow */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  inset: "-10px",
                  background: `radial-gradient(circle, ${colors.glow}18, transparent 70%)`,
                }}
                animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 7 + gi, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Cluster node */}
              <div
                className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-125"
                style={{
                  border: `1.5px solid ${colors.core}40`,
                  background: `radial-gradient(circle, ${colors.glow}12, ${colors.glow}04 70%)`,
                  boxShadow: `0 0 20px ${colors.glow}15, inset 0 0 15px ${colors.glow}08`,
                }}
              >
                {/* Mini constellation dots inside */}
                <svg viewBox="0 0 24 24" className="w-full h-full absolute inset-0 opacity-30">
                  {Array.from({ length: 6 }).map((_, di) => {
                    const da = (di / 6) * Math.PI * 2;
                    const dr = 7;
                    return (
                      <circle
                        key={di}
                        cx={12 + dr * Math.cos(da)}
                        cy={12 + dr * Math.sin(da)}
                        r="0.6"
                        fill={colors.core}
                      />
                    );
                  })}
                </svg>
                <div className="text-center leading-none relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-serif font-bold block" style={{ color: colors.core }}>
                    {group.totalStaffs}
                  </span>
                </div>
              </div>
            </button>

            {/* Species label + heart count */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 pointer-events-none text-center">
              <p
                className="text-[6px] sm:text-[7px] font-serif whitespace-nowrap tracking-[0.15em] uppercase"
                style={{ color: `${colors.core}90` }}
              >
                {group.speciesName}
              </p>
              {speciesHeartShare > 0 && (
                <p className="text-[5px] font-serif" style={{ color: "hsl(0, 50%, 55% / 0.7)" }}>
                  ♥ {speciesHeartShare}
                </p>
              )}
            </div>

            {/* Hover tooltip */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 hidden group-hover:block z-30 pointer-events-none">
              <div
                className="rounded-lg px-3 py-2 whitespace-nowrap shadow-2xl text-center"
                style={{
                  background: "hsl(220, 15%, 8%)",
                  border: `1px solid ${colors.glow}25`,
                  boxShadow: `0 0 15px ${colors.glow}15`,
                }}
              >
                <p className="text-[9px] font-serif font-medium" style={{ color: colors.core }}>
                  {group.speciesName}
                </p>
                <p className="text-[7px] font-serif" style={{ color: "hsl(42, 20%, 45%)" }}>
                  {group.circleCount} circle{group.circleCount > 1 ? "s" : ""} · {group.totalStaffs} staffs
                </p>
                {speciesHeartShare > 0 && (
                  <p className="text-[7px] font-serif" style={{ color: "hsl(0, 55%, 55%)" }}>
                    ♥ {speciesHeartShare} hearts circulating
                  </p>
                )}
                <p className="text-[6px] font-serif mt-0.5" style={{ color: "hsl(42, 85%, 55% / 0.5)" }}>
                  Tap to explore constellation →
                </p>
              </div>
            </div>
          </motion.div>
        );
      })}

      </div>{/* end ambient rotation wrapper */}
    </motion.div>
  );
}

/* ═══ Species Constellation Detail ═══════════════════════════ */
function ConstellationDetail({
  group,
  metrics,
  onBack,
}: {
  group: CircleGroup;
  metrics: EcosystemMetrics;
  onBack: () => void;
}) {
  const colors = SPECIES_GLOW[group.speciesCode] || { core: "hsl(42, 60%, 58%)", glow: "hsl(42, 55%, 45%)" };
  const hiveFamily = group.speciesName.toLowerCase().replace(/\s+/g, "-");
  const speciesHeartShare = metrics.totalHearts > 0
    ? Math.floor(metrics.totalHearts * (group.totalStaffs / 144))
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg transition-colors"
          style={{ border: "1px solid hsl(42, 50%, 30% / 0.3)", background: "hsl(42, 50%, 20% / 0.1)" }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "hsl(42, 30%, 55%)" }} />
        </button>
        <div className="flex-1">
          <h4 className="text-sm font-serif" style={{ color: colors.core }}>{group.speciesName} Constellation</h4>
          <p className="text-[9px] font-serif" style={{ color: "hsl(42, 20%, 45%)" }}>
            {group.totalStaffs} staffs · {group.circleCount} circle{group.circleCount > 1 ? "s" : ""}
          </p>
        </div>
        {speciesHeartShare > 0 && (
          <div className="text-right">
            <p className="text-[10px] font-serif font-semibold" style={{ color: "hsl(0, 60%, 58%)" }}>
              ♥ {speciesHeartShare}
            </p>
            <p className="text-[7px] font-serif" style={{ color: "hsl(42, 20%, 45%)" }}>hearts circulating</p>
          </div>
        )}
      </div>

      {/* Ecosystem metrics for this species */}
      {metrics.totalHearts > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hearts", value: speciesHeartShare, icon: "♥", color: "hsl(0, 60%, 55%)" },
            { label: "Trees", value: Math.floor((metrics.totalTrees * group.totalStaffs) / 144), icon: "🌳", color: "hsl(120, 45%, 50%)" },
            { label: "Influence", value: Math.floor((metrics.totalInfluence * group.totalStaffs) / 144), icon: "✦", color: "hsl(42, 80%, 55%)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-2 rounded-lg"
              style={{ background: "hsl(220, 15%, 10%)", border: `1px solid ${colors.core}15` }}
            >
              <span className="text-xs font-serif font-bold block" style={{ color: stat.color }}>{stat.icon} {stat.value}</span>
              <span className="text-[7px] font-serif" style={{ color: "hsl(42, 20%, 40%)" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Circle of stars */}
      <div className="relative mx-auto" style={{ width: "min(100%, 360px)", aspectRatio: "1" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          <defs>
            <radialGradient id="detailCenterGlow">
              <stop offset="0%" stopColor={colors.glow} stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="36" fill="none" stroke={`${colors.core}20`} strokeWidth="0.3" />
          <circle cx="50" cy="50" r="37" fill="none" stroke={`${colors.core}08`} strokeWidth="1" />
          <circle cx="50" cy="50" r="10" fill="url(#detailCenterGlow)" />
          {group.staffs.map((_, i) => {
            if (i === 0) return null;
            const angle1 = ((i - 1) / Math.max(group.staffs.length, 12)) * Math.PI * 2 - Math.PI / 2;
            const angle2 = (i / Math.max(group.staffs.length, 12)) * Math.PI * 2 - Math.PI / 2;
            return (
              <line
                key={`conn-${i}`}
                x1={50 + 36 * Math.cos(angle1)} y1={50 + 36 * Math.sin(angle1)}
                x2={50 + 36 * Math.cos(angle2)} y2={50 + 36 * Math.sin(angle2)}
                stroke={`${colors.core}15`} strokeWidth="0.2"
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-xl font-serif font-bold" style={{ color: colors.core }}>{group.totalStaffs}</span>
            <p className="text-[7px] font-serif uppercase tracking-widest" style={{ color: `${colors.core}80` }}>
              {group.speciesName}
            </p>
          </div>
        </div>

        {/* Staff star nodes */}
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
              transition={{ delay: 0.15 + i * 0.04, type: "spring", stiffness: 180 }}
              className="absolute group/star"
              style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
            >
              <Link to={ROUTES.STAFF(staff.code)} className="block relative">
                <motion.div
                  className="absolute rounded-full"
                  style={{ inset: "-4px", background: `radial-gradient(circle, ${colors.glow}25, transparent 70%)` }}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 4 + (i % 3), repeat: Infinity, ease: "easeInOut" }}
                />
                <div
                  className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-300 group-hover/star:scale-150"
                  style={{
                    backgroundColor: `${colors.core}25`,
                    border: `1px solid ${colors.core}50`,
                    boxShadow: `0 0 10px ${colors.glow}20`,
                  }}
                >
                  <span className="text-[7px] sm:text-[8px] font-serif font-bold" style={{ color: colors.core }}>
                    {i + 1}
                  </span>
                </div>
              </Link>
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/star:block z-20 pointer-events-none">
                <div
                  className="rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-xl text-center"
                  style={{
                    background: "hsl(220, 15%, 8%)",
                    border: `1px solid ${colors.glow}20`,
                    boxShadow: `0 0 12px ${colors.glow}12`,
                  }}
                >
                  <p className="text-[8px] font-serif font-medium" style={{ color: colors.core }}>{staff.code}</p>
                  <p className="text-[6px]" style={{ color: "hsl(42, 20%, 45%)" }}>Token #{staff.tokenId}</p>
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
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-serif transition-all"
          style={{
            border: `1px solid ${colors.core}30`,
            background: `${colors.glow}08`,
            color: colors.core,
          }}
        >
          🐝 Visit {group.speciesName} Hive
          <ArrowRight className="w-3 h-3" />
        </Link>
        <Link
          to={ROUTES.VALUE_TREE_ECONOMY}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[10px] font-serif transition-colors"
          style={{
            border: "1px solid hsl(42, 50%, 30% / 0.2)",
            color: "hsl(42, 30%, 50%)",
          }}
        >
          🌳 View in Value Tree
        </Link>
      </div>
    </motion.div>
  );
}

export default SpiralOfSpecies;
