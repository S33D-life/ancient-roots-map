import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, Leaf, GitBranch, FolderTree, RotateCcw, Circle, TreePine, ExternalLink, Maximize2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFamilyForSpecies } from "@/data/treeSpecies";
import { getHiveForSpecies } from "@/utils/hiveUtils";
import { Link } from "react-router-dom";

export type LitePerspective = "collective" | "personal" | "tribe";

export type GroveScale = "all" | "hyper_local" | "local" | "regional";

export const GROVE_SCALES: { key: GroveScale; label: string; radiusKm: number; icon: string }[] = [
  { key: "all", label: "TETOL", radiusKm: Infinity, icon: "🌍" },
  { key: "hyper_local", label: "33m", radiusKm: 0.033, icon: "📍" },
  { key: "local", label: "1km", radiusKm: 1, icon: "🌿" },
  { key: "regional", label: "100km", radiusKm: 100, icon: "🗺️" },
];

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

const PERSPECTIVES: { key: LitePerspective; label: string; icon: string; accent: string }[] = [
  { key: "personal", label: "I AM", icon: "🌱", accent: "120, 50%, 45%" },
  { key: "collective", label: "TETOL", icon: "🌍", accent: "42, 90%, 55%" },
  { key: "tribe", label: "TRIBE", icon: "👥", accent: "200, 55%, 50%" },
];

/** Age band definitions */
export type AgeBand = "all" | "under100" | "100-300" | "300-800" | "800-1500" | "1500+";
export const AGE_BANDS: { key: AgeBand; label: string; min: number; max: number }[] = [
  { key: "under100", label: "Under 100y", min: 0, max: 99 },
  { key: "100-300", label: "100–300y", min: 100, max: 300 },
  { key: "300-800", label: "300–800y", min: 300, max: 800 },
  { key: "800-1500", label: "800–1,500y", min: 800, max: 1500 },
  { key: "1500+", label: "1,500y+", min: 1500, max: Infinity },
];

/** Girth band definitions (in cm, displayed as metres) */
export type GirthBand = "all" | "under200" | "200-400" | "400-600" | "600-800" | "800+";
export const GIRTH_BANDS: { key: GirthBand; label: string; minCm: number; maxCm: number }[] = [
  { key: "under200", label: "Under 2m", minCm: 0, maxCm: 199 },
  { key: "200-400", label: "2–4m", minCm: 200, maxCm: 400 },
  { key: "400-600", label: "4–6m", minCm: 400, maxCm: 600 },
  { key: "600-800", label: "6–8m", minCm: 600, maxCm: 800 },
  { key: "800+", label: "8m+", minCm: 800, maxCm: Infinity },
];

interface LiteMapFiltersProps {
  species: string[];
  onSpeciesChange: (s: string[]) => void;
  perspective: LitePerspective;
  onPerspectiveChange: (p: LitePerspective) => void;
  speciesCounts: Record<string, number>;
  totalVisible: number;
  lineageFilter?: string;
  onLineageChange?: (l: string) => void;
  availableLineages?: string[];
  projectFilter?: string;
  onProjectChange?: (p: string) => void;
  availableProjects?: string[];
  groveScale?: GroveScale;
  onGroveScaleChange?: (g: GroveScale) => void;
  ageBand?: AgeBand;
  onAgeBandChange?: (a: AgeBand) => void;
  girthBand?: GirthBand;
  onGirthBandChange?: (g: GirthBand) => void;
  /** Controlled refine panel state (lifted to parent) */
  refineOpen?: boolean;
  onRefineOpenChange?: (open: boolean) => void;
  /** Fullscreen toggle rendered in top bar where Refine used to be */
  onFullscreenToggle?: () => void;
  isFullscreen?: boolean;
}

/* ── Shared chip styles using HSL design tokens ── */
const chipBase = "shrink-0 px-2.5 py-1.5 rounded-full text-[11px] font-serif transition-all duration-200 active:scale-95 border backdrop-blur-sm";
const chipActive = "bg-primary/20 text-primary border-primary/50 shadow-[0_0_8px_hsl(var(--primary)/0.15)]";
const chipInactive = "bg-card/80 text-muted-foreground border-border/60 shadow-sm hover:bg-accent/30 hover:text-foreground";

