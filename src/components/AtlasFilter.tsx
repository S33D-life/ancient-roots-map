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
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, X, Leaf, GitBranch, FolderTree, RotateCcw,
  Maximize2, ExternalLink, Layers, SlidersHorizontal, Blend,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "react-router-dom";
import { getFamilyForSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies, type HiveInfo } from "@/utils/hiveUtils";
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
}

export interface VisualLayerSection {
  key: string;
  title: string;
  icon: string;
  accent?: string;
  layers: VisualLayerToggle[];
  /** Optional sub-content rendered when section is expanded */
  subContent?: React.ReactNode;
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
}

/* ── Shared chip styles ── */
const chipBase = "shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95 border backdrop-blur-sm";
const chipActive = "bg-primary/20 text-primary border-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.15)]";
const chipInactive = "bg-card/80 text-muted-foreground border-border/60 shadow-sm hover:bg-accent/30 hover:text-foreground";

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["hives", "signals", "structures"]));
  const [hiveBlendMode, setHiveBlendMode] = useState<"exact" | "blend">("blend");
  const [selectedHiveFamilies, setSelectedHiveFamilies] = useState<Set<string>>(new Set());

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
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

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

  return (
    <>
      {/* ══ Top bar: Mode Capsule + Count + Fullscreen ══ */}
      <div className="absolute top-[4.5rem] left-3 right-3 z-[1000] flex flex-col gap-2 animate-fade-in">
        <div className="flex items-center gap-2">
          {/* Mode Capsule */}
          <div
            className="flex items-center rounded-full p-[3px] backdrop-blur-md shrink-0"
            style={{
              background: "hsla(30, 25%, 10%, 0.88)",
              border: `1px solid hsla(${activeAccent}, 0.25)`,
              boxShadow: `0 2px 12px hsla(${activeAccent}, 0.1), inset 0 1px 0 hsla(0, 0%, 100%, 0.04)`,
            }}
          >
            {PERSPECTIVES.map(p => {
              const isActive = perspective === p.key;
              return (
                <motion.button
                  key={p.key}
                  onClick={() => {
                    setPerspective(p.key);
                    if (onPerspectivePreset) onPerspectivePreset(PERSPECTIVE_PRESETS[p.key]);
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="relative flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-serif transition-colors duration-200"
                  style={{
                    color: isActive ? `hsl(${p.accent})` : "hsla(42, 30%, 55%, 0.6)",
                    background: isActive ? `hsla(${p.accent}, 0.12)` : "transparent",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mode-indicator"
                      className="absolute inset-0 rounded-full"
                      style={{
                        border: `1.5px solid hsla(${p.accent}, 0.4)`,
                        boxShadow: `0 0 10px hsla(${p.accent}, 0.15), inset 0 0 8px hsla(${p.accent}, 0.06)`,
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 text-[13px]">{p.icon}</span>
                  <span className="relative z-10 tracking-wide">{p.label}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Count badge */}
          <motion.span
            key={totalVisible}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="shrink-0 tabular-nums px-2.5 py-1.5 rounded-full text-[10px] font-serif backdrop-blur-md"
            style={{
              background: "hsla(30, 25%, 10%, 0.85)",
              color: `hsl(${activeAccent})`,
              border: `1px solid hsla(${activeAccent}, 0.2)`,
            }}
          >
            {totalVisible}
          </motion.span>

          <div className="flex-1" />

          {onFullscreenToggle && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onFullscreenToggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-serif backdrop-blur-md transition-all duration-200"
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
              className="flex items-center gap-1.5 overflow-x-auto pl-1"
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
            className="absolute z-[1000] px-2.5 py-0.5 rounded-full text-[9px] font-serif"
            style={{
              top: totalFilterCount > 0 || groveScale !== "all" ? "8.5rem" : "7rem",
              left: "0.75rem",
              background: `hsla(${activeAccent}, 0.1)`,
              color: `hsl(${activeAccent})`,
              border: `1px solid hsla(${activeAccent}, 0.2)`,
            }}
          >
            {perspective === "personal" ? "🌱 Viewing your mapped trees" : "👥 Viewing tribe trees"}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ Unified Atlas Filter Bottom Sheet ══ */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[1000] bg-background/20"
              onClick={() => onPanelOpenChange(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl border-t border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
              style={{ maxHeight: "75vh" }}
            >
              {/* Handle + Header */}
              <div className="flex flex-col items-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: `hsla(${activeAccent}, 0.3)` }} />
              </div>

              <div className="px-4 pb-2 flex items-center justify-between">
               <h3 className="text-sm font-serif tracking-wider flex items-center gap-2" style={{ color: `hsl(${activeAccent})` }}>
                  <Layers className="w-3.5 h-3.5" style={{ opacity: 0.6 }} />
                  Filters & Layers
                </h3>
                <div className="flex items-center gap-2">
                  {singleSpeciesHive && (
                    <Link
                      to={`/hive/${singleSpeciesHive.slug}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif text-primary/80 hover:text-primary bg-primary/8 hover:bg-primary/15 border border-primary/25 transition-colors"
                    >
                      {singleSpeciesHive.icon} View Hive <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                  {activeLayerCount > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleResetLayers}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border/30 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Layers
                    </motion.button>
                  )}
                  {(totalFilterCount > 0 || activeLayerCount > 0) && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => { handleResetAll(); handleResetLayers(); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif text-primary/70 hover:text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> All
                    </motion.button>
                  )}
                </div>
              </div>

              <ScrollArea className="px-0" style={{ maxHeight: "calc(75vh - 60px)" }}>
                <div className="px-4 pb-4 space-y-4">

                  {/* ── Age Band ── */}
                  <FilterSection title="🕰️ Age">
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip active={ageBand === "all"} onClick={() => setAgeBand("all")} label="All Ages" />
                      {AGE_BANDS.map(b => (
                        <FilterChip key={b.key} active={ageBand === b.key} onClick={() => setAgeBand(ageBand === b.key ? "all" : b.key)} label={b.label} />
                      ))}
                    </div>
                  </FilterSection>

                  {/* ── Girth Band ── */}
                  <FilterSection title="📏 Girth">
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip active={girthBand === "all"} onClick={() => setGirthBand("all")} label="All Sizes" />
                      {GIRTH_BANDS.map(b => (
                        <FilterChip key={b.key} active={girthBand === b.key} onClick={() => setGirthBand(girthBand === b.key ? "all" : b.key)} label={b.label} />
                      ))}
                    </div>
                  </FilterSection>

                  {/* ── Lineage + Project ── */}
                  {(availableLineages.length > 0 || availableProjects.length > 0) && (
                    <div className="space-y-3">
                      {availableLineages.length > 0 && (
                        <FilterSection title="Lineage" icon={<GitBranch className="w-2.5 h-2.5" />}>
                          <div className="flex gap-1.5 flex-wrap">
                            <FilterChip active={lineageFilter === "all"} onClick={() => onLineageChange?.("all")} label="All" />
                            {availableLineages.map(l => (
                              <FilterChip key={l} active={lineageFilter === l} onClick={() => onLineageChange?.(lineageFilter === l ? "all" : l)} label={l} />
                            ))}
                          </div>
                        </FilterSection>
                      )}
                      {availableProjects.length > 0 && (
                        <FilterSection title="Project" icon={<FolderTree className="w-2.5 h-2.5" />}>
                          <div className="flex gap-1.5 flex-wrap">
                            <FilterChip active={projectFilter === "all"} onClick={() => onProjectChange?.("all")} label="All" />
                            {availableProjects.map(p => (
                              <FilterChip key={p} active={projectFilter === p} onClick={() => onProjectChange?.(projectFilter === p ? "all" : p)} label={p} />
                            ))}
                          </div>
                        </FilterSection>
                      )}
                    </div>
                  )}

                  {/* ── Species / Lineage ── */}
                  <FilterSection title="Species" icon={<Leaf className="w-2.5 h-2.5" />}>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <FilterChip active={!familyFilter} onClick={() => setFamilyFilter(null)} label="All Families" icon={<Leaf className="w-2.5 h-2.5" />} />
                      {availableFamilies.map(f => (
                        <FilterChip key={f.name} active={familyFilter === f.name} onClick={() => setFamilyFilter(familyFilter === f.name ? null : f.name)} label={f.name} count={f.count} />
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      <StaffGridItem active={isAllSpecies} onClick={() => handleSpeciesToggle("all")} label="TETOL" isAll />
                      {availableSpecies.map(s => {
                        const count = speciesCounts[s.species.toLowerCase()] || 0;
                        const active = selectedSpecies.some(sp => sp.toLowerCase() === s.species.toLowerCase());
                        return (
                          <StaffGridItem key={s.key} active={active} onClick={() => handleSpeciesToggle(s.species)} label={s.species} image={s.image} count={count} />
                        );
                      })}
                    </div>
                  </FilterSection>

                  {/* ── Species Hives — Multi-select with Exact/Blend ── */}
                  {hiveMap.length > 0 && (
                    <CollapsibleSection
                      title="Species Hives"
                      icon="🐝"
                      sectionKey="hives"
                      expanded={expandedSections.has("hives")}
                      onToggle={toggleSection}
                      count={hiveMap.length}
                    >
                      {/* Exact / Blend toggle */}
                      <div className="flex items-center gap-2 mb-2 px-1">
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
                      <div className="space-y-0.5">
                        {hiveMap.map(({ hive, count, speciesList }) => {
                          const hue = hslStringToHue(hive.accentHsl);
                          const isSelected = selectedHiveFamilies.has(hive.family);
                          return (
                            <button
                              key={hive.family}
                              onClick={() => handleHiveToggle(hive.family, speciesList)}
                              className="w-full flex items-center gap-3 py-2 px-2 rounded-lg transition-all group"
                              style={{ background: isSelected ? `hsla(${hue}, 40%, 25%, 0.25)` : "transparent" }}
                            >
                              {/* Checkbox-style colour swatch */}
                              <span
                                className="inline-flex items-center justify-center w-4 h-4 rounded shrink-0 text-[8px] font-bold transition-all"
                                style={{
                                  background: isSelected ? `hsl(${hue}, 55%, 45%)` : "transparent",
                                  boxShadow: isSelected ? `0 0 10px hsl(${hue}, 55%, 45%)` : "none",
                                  border: isSelected ? `1.5px solid hsl(${hue}, 55%, 55%)` : "1.5px solid hsla(0,0%,100%,0.2)",
                                  color: isSelected ? "hsl(0, 0%, 95%)" : "transparent",
                                }}
                              >
                                {isSelected ? "✓" : ""}
                              </span>
                              <span
                                className="text-[12px] font-serif group-hover:underline truncate"
                                style={{ color: isSelected ? `hsl(${hue}, 55%, 65%)` : "hsl(0, 0%, 62%)" }}
                              >
                                {hive.icon} {hive.displayName}
                              </span>
                              <span className="text-[10px] font-sans ml-auto pl-2 tabular-nums shrink-0" style={{ color: "hsl(42, 40%, 45%)" }}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </CollapsibleSection>
                  )}

                  {/* ── Visual Layers divider ── */}
                  {visualSections.length > 0 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Layers className="w-3 h-3 text-muted-foreground/50" />
                      <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em]">
                        Living Earth Layers
                      </span>
                      {activeLayerCount > 0 && (
                        <span className="text-[8px] font-bold rounded-full px-1.5 py-0.5 bg-primary/15 text-primary border border-primary/25">
                          {activeLayerCount} active
                        </span>
                      )}
                    </div>
                  )}
                  {visualSections.map(section => (
                    <CollapsibleSection
                      key={section.key}
                      title={section.title}
                      icon={section.icon}
                      sectionKey={section.key}
                      expanded={expandedSections.has(section.key)}
                      onToggle={toggleSection}
                      accent={section.accent}
                    >
                      <div className="space-y-0.5">
                        {section.layers.map(layer => (
                          <LayerToggle key={layer.key} layer={layer} />
                        ))}
                        {section.subContent}
                      </div>
                    </CollapsibleSection>
                  ))}

                </div>
              </ScrollArea>
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
      className="w-full flex items-center gap-2.5 px-2 py-2.5 rounded-md text-left transition-colors"
      style={{ color: layer.active ? `hsl(${accent})` : "hsl(42, 40%, 45%)" }}
    >
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
    </button>
  );
}

export default AtlasFilter;
