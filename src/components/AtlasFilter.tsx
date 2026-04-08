/**
 * AtlasFilter — unified filter panel replacing LiteMapFilters, MapFilters,
 * and the Living Layers sidebar.
 *
 * Data filters (species, age, girth, grove scale, perspective) are read from
 * MapFilterContext (URL-synced, cross-page).
 *
 * Visual layer toggles (seeds, groves, hive colours, research etc.) are passed
 * as props from the map renderer since they control renderer-specific layers.
 */
import { useState, useMemo, useCallback, useEffect, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, X, Leaf, GitBranch, FolderTree, RotateCcw,
  Maximize2, ExternalLink, Layers, SlidersHorizontal, Blend,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { getFamilyForSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
import { QUICK_PRESETS, ALL_MANAGED_KEYS, type QuickPreset } from "@/lib/map-layer-groups";
import type { LayerKey } from "@/hooks/use-map-layer-state";

/* ── Hive colour dot mapping — faithful to original Living Layers sidebar ── */
function getHiveColourDot(family: string): string {
  const MAP: Record<string, string> = {
    "Taxaceae": "hsl(120, 65%, 50%)",
    "Fagaceae": "hsl(35, 85%, 55%)",
    "Oleaceae": "hsl(55, 70%, 50%)",
    "Rosaceae": "hsl(340, 70%, 60%)",
    "Cupressaceae": "hsl(150, 55%, 45%)",
    "Platanaceae": "hsl(25, 80%, 55%)",
    "Pinaceae": "hsl(140, 50%, 45%)",
    "Aquifoliaceae": "hsl(210, 60%, 60%)",
    "Malvaceae": "hsl(45, 75%, 55%)",
    "Moraceae": "hsl(15, 75%, 55%)",
    "Salicaceae": "hsl(130, 55%, 50%)",
    "Betulaceae": "hsl(40, 70%, 55%)",
    "Araucariaceae": "hsl(200, 55%, 55%)",
    "Magnoliaceae": "hsl(300, 50%, 55%)",
    "Ericaceae": "hsl(220, 55%, 60%)",
    "Boraginaceae": "hsl(215, 50%, 55%)",
    "Fabaceae": "hsl(38, 75%, 55%)",
    "Ulmaceae": "hsl(100, 50%, 48%)",
    "Sapindaceae": "hsl(10, 70%, 55%)",
    "Buxaceae": "hsl(205, 55%, 55%)",
  };
  return MAP[family] || "hsl(42, 50%, 50%)";
}
import {
  useMapFilters,
  AGE_BANDS, GIRTH_BANDS, GROVE_SCALES, PERSPECTIVES,
  type AgeBand, type GirthBand, type GroveScale, type Perspective,
} from "@/contexts/MapFilterContext";

/** Perspective visual presets — layer/tuning combos for each mode */
export type PerspectivePreset = {
  layers: string[];         // layer keys to activate
  hiveEmphasis: boolean;
  bloomingClockVisible: boolean;
};

export const PERSPECTIVE_PRESETS: Record<Perspective, PerspectivePreset> = {
  collective: {
    layers: ["seeds", "offering-glow", "hive-layer"],
    hiveEmphasis: true,
    bloomingClockVisible: false,
  },
  personal: {
    layers: ["bloomed-seeds", "recent-visits", "seed-traces"],
    hiveEmphasis: false,
    bloomingClockVisible: false,
  },
  tribe: {
    layers: ["tribe-activity", "shared-trees", "groves"],
    hiveEmphasis: false,
    bloomingClockVisible: false,
  },
};

/* ── Staff species for species grid ── */
const STAFF_SPECIES: { key: string; species: string; image: string }[] = [
  { key: "ald", species: "Alder", image: "/images/staffs/ald.jpeg" },
  { key: "app", species: "Apple", image: "/images/staffs/app.jpeg" },
  { key: "ash", species: "Ash", image: "/images/staffs/ash.jpeg" },
  { key: "bee", species: "Beech", image: "/images/staffs/bee.jpeg" },
  { key: "bir", species: "Birch", image: "/images/staffs/bir.jpeg" },
  { key: "cher", species: "Cherry", image: "/images/staffs/cher.jpeg" },
  { key: "haw", species: "Hawthorn", image: "/images/staffs/haw.jpeg" },
  { key: "haz", species: "Hazel", image: "/images/staffs/haz.jpeg" },
  { key: "hol", species: "Holly", image: "/images/staffs/hol.jpeg" },
  { key: "oak", species: "Oak", image: "/images/staffs/oak.jpeg" },
  { key: "pine", species: "Pine", image: "/images/staffs/pine.jpeg" },
  { key: "row", species: "Rowan", image: "/images/staffs/row.jpeg" },
  { key: "syc", species: "Sycamore", image: "/images/staffs/syc.jpeg" },
  { key: "wil", species: "Willow", image: "/images/staffs/wil.jpeg" },
  { key: "yew", species: "Yew", image: "/images/staffs/yew.jpeg" },
];

/* ── Visual layer toggle descriptor ── */
export interface VisualLayerToggle {
  key: string;
  label: string;
  active: boolean;
  toggle: () => void;
  extra?: string;
  accent?: string;
  /** Optional description shown below the toggle */
  description?: string;
}

export interface VisualLayerSection {
  key: string;
  title: string;
  icon: string;
  accent?: string;
  layers: VisualLayerToggle[];
  /** Optional sub-content rendered when section is expanded */
  subContent?: React.ReactNode;
  /** Optional section description shown below header */
  description?: string;
}

export interface AtlasFilterProps {
  /* Data from map for species counts */
  speciesCounts: Record<string, number>;
  totalVisible: number;
  /** Multi-select species (local state bridge) */
  selectedSpecies: string[];
  onSpeciesChange: (s: string[]) => void;
  /* Lineage & project filters */
  lineageFilter?: string;
  onLineageChange?: (l: string) => void;
  availableLineages?: string[];
  projectFilter?: string;
  onProjectChange?: (p: string) => void;
  availableProjects?: string[];
  /* Hive map for hive list */
  hiveMap?: { hive: HiveInfo; count: number; speciesList: string[] }[];
  /* Visual layer sections (from map renderer) */
  visualSections?: VisualLayerSection[];
  /* Panel open state (controlled from parent) */
  panelOpen: boolean;
  onPanelOpenChange: (open: boolean) => void;
  /* Fullscreen */
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
  /* Perspective visual preset callback */
  onPerspectivePreset?: (preset: PerspectivePreset) => void;
  /* Add Ancient Friend callback */
  onAddTree?: () => void;
  /* Quick preset handler — batch-enables layers */
  onQuickPreset?: (enable: LayerKey[]) => void;
}

/* ── Shared chip styles ── */
const chipBase = "shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95 border backdrop-blur-sm";
const chipActive = "bg-primary/20 text-primary border-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.15)]";
const chipInactive = "bg-card/80 text-muted-foreground border-border/60 shadow-sm hover:bg-accent/30 hover:text-foreground";
const LEGEND_STORAGE_KEY = "s33d-map-legend-collapsed";
const LEGEND_STATE_EVENT = "s33d-map-legend-state";
const TOP_CONTROL_ROW = "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px) + 2.75rem)";

function loadLegendCollapsed(): boolean {
  try {
    return localStorage.getItem(LEGEND_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function hslStringToHue(hsl: string): number {
  const m = hsl.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 42;
}

const AtlasFilter = ({
  speciesCounts,
  totalVisible,
  selectedSpecies,
  onSpeciesChange,
  lineageFilter = "all",
  onLineageChange,
  availableLineages = [],
  projectFilter = "all",
  onProjectChange,
  availableProjects = [],
  hiveMap = [],
  visualSections = [],
  panelOpen,
  onPanelOpenChange,
  onFullscreenToggle,
  isFullscreen,
  onPerspectivePreset,
  onAddTree,
  onQuickPreset,
}: AtlasFilterProps) => {
  const {
    ageBand, setAgeBand,
    girthBand, setGirthBand,
    groveScale, setGroveScale,
    perspective, setPerspective,
    hasActiveFilters, activeFilterCount,
    resetFilters: resetGlobalFilters,
  } = useMapFilters();

  const [familyFilter, setFamilyFilter] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [hiveBlendMode, setHiveBlendMode] = useState<"exact" | "blend">("blend");
  const [selectedHiveFamilies, setSelectedHiveFamilies] = useState<Set<string>>(new Set());
  const [legendCollapsed, setLegendCollapsed] = useState(loadLegendCollapsed);

  useEffect(() => {
    const handleLegendState = (event: Event) => {
      const detail = (event as CustomEvent<{ collapsed?: boolean }>).detail;
      if (typeof detail?.collapsed === "boolean") {
        setLegendCollapsed(detail.collapsed);
      }
    };

    window.addEventListener(LEGEND_STATE_EVENT, handleLegendState as EventListener);
    return () => window.removeEventListener(LEGEND_STATE_EVENT, handleLegendState as EventListener);
  }, []);

  // Count active visual layers for badge
  const activeLayerCount = useMemo(() =>
    visualSections.reduce((sum, s) => sum + s.layers.filter(l => l.active).length, 0),
    [visualSections]
  );

  const handleResetLayers = useCallback(() => {
    visualSections.forEach(section => {
      section.layers.forEach(layer => {
        if (layer.active) layer.toggle();
      });
    });
  }, [visualSections]);

  const isAllSpecies = selectedSpecies.length === 0;
  const totalFilterCount = activeFilterCount + (isAllSpecies ? 0 : 1) + (lineageFilter !== "all" ? 1 : 0) + (projectFilter !== "all" ? 1 : 0);

  const toggleSection = useCallback((key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // On mobile, auto-collapse other sections (accordion mode)
        if (isMobile) {
          next.clear();
        }
        next.add(key);
      }
      return next;
    });
  }, [isMobile]);

  const singleSpeciesHive = useMemo(() => {
    if (selectedSpecies.length !== 1) return null;
    const hive = getHiveForSpecies(selectedSpecies[0]);
    return hive ? { slug: hive.slug, name: hive.displayName, icon: hive.icon } : null;
  }, [selectedSpecies]);

  const speciesWithFamilies = useMemo(
    () => STAFF_SPECIES.map(s => ({ ...s, family: getFamilyForSpecies(s.species) || "Other" })),
    []
  );

  const availableFamilies = useMemo(() => {
    const fams = new Map<string, number>();
    for (const s of speciesWithFamilies) {
      const count = speciesCounts[s.species.toLowerCase()] || 0;
      if (count > 0) fams.set(s.family, (fams.get(s.family) || 0) + count);
    }
    return Array.from(fams.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  }, [speciesWithFamilies, speciesCounts]);

  const availableSpecies = useMemo(
    () => speciesWithFamilies.filter(s => {
      const hasCount = (speciesCounts[s.species.toLowerCase()] || 0) > 0;
      return hasCount && (!familyFilter || s.family === familyFilter);
    }),
    [speciesWithFamilies, speciesCounts, familyFilter]
  );

  const handleSpeciesToggle = useCallback((s: string) => {
    if (s === "all") { onSpeciesChange([]); return; }
    const lower = s.toLowerCase();
    const current = selectedSpecies.map(sp => sp.toLowerCase());
    if (current.includes(lower)) {
      onSpeciesChange(selectedSpecies.filter(sp => sp.toLowerCase() !== lower));
    } else {
      onSpeciesChange([...selectedSpecies, s]);
    }
  }, [selectedSpecies, onSpeciesChange]);

  // Hive multi-select handler
  const handleHiveToggle = useCallback((family: string, speciesList: string[]) => {
    setSelectedHiveFamilies(prev => {
      const next = new Set(prev);
      if (next.has(family)) {
        next.delete(family);
      } else {
        next.add(family);
      }
      // Compute combined species from all selected hives
      const allSelectedSpecies: string[] = [];
      hiveMap.forEach(({ hive, speciesList: sl }) => {
        if (next.has(hive.family)) {
          sl.forEach(s => { if (!allSelectedSpecies.includes(s)) allSelectedSpecies.push(s); });
        }
      });
      if (hiveBlendMode === "exact") {
        onSpeciesChange(allSelectedSpecies);
      } else {
        // Blend: add to existing selection
        const merged = [...selectedSpecies];
        allSelectedSpecies.forEach(s => { if (!merged.some(m => m.toLowerCase() === s.toLowerCase())) merged.push(s); });
        onSpeciesChange(next.size === 0 ? [] : merged);
      }
      return next;
    });
  }, [hiveMap, hiveBlendMode, selectedSpecies, onSpeciesChange]);

  const handleResetAll = useCallback(() => {
    onSpeciesChange([]);
    onLineageChange?.("all");
    onProjectChange?.("all");
    setFamilyFilter(null);
    setSelectedHiveFamilies(new Set());
    resetGlobalFilters();
  }, [onSpeciesChange, onLineageChange, onProjectChange, resetGlobalFilters]);

  const activeAccent = PERSPECTIVES.find(p => p.key === perspective)?.accent || "42, 90%, 55%";
  const mobileFilterLeft = legendCollapsed ? "7.35rem" : "9.9rem";

  return (
    <>
      {/* ══ Top bar: Active filter chips + Fullscreen ══ */}
      <div
        className="absolute left-3 right-3 z-[1001] flex flex-col gap-2 animate-fade-in"
        style={{
          top: TOP_CONTROL_ROW,
        }}
      >
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex-1" />

          {/* Count badge */}
          <motion.span
            key={totalVisible}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="hidden shrink-0 tabular-nums rounded-full px-2.5 py-1.5 text-[10px] font-serif backdrop-blur-md sm:inline-flex"
            style={{
              background: "hsla(30, 25%, 10%, 0.85)",
              color: `hsl(${activeAccent})`,
              border: `1px solid hsla(${activeAccent}, 0.2)`,
            }}
          >
            {totalVisible}
          </motion.span>

          {onFullscreenToggle && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onFullscreenToggle}
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-serif backdrop-blur-md transition-all duration-200 md:flex"
              style={{
                background: isFullscreen ? `hsla(${activeAccent}, 0.15)` : "hsla(30, 25%, 10%, 0.85)",
                color: isFullscreen ? `hsl(${activeAccent})` : "hsla(42, 30%, 55%, 0.7)",
                border: `1px solid ${isFullscreen ? `hsla(${activeAccent}, 0.35)` : "hsla(42, 40%, 30%, 0.3)"}`,
              }}
            >
              <Maximize2 className="w-3 h-3" />
            </motion.button>
          )}
        </div>

        {/* Active filter chips row */}
        <AnimatePresence mode="popLayout">
          {(totalFilterCount > 0 || groveScale !== "all") && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex min-w-0 items-center gap-1.5 overflow-x-auto pl-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {GROVE_SCALES.map(g => (
                <motion.button
                  key={g.key}
                  onClick={() => setGroveScale(g.key)}
                  whileTap={{ scale: 0.93 }}
                  className={`${chipBase} ${groveScale === g.key ? chipActive : chipInactive}`}
                >
                  {g.icon} {g.label}
                </motion.button>
              ))}

              {ageBand !== "all" && (
                <ChipDismiss label={`🕰️ ${AGE_BANDS.find(b => b.key === ageBand)?.label}`} onDismiss={() => setAgeBand("all")} />
              )}
              {girthBand !== "all" && (
                <ChipDismiss label={`📏 ${GIRTH_BANDS.find(b => b.key === girthBand)?.label}`} onDismiss={() => setGirthBand("all")} />
              )}
              {lineageFilter !== "all" && (
                <ChipDismiss label={lineageFilter} icon={<GitBranch className="w-3 h-3" />} onDismiss={() => onLineageChange?.("all")} />
              )}
              {projectFilter !== "all" && (
                <ChipDismiss label={projectFilter} icon={<FolderTree className="w-3 h-3" />} onDismiss={() => onProjectChange?.("all")} />
              )}
              {!isAllSpecies && selectedSpecies.map(sp => (
                <ChipDismiss key={sp} label={sp} onDismiss={() => handleSpeciesToggle(sp)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Perspective label */}
      <AnimatePresence>
        {perspective !== "collective" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-[1001] px-3 py-1 rounded-full text-[10px] font-serif tracking-wide backdrop-blur-md"
            style={{
              top: totalFilterCount > 0 || groveScale !== "all" ? "9rem" : "7.5rem",
              left: "0.75rem",
              background: `hsla(${activeAccent}, 0.18)`,
              color: `hsl(${activeAccent})`,
              border: `1px solid hsla(${activeAccent}, 0.35)`,
              boxShadow: `0 2px 10px hsla(${activeAccent}, 0.15)`,
            }}
          >
            {perspective === "personal" ? "🌱 Viewing your mapped trees" : "👥 Viewing tribe trees"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Living Layers — Right Sidebar ══ */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[1000]"
              style={{ background: "hsla(30, 20%, 5%, 0.15)" }}
              onClick={() => onPanelOpenChange(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute right-0 bottom-0 z-[1002] w-[310px] max-w-[85vw] flex flex-col"
              style={{
                top: "calc(var(--header-height, 3.5rem) + env(safe-area-inset-top, 0px))",
                background: "hsla(30, 18%, 8%, 0.97)",
                borderLeft: "1px solid hsla(42, 40%, 30%, 0.3)",
                boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: "1px solid hsla(42, 40%, 30%, 0.25)" }}>
                <h3 className="text-[14px] font-serif tracking-[0.12em] uppercase flex items-center gap-2" style={{ color: `hsl(${activeAccent})` }}>
                  <span className="text-base">🌿</span> Living Layers
                </h3>
                <div className="flex items-center gap-2">
                  {(totalFilterCount > 0 || activeLayerCount > 0) && (
                    <button
                      onClick={() => { handleResetAll(); handleResetLayers(); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-serif transition-all"
                      style={{
                        background: "hsla(0, 0%, 100%, 0.05)",
                        color: "hsl(42, 50%, 50%)",
                        border: "1px solid hsla(42, 40%, 30%, 0.3)",
                      }}
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Reset
                    </button>
                  )}
                  <button onClick={() => onPanelOpenChange(false)} style={{ color: "hsl(42, 50%, 50%)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-4 py-3 space-y-1">

                  {/* ══════ QUICK PRESETS ══════ */}
                  {onQuickPreset && (
                    <div className="pb-3" style={{ borderBottom: "1px solid hsla(42, 40%, 30%, 0.2)" }}>
                      <p className="text-[9px] font-serif uppercase tracking-[0.15em] mb-2" style={{ color: "hsl(42, 40%, 45%)" }}>
                        Quick Modes
                      </p>
                      <div className="grid grid-cols-4 gap-1.5">
                        {QUICK_PRESETS.map(preset => (
                          <button
                            key={preset.key}
                            onClick={() => onQuickPreset(preset.enable)}
                            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-center transition-all active:scale-95"
                            style={{
                              background: "hsla(30, 20%, 12%, 0.6)",
                              border: "1px solid hsla(42, 40%, 30%, 0.25)",
                              color: `hsl(${preset.accent})`,
                            }}
                          >
                            <span className="text-base">{preset.icon}</span>
                            <span className="text-[9px] font-serif tracking-wide">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ══════ SPECIES HIVES ══════ */}
                  {hiveMap.length > 0 && (
                    <>
                      <SidebarSectionHeader
                        icon="🐝"
                        title="Species Hives"
                        count={hiveMap.length}
                        colour={`hsl(${activeAccent})`}
                        expanded={expandedSections.has("hives")}
                        onToggle={() => toggleSection("hives")}
                      />
                      <AnimatePresence initial={false}>
                        {expandedSections.has("hives") && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="pb-2" style={{ background: "hsla(42, 25%, 15%, 0.15)" }}>
                              {/* Exact / Blend toggle */}
                              <div className="flex items-center gap-2 mb-2 px-1 pt-1">
                                <span className="text-[9px] font-serif uppercase tracking-wider" style={{ color: "hsl(42, 40%, 45%)" }}>Mode</span>
                                <div
                                  className="flex rounded-full p-[2px]"
                                  style={{ background: "hsla(42, 25%, 15%, 0.6)", border: "1px solid hsla(42, 40%, 30%, 0.3)" }}
                                >
                                  {(["exact", "blend"] as const).map(mode => (
                                    <button
                                      key={mode}
                                      onClick={() => setHiveBlendMode(mode)}
                                      className="px-2.5 py-1 rounded-full text-[9px] font-serif tracking-wide transition-all duration-200 flex items-center gap-1"
                                      style={{
                                        background: hiveBlendMode === mode ? "hsla(42, 50%, 40%, 0.2)" : "transparent",
                                        color: hiveBlendMode === mode ? "hsl(42, 65%, 68%)" : "hsl(42, 30%, 40%)",
                                        border: hiveBlendMode === mode ? "1px solid hsla(42, 50%, 50%, 0.25)" : "1px solid transparent",
                                      }}
                                    >
                                      {mode === "blend" && <Blend className="w-2.5 h-2.5" />}
                                      {mode === "exact" ? "Exact" : "Blend"}
                                    </button>
                                  ))}
                                </div>
                                {selectedHiveFamilies.size > 0 && (
                                  <button
                                    onClick={() => { setSelectedHiveFamilies(new Set()); onSpeciesChange([]); }}
                                    className="ml-auto text-[9px] font-serif flex items-center gap-0.5 transition-colors"
                                    style={{ color: "hsl(42, 40%, 45%)" }}
                                  >
                                    <X className="w-2.5 h-2.5" /> Clear
                                  </button>
                                )}
                              </div>

                              {/* Hive list with colour dots */}
                              <div className="space-y-0.5">
                                {hiveMap.map(({ hive, count, speciesList }) => {
                                  const dotColour = getHiveColourDot(hive.family);
                                  const isSelected = selectedHiveFamilies.has(hive.family);
                                  return (
                                    <button
                                      key={hive.family}
                                      onClick={() => handleHiveToggle(hive.family, speciesList)}
                                      className="w-full flex items-center gap-3 py-2 px-1 transition-all group"
                                      style={{ background: isSelected ? "hsla(42, 30%, 20%, 0.3)" : "transparent" }}
                                    >
                                      <span
                                        className="w-3.5 h-3.5 rounded-full shrink-0"
                                        style={{
                                          background: dotColour,
                                          boxShadow: isSelected ? `0 0 8px ${dotColour}` : `0 0 4px ${dotColour}55`,
                                          border: isSelected ? "2px solid hsl(0, 0%, 90%)" : "none",
                                        }}
                                      />
                                      <span className="text-[13px] font-serif tracking-wide uppercase flex-1 text-left" style={{ color: isSelected ? "hsl(42, 60%, 65%)" : "hsl(42, 35%, 48%)" }}>
                                        {hive.icon} {hive.displayName}
                                      </span>
                                      <span className="text-[12px] font-sans tabular-nums shrink-0" style={{ color: "hsl(42, 70%, 55%)" }}>
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}

                  {/* ══════ SPECIES GRID ══════ */}
                  <SidebarSectionHeader
                    icon="🌳"
                    title="Species"
                    colour="hsl(120, 45%, 55%)"
                    expanded={expandedSections.has("species")}
                    onToggle={() => toggleSection("species")}
                  />
                  <AnimatePresence initial={false}>
                    {expandedSections.has("species") && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="pb-2" style={{ background: "hsla(42, 25%, 15%, 0.15)" }}>
                          <div className="flex gap-1.5 flex-wrap mb-2 px-1 pt-1">
                            <SidebarChip active={!familyFilter} onClick={() => setFamilyFilter(null)} label="All" />
                            {availableFamilies.map(f => (
                              <SidebarChip key={f.name} active={familyFilter === f.name} onClick={() => setFamilyFilter(familyFilter === f.name ? null : f.name)} label={f.name} />
                            ))}
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 px-1">
                            <StaffGridItem active={isAllSpecies} onClick={() => handleSpeciesToggle("all")} label="TETOL" isAll />
                            {availableSpecies.map(s => {
                              const count = speciesCounts[s.species.toLowerCase()] || 0;
                              const active = selectedSpecies.some(sp => sp.toLowerCase() === s.species.toLowerCase());
                              return (
                                <StaffGridItem key={s.key} active={active} onClick={() => handleSpeciesToggle(s.species)} label={s.species} image={s.image} count={count} />
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ══════ LIVING SIGNALS ══════ */}
                  {visualSections.map(section => (
                    <div key={section.key}>
                      <SidebarSectionHeader
                        icon={section.icon}
                        title={section.title}
                        colour={section.accent || "hsl(42, 70%, 55%)"}
                        expanded={expandedSections.has(section.key)}
                        onToggle={() => toggleSection(section.key)}
                      />
                      <AnimatePresence initial={false}>
                        {expandedSections.has(section.key) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            {section.description && (
                              <p className="text-[11px] font-serif italic px-1 pb-1" style={{ color: "hsl(0, 0%, 45%)" }}>
                                {section.description}
                              </p>
                            )}
                            <div
                              className="space-y-0.5 pb-2 rounded-b-md"
                              style={{ background: "hsla(42, 25%, 15%, 0.15)" }}
                            >
                              {section.layers.map(layer => (
                                <SidebarToggle key={layer.key} layer={layer} />
                              ))}
                              {section.subContent}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {/* ══════ LINEAGE & PROJECT ══════ */}
                  {(availableLineages.length > 0 || availableProjects.length > 0) && (
                    <>
                      <SidebarSectionHeader
                        icon="🌿"
                        title="Lineage & Project"
                        colour="hsl(42, 55%, 55%)"
                        expanded={expandedSections.has("lineage")}
                        onToggle={() => toggleSection("lineage")}
                      />
                      <AnimatePresence initial={false}>
                        {expandedSections.has("lineage") && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="flex gap-1.5 flex-wrap px-1 pb-1 pt-1" style={{ background: "hsla(42, 25%, 15%, 0.15)" }}>
                              {availableLineages.length > 0 && (
                                <>
                                  <SidebarChip active={lineageFilter === "all"} onClick={() => onLineageChange?.("all")} label="All Lineages" />
                                  {availableLineages.map(l => (
                                    <SidebarChip key={l} active={lineageFilter === l} onClick={() => onLineageChange?.(lineageFilter === l ? "all" : l)} label={l} />
                                  ))}
                                </>
                              )}
                              {availableProjects.length > 0 && (
                                <>
                                  <SidebarChip active={projectFilter === "all"} onClick={() => onProjectChange?.("all")} label="All Projects" />
                                  {availableProjects.map(p => (
                                    <SidebarChip key={p} active={projectFilter === p} onClick={() => onProjectChange?.(projectFilter === p ? "all" : p)} label={p} />
                                  ))}
                                </>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              </ScrollArea>

              {/* ── Add Ancient Friend CTA ── */}
              {onAddTree && (
                <div className="px-4 py-3" style={{ borderTop: "1px solid hsla(42, 40%, 30%, 0.2)" }}>
                  <button
                    onClick={() => { onAddTree(); onPanelOpenChange(false); }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-serif tracking-[0.1em] uppercase transition-all active:scale-95"
                    style={{
                      background: "hsla(42, 40%, 20%, 0.3)",
                      border: "1px solid hsla(42, 50%, 40%, 0.35)",
                      color: `hsl(${activeAccent})`,
                      boxShadow: `0 2px 10px hsla(${activeAccent}, 0.15)`,
                    }}
                  >
                    + Add Ancient Friend
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Sub-components ── */

function FilterSection({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
        {icon} {title}
      </span>
      {children}
    </div>
  );
}

function FilterChip({ active, onClick, label, icon, count }: {
  active: boolean; onClick: () => void; label: string; icon?: React.ReactNode; count?: number;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.93 }}
      onClick={onClick}
      className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif transition-all duration-200 border ${
        active
          ? "bg-primary/15 text-primary border-primary/30 shadow-[0_0_6px_hsl(var(--primary)/0.1)]"
          : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-accent/20 hover:text-foreground"
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className={`text-[8px] rounded-full px-1 ${active ? "bg-primary/20" : "bg-muted/50"}`}>{count}</span>
      )}
    </motion.button>
  );
}

function ChipDismiss({ label, icon, onDismiss }: { label: string; icon?: React.ReactNode; onDismiss: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={onDismiss}
      className={`${chipBase} ${chipActive} flex items-center gap-1`}
    >
      {icon} {label} <X className="w-3 h-3" />
    </motion.button>
  );
}

function StaffGridItem({ active, onClick, label, image, count, isAll }: {
  active: boolean; onClick: () => void; label: string; image?: string; count?: number; isAll?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 border ${
        active ? "bg-primary/10 border-primary/25 shadow-[0_0_10px_hsl(var(--primary)/0.1)]" : "border-transparent hover:bg-accent/15"
      }`}
    >
      <div className="relative">
        {isAll ? (
          <div className="w-11 h-11 rounded-full bg-muted/40 flex items-center justify-center text-lg border border-border/40">🌳</div>
        ) : (
          <img
            src={image}
            alt={label}
            className={`w-11 h-11 rounded-full object-cover transition-all duration-200 border-2 ${
              active ? "border-primary shadow-[0_0_8px_hsl(var(--primary)/0.3)]" : "border-border/40"
            }`}
            loading="lazy"
          />
        )}
        {count !== undefined && count > 0 && (
          <motion.span
            initial={false}
            animate={{ scale: active ? 1.1 : 1 }}
            className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground"
          >
            {count}
          </motion.span>
        )}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40 pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span className={`text-[9px] font-serif leading-tight text-center transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
        {label}
      </span>
    </motion.button>
  );
}

function CollapsibleSection({ title, icon, sectionKey, expanded, onToggle, count, accent, children }: {
  title: string; icon: string; sectionKey: string; expanded: boolean; onToggle: (k: string) => void;
  count?: number; accent?: string; children: React.ReactNode;
}) {
  const sectionColor = accent || "hsl(42, 55%, 58%)";
  return (
    <div className="border-t" style={{ borderColor: "hsla(42, 40%, 30%, 0.2)" }}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center justify-between py-3 transition-colors"
        style={{ color: sectionColor }}
      >
        <span className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-[13px] font-serif font-medium">{title}</span>
          {count !== undefined && (
            <span className="text-[10px] font-sans tabular-nums" style={{ color: "hsl(42, 40%, 45%)" }}>{count}</span>
          )}
        </span>
        <span className="text-[10px] transition-transform" style={{ transform: expanded ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pb-3"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LayerToggle({ layer }: { layer: VisualLayerToggle }) {
  const accent = layer.accent || "42, 80%, 60%";
  return (
    <button
      onClick={layer.toggle}
      className="w-full flex flex-col gap-0.5 px-2 py-2.5 rounded-md text-left transition-colors"
      style={{ color: layer.active ? `hsl(${accent})` : "hsl(42, 40%, 45%)" }}
    >
      <div className="flex items-center gap-2.5 w-full">
        <div
          className="w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0"
          style={{
            borderColor: layer.active ? `hsl(${accent})` : "hsla(42, 40%, 30%, 0.5)",
            background: layer.active ? `hsla(${accent.split(",")[0]}, 80%, 50%, 0.2)` : "transparent",
          }}
        >
          {layer.active && <span className="text-[9px]">✓</span>}
        </div>
        <span className="text-[12px] font-serif">{layer.label}</span>
        {layer.extra && (
          <span className="text-[9px] font-sans ml-auto" style={{ color: `hsl(180, 50%, 55%)` }}>{layer.extra}</span>
        )}
      </div>
      {layer.description && (
        <span className="text-[10px] font-serif pl-6" style={{ color: "hsl(0, 0%, 45%)" }}>
          {layer.description}
        </span>
      )}
    </button>
  );
}

/* ── Sidebar-specific sub-components (Living Layers style) ── */

function SidebarSectionHeader({ icon, title, count, colour, expanded, onToggle }: {
  icon: string; title: string; count?: number; colour: string;
  expanded?: boolean; onToggle?: () => void;
}) {
  const isClickable = !!onToggle;
  return (
    <button
      onClick={onToggle}
      aria-expanded={expanded}
      className={`w-full flex items-center gap-2 pt-5 pb-2 text-left ${isClickable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
      style={{ borderBottom: `1px solid ${colour}33` }}
      type="button"
    >
      <span className="text-base">{icon}</span>
      <span className="text-[13px] font-serif tracking-[0.12em] uppercase font-semibold" style={{ color: colour }}>
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[12px] font-sans tabular-nums" style={{ color: colour }}>{count}</span>
      )}
      {isClickable && (
        <span
          className="ml-auto text-[10px]"
          style={{
            color: colour,
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.25s ease",
            display: "inline-block",
          }}
        >
          ▾
        </span>
      )}
    </button>
  );
}

function SidebarToggle({ layer }: { layer: VisualLayerToggle }) {
  const accent = layer.accent || "42, 80%, 60%";
  const colour = `hsl(${accent})`;
  return (
    <button
      onClick={layer.toggle}
      className="w-full flex flex-col gap-0.5 px-1 py-2 rounded-md text-left transition-colors"
    >
      <div className="flex items-center gap-3 w-full">
        {/* Toggle switch */}
        <div
          className="relative w-8 h-[18px] rounded-full shrink-0 transition-all duration-200"
          style={{
            background: layer.active ? `${colour}44` : "hsla(0, 0%, 40%, 0.25)",
            border: `1px solid ${layer.active ? `${colour}66` : "hsla(0, 0%, 40%, 0.3)"}`,
          }}
        >
          <div
            className="absolute top-[2px] w-3 h-3 rounded-full transition-all duration-200"
            style={{
              left: layer.active ? "calc(100% - 14px)" : "2px",
              background: layer.active ? colour : "hsl(0, 0%, 50%)",
              boxShadow: layer.active ? `0 0 6px ${colour}66` : "none",
            }}
          />
        </div>
        <span
          className="text-[13px] font-serif tracking-wide uppercase flex-1"
          style={{ color: layer.active ? colour : "hsl(42, 35%, 48%)" }}
        >
          {layer.label}
        </span>
        {layer.extra && (
          <span className="text-[11px] font-sans tabular-nums shrink-0" style={{ color: "hsl(180, 50%, 55%)" }}>
            {layer.extra}
          </span>
        )}
      </div>
      {layer.description && (
        <span className="text-[11px] font-serif pl-11" style={{ color: "hsl(260, 30%, 50%)" }}>
          {layer.description}
        </span>
      )}
    </button>
  );
}

function SidebarChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-1 rounded-full text-[10px] font-serif tracking-wide transition-all duration-200"
      style={{
        background: active ? "hsla(42, 50%, 40%, 0.2)" : "transparent",
        color: active ? "hsl(42, 65%, 68%)" : "hsl(42, 30%, 40%)",
        border: active ? "1px solid hsla(42, 50%, 50%, 0.25)" : "1px solid hsla(0, 0%, 100%, 0.1)",
      }}
    >
      {label}
    </button>
  );
}

export default AtlasFilter;