const LiteMapFilters = ({
  species,
  onSpeciesChange,
  perspective,
  onPerspectiveChange,
  speciesCounts,
  totalVisible,
  lineageFilter = "all",
  onLineageChange,
  availableLineages = [],
  projectFilter = "all",
  onProjectChange,
  availableProjects = [],
  groveScale = "all",
  onGroveScaleChange,
  ageBand = "all",
  onAgeBandChange,
  girthBand = "all",
  onGirthBandChange,
  refineOpen: controlledRefineOpen,
  onRefineOpenChange,
  onFullscreenToggle,
  isFullscreen,
}: LiteMapFiltersProps) => {
  const [internalPanelOpen, setInternalPanelOpen] = useState(false);
  const panelOpen = controlledRefineOpen ?? internalPanelOpen;
  const setPanelOpen = onRefineOpenChange ?? setInternalPanelOpen;
  const [familyFilter, setFamilyFilter] = useState<string | null>(null);

  const isAllSpecies = species.length === 0;
  const hasActiveFilters = !isAllSpecies || lineageFilter !== "all" || projectFilter !== "all" || groveScale !== "all" || ageBand !== "all" || girthBand !== "all";

  // Derive hive link when exactly one species is selected
  const singleSpeciesHive = useMemo(() => {
    if (species.length !== 1) return null;
    const hive = getHiveForSpecies(species[0]);
    return hive ? { slug: hive.slug, name: hive.displayName, icon: hive.icon } : null;
  }, [species]);

  const speciesWithFamilies = useMemo(
    () =>
      STAFF_SPECIES.map((s) => ({
        ...s,
        family: getFamilyForSpecies(s.species) || "Other",
      })),
    []
  );

  const availableFamilies = useMemo(() => {
    const fams = new Map<string, number>();
    for (const s of speciesWithFamilies) {
      const count = speciesCounts[s.species.toLowerCase()] || 0;
      if (count > 0) {
        fams.set(s.family, (fams.get(s.family) || 0) + count);
      }
    }
    return Array.from(fams.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [speciesWithFamilies, speciesCounts]);

  const availableSpecies = useMemo(
    () =>
      speciesWithFamilies.filter((s) => {
        const hasCount = (speciesCounts[s.species.toLowerCase()] || 0) > 0;
        const matchesFamily = !familyFilter || s.family === familyFilter;
        return hasCount && matchesFamily;
      }),
    [speciesWithFamilies, speciesCounts, familyFilter]
  );

  const handleSpeciesToggle = useCallback((s: string) => {
    if (s === "all") {
      onSpeciesChange([]);
      return;
    }
    const lower = s.toLowerCase();
    const current = species.map(sp => sp.toLowerCase());
    if (current.includes(lower)) {
      onSpeciesChange(species.filter(sp => sp.toLowerCase() !== lower));
    } else {
      onSpeciesChange([...species, s]);
    }
  }, [species, onSpeciesChange]);

  const handleResetAll = useCallback(() => {
    onSpeciesChange([]);
    onLineageChange?.("all");
    onProjectChange?.("all");
    onGroveScaleChange?.("all");
    onAgeBandChange?.("all");
    onGirthBandChange?.("all");
    setFamilyFilter(null);
  }, [onSpeciesChange, onLineageChange, onProjectChange, onGroveScaleChange, onAgeBandChange, onGirthBandChange]);

  const activeFilterCount = [
    !isAllSpecies,
    lineageFilter !== "all",
    projectFilter !== "all",
    groveScale !== "all",
    ageBand !== "all",
    girthBand !== "all",
  ].filter(Boolean).length;

  const activeAccent = PERSPECTIVES.find(p => p.key === perspective)?.accent || "42, 90%, 55%";

  return (
    <>
      {/* ── Top bar: Mode Capsule + Filters ── */}
      <div className="absolute top-[4.5rem] left-3 right-3 z-[1000] flex flex-col gap-2 animate-fade-in">
        {/* Mode Capsule — unified segmented control */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center rounded-full p-[3px] backdrop-blur-md shrink-0"
            style={{
              background: "hsla(30, 25%, 10%, 0.88)",
              border: `1px solid hsla(${activeAccent}, 0.25)`,
              boxShadow: `0 2px 12px hsla(${activeAccent}, 0.1), inset 0 1px 0 hsla(0, 0%, 100%, 0.04)`,
            }}
          >
            {PERSPECTIVES.map((p) => {
              const isActive = perspective === p.key;
              return (
                <motion.button
                  key={p.key}
                  onClick={() => onPerspectiveChange(p.key)}
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

          {/* Fullscreen button (replaces Refine which moved to bottom bar) */}
          {onFullscreenToggle && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onFullscreenToggle}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-serif backdrop-blur-md transition-all duration-200"
              style={{
                background: isFullscreen ? `hsla(${activeAccent}, 0.15)` : "hsla(30, 25%, 10%, 0.85)",
                color: isFullscreen ? `hsl(${activeAccent})` : "hsla(42, 30%, 55%, 0.7)",
                border: `1px solid ${isFullscreen ? `hsla(${activeAccent}, 0.35)` : "hsla(42, 40%, 30%, 0.3)"}`,
                boxShadow: isFullscreen ? `0 0 8px hsla(${activeAccent}, 0.12)` : "none",
              }}
            >
              <Maximize2 className="w-3 h-3" /> <span className="hidden md:inline">Full Screen</span>
            </motion.button>
          )}
        </div>

        {/* Active filter chips — second row, only when filters are active */}
        <AnimatePresence mode="popLayout">
          {(hasActiveFilters || groveScale !== "all") && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="flex items-center gap-1.5 overflow-x-auto pl-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* Grove scale chips */}
              {onGroveScaleChange && GROVE_SCALES.map((g) => (
                <motion.button
                  key={g.key}
                  onClick={() => onGroveScaleChange(g.key)}
                  whileTap={{ scale: 0.93 }}
                  className={`${chipBase} ${groveScale === g.key ? chipActive : chipInactive}`}
                >
                  {g.icon} {g.label}
                </motion.button>
              ))}

              {lineageFilter !== "all" && (
                <motion.button
                  key="lineage-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onLineageChange?.("all")}
                  className={`${chipBase} ${chipActive} flex items-center gap-1`}
                >
                  <GitBranch className="w-3 h-3" /> {lineageFilter} <X className="w-3 h-3" />
                </motion.button>
              )}

              {projectFilter !== "all" && (
                <motion.button
                  key="project-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onProjectChange?.("all")}
                  className={`${chipBase} ${chipActive} flex items-center gap-1`}
                >
                  <FolderTree className="w-3 h-3" /> {projectFilter} <X className="w-3 h-3" />
                </motion.button>
              )}

              {ageBand !== "all" && (
                <motion.button
                  key="age-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onAgeBandChange?.("all")}
                  className={`${chipBase} ${chipActive} flex items-center gap-1`}
                >
                  🕰️ {AGE_BANDS.find(b => b.key === ageBand)?.label} <X className="w-3 h-3" />
                </motion.button>
              )}

              {girthBand !== "all" && (
                <motion.button
                  key="girth-chip"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => onGirthBandChange?.("all")}
                  className={`${chipBase} ${chipActive} flex items-center gap-1`}
                >
                  📏 {GIRTH_BANDS.find(b => b.key === girthBand)?.label} <X className="w-3 h-3" />
                </motion.button>
              )}

              {!isAllSpecies && species.map(sp => (
                <motion.button
                  key={`species-${sp}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => handleSpeciesToggle(sp)}
                  className={`${chipBase} ${chipActive} flex items-center gap-1`}
                >
                  {sp} <X className="w-3 h-3" />
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Perspective label — subtle context indicator */}
      <AnimatePresence>
        {perspective !== "collective" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-[1000] px-2.5 py-0.5 rounded-full text-[9px] font-serif"
            style={{
              top: hasActiveFilters || groveScale !== "all" ? "8.5rem" : "7rem",
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

      {/* ── Slide-up filter panel ── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[1000] bg-background/20"
              onClick={() => setPanelOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[1001] rounded-t-2xl border-t border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
              style={{ maxHeight: "65vh" }}
            >
              {/* Handle + Header */}
              <div className="flex flex-col items-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full" style={{ background: `hsla(${activeAccent}, 0.3)` }} />
              </div>

              <div className="px-4 pb-2 flex items-center justify-between">
                <h3 className="text-sm font-serif tracking-wider flex items-center gap-2" style={{ color: `hsl(${activeAccent})` }}>
                  <Filter className="w-3.5 h-3.5" style={{ opacity: 0.6 }} />
                  {perspective === "personal" ? "🌱 I AM · Refine" : perspective === "tribe" ? "👥 Tribe · Refine" : "🌍 TETOL · Refine"}
                </h3>
                <div className="flex items-center gap-2">
                  {/* View Hive CTA — shown when exactly one species is selected */}
                  {singleSpeciesHive && (
                    <Link
                      to={`/hive/${singleSpeciesHive.slug}`}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-serif text-primary/80 hover:text-primary bg-primary/8 hover:bg-primary/15 border border-primary/25 transition-colors"
                    >
                      {singleSpeciesHive.icon} View Hive <ExternalLink className="w-2.5 h-2.5" />
                    </Link>
                  )}
                  {hasActiveFilters && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleResetAll}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-serif text-primary/70 hover:text-primary bg-primary/8 hover:bg-primary/15 border border-primary/20 transition-colors"
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> Clear All
                    </motion.button>
                  )}
                </div>
              </div>

              <ScrollArea className="px-0" style={{ maxHeight: "calc(65vh - 60px)" }}>
                <div className="px-4 pb-4 space-y-4">

                  {/* ── Age Band ── */}
                  <div>
                    <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
                      🕰️ Age
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip active={ageBand === "all"} onClick={() => onAgeBandChange?.("all")} label="All Ages" />
                      {AGE_BANDS.map((b) => (
                        <FilterChip
                          key={b.key}
                          active={ageBand === b.key}
                          onClick={() => onAgeBandChange?.(ageBand === b.key ? "all" : b.key)}
                          label={b.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Girth Band ── */}
                  <div>
                    <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
                      📏 Girth
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      <FilterChip active={girthBand === "all"} onClick={() => onGirthBandChange?.("all")} label="All Sizes" />
                      {GIRTH_BANDS.map((b) => (
                        <FilterChip
                          key={b.key}
                          active={girthBand === b.key}
                          onClick={() => onGirthBandChange?.(girthBand === b.key ? "all" : b.key)}
                          label={b.label}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Lineage + Project filter rows ── */}
                  {(availableLineages.length > 0 || availableProjects.length > 0) && (
                    <div className="space-y-3">
                      {availableLineages.length > 0 && (
                        <div>
                          <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
                            <GitBranch className="w-2.5 h-2.5" />Lineage
                          </span>
                          <div className="flex gap-1.5 flex-wrap">
                            <FilterChip active={lineageFilter === "all"} onClick={() => onLineageChange?.("all")} label="All" />
                            {availableLineages.map((l) => (
                              <FilterChip
                                key={l}
                                active={lineageFilter === l}
                                onClick={() => onLineageChange?.(lineageFilter === l ? "all" : l)}
                                label={l}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {availableProjects.length > 0 && (
                        <div>
                          <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
                            <FolderTree className="w-2.5 h-2.5" />Project
                          </span>
                          <div className="flex gap-1.5 flex-wrap">
                            <FilterChip active={projectFilter === "all"} onClick={() => onProjectChange?.("all")} label="All" />
                            {availableProjects.map((p) => (
                              <FilterChip
                                key={p}
                                active={projectFilter === p}
                                onClick={() => onProjectChange?.(projectFilter === p ? "all" : p)}
                                label={p}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Family filter chips ── */}
                  <div>
                    <span className="text-[9px] font-serif text-muted-foreground/70 uppercase tracking-[0.15em] flex items-center gap-1 mb-1.5">
                      <Leaf className="w-2.5 h-2.5" /> Species
                    </span>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <FilterChip
                        active={!familyFilter}
                        onClick={() => setFamilyFilter(null)}
                        label="All Families"
                        icon={<Leaf className="w-2.5 h-2.5" />}
                      />
                      {availableFamilies.map((f) => (
                        <FilterChip
                          key={f.name}
                          active={familyFilter === f.name}
                          onClick={() => setFamilyFilter(familyFilter === f.name ? null : f.name)}
                          label={f.name}
                          count={f.count}
                        />
                      ))}
                    </div>

                    {/* Species grid — multi-select */}
                    <div className="grid grid-cols-5 gap-2">
                      {/* TETOL — show all */}
                      <StaffGridItem
                        active={isAllSpecies}
                        onClick={() => handleSpeciesToggle("all")}
                        label="TETOL"
                        isAll
                      />

                      {availableSpecies.map((s) => {
                        const count = speciesCounts[s.species.toLowerCase()] || 0;
                        const active = species.some(sp => sp.toLowerCase() === s.species.toLowerCase());
                        return (
                          <StaffGridItem
                            key={s.key}
                            active={active}
                            onClick={() => handleSpeciesToggle(s.species)}
                            label={s.species}
                            image={s.image}
                            count={count}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Filter Chip sub-component ── */
function FilterChip({ active, onClick, label, icon, count }: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count?: number;
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
        <span className={`text-[8px] rounded-full px-1 ${active ? "bg-primary/20" : "bg-muted/50"}`}>
          {count}
        </span>
      )}
    </motion.button>
  );
}

/* ── Staff Grid Item sub-component ── */
function StaffGridItem({ active, onClick, label, image, count, isAll }: {
  active: boolean;
  onClick: () => void;
  label: string;
  image?: string;
  count?: number;
  isAll?: boolean;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all duration-200 border ${
        active
          ? "bg-primary/10 border-primary/25 shadow-[0_0_10px_hsl(var(--primary)/0.1)]"
          : "border-transparent hover:bg-accent/15"
      }`}
    >
      <div className="relative">
        {isAll ? (
          <div className="w-11 h-11 rounded-full bg-muted/40 flex items-center justify-center text-lg border border-border/40">
            🌳
          </div>
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
        {/* Count badge */}
        {count !== undefined && count > 0 && (
          <motion.span
            initial={false}
            animate={{ scale: active ? 1.1 : 1 }}
            className="absolute -top-0.5 -right-0.5 text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground"
          >
            {count}
          </motion.span>
        )}
        {/* Active ring pulse */}
        {active && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/40 pointer-events-none"
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span className={`text-[9px] font-serif leading-tight text-center transition-colors ${
        active ? "text-primary" : "text-muted-foreground"
      }`}>
        {label}
      </span>
    </motion.button>
  );
}

export default LiteMapFilters;
