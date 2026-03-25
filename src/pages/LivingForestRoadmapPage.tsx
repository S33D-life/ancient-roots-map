import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Map as MapIcon, List, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import SeasonalLensBanner from "@/components/seasonal/SeasonalLensBanner";
import StageIcon from "@/components/roadmap/StageIcon";
import { hslAlpha } from "@/utils/colorUtils";
import {
  ROADMAP_FEATURES,
  STAGE_META,
  STATUS_META,
  CATEGORY_META,
  REGION_META,
  type RoadmapFeature,
  type RoadmapRegion,
  type RoadmapStage,
  type RoadmapStatus,
  type RoadmapCategory,
} from "@/data/roadmap-forest";

const RoadmapEmbed = lazy(() => import("@/components/roadmap/RoadmapEmbed"));

/* ── mycelial SVG connections ── */
const MycelialLines = ({
  features,
  positions,
  activeId,
}: {
  features: RoadmapFeature[];
  positions: Map<string, { x: number; y: number }>;
  activeId: string | null;
}) => {
  const lines = useMemo(() => {
    const result: { x1: number; y1: number; x2: number; y2: number; highlight: boolean }[] = [];
    const seen = new Set<string>();
    for (const f of features) {
      for (const cId of f.connections) {
        const key = [f.id, cId].sort().join("-");
        if (seen.has(key)) continue;
        seen.add(key);
        const a = positions.get(f.id);
        const b = positions.get(cId);
        if (!a || !b) continue;
        const highlight = activeId === f.id || activeId === cId;
        result.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, highlight });
      }
    }
    return result;
  }, [features, positions, activeId]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <linearGradient id="myc-glow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="hsl(var(--sacred-gold))" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="myc-active" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
          <stop offset="100%" stopColor="hsl(var(--sacred-gold))" stopOpacity="0.6" />
        </linearGradient>
      </defs>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke={`url(#${l.highlight ? "myc-active" : "myc-glow"})`}
          strokeWidth={l.highlight ? 2.5 : 1.2}
          strokeDasharray={l.highlight ? "none" : "6 4"}
          className="transition-all duration-500"
        />
      ))}
    </svg>
  );
};

/* ── feature marker node ── */
const FeatureNode = ({
  feature,
  isActive,
  onSelect,
}: {
  feature: RoadmapFeature;
  isActive: boolean;
  onSelect: (f: RoadmapFeature) => void;
}) => {
  const meta = STAGE_META[feature.stage];
  const sizeClass = {
    seed: "scale-[0.85]",
    sprout: "scale-95",
    rooted: "scale-100",
    ancient: "scale-110",
  }[feature.stage];

  const isLive = feature.status === "live" && feature.route;

  return (
    <motion.button
      onClick={() => onSelect(feature)}
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.95 }}
      className={`
        group relative flex flex-col items-center gap-1.5 p-2 rounded-xl
        transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-ring
        ${sizeClass}
        ${isActive ? "z-20" : "z-10"}
      `}
      aria-label={`${feature.name} — ${meta.label}`}
    >
      {feature.stage === "ancient" && (
        <span className="absolute inset-0 rounded-xl animate-pulse opacity-30"
          style={{ boxShadow: `0 0 20px 4px hsl(var(--sacred-gold) / 0.4)` }} />
      )}
      {isLive && (
        <span className="absolute -inset-1 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: `0 0 12px 2px hsl(120 55% 45% / 0.2)` }} />
      )}
      <span
        className={`
          w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center
          border-2 transition-colors duration-300 text-sm
          ${isActive
            ? "border-primary bg-primary/20 shadow-lg"
            : isLive
              ? "border-border/40 bg-card/70 group-hover:border-primary/50 group-hover:bg-card ring-1 ring-primary/10"
              : "border-border/40 bg-card/70 group-hover:border-border/60 opacity-75"
          }
        `}
      >
        {feature.symbol || <StageIcon stage={feature.stage} className="w-5 h-5 md:w-6 md:h-6 text-primary" />}
      </span>
      <span className={`text-[10px] md:text-xs font-serif text-center leading-tight max-w-[90px] ${isLive ? "text-foreground/80" : "text-foreground/50"}`}>
        {feature.name}
      </span>
      <span
        className="text-[8px] md:text-[9px] px-1.5 py-0.5 rounded-full font-sans"
        style={{ background: hslAlpha(meta.color, 0.12), color: meta.color }}
      >
        {meta.emoji} {feature.stage}
      </span>
    </motion.button>
  );
};

/* ── detail panel ── */
const DetailPanel = ({
  feature,
  onClose,
  onNavigate,
}: {
  feature: RoadmapFeature;
  onClose: () => void;
  onNavigate: (route: string) => void;
}) => {
  const regionMeta = REGION_META[feature.region];
  const statusMeta = STATUS_META[feature.status];
  const catMeta = CATEGORY_META[feature.category];
  const connected = ROADMAP_FEATURES.filter((f) => feature.connections.includes(f.id));
  const isLive = feature.status === "live" && feature.route;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-8 md:right-8 md:w-96
                 bg-card/95 backdrop-blur-md border border-border/40 rounded-2xl p-5
                 shadow-2xl z-50"
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground/50 hover:text-foreground transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-3 mb-3">
        <span className="w-10 h-10 rounded-full flex items-center justify-center border border-primary/30 bg-primary/10 shrink-0 text-sm">
          {feature.symbol || <StageIcon stage={feature.stage} className="w-5 h-5 text-primary" />}
        </span>
        <div>
          <h3 className="font-serif text-base text-foreground">{feature.name}</h3>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-sans"
              style={{ background: hslAlpha(statusMeta.color, 0.08), color: statusMeta.color }}>
              {statusMeta.emoji} {statusMeta.label}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-sans bg-primary/5 text-muted-foreground">
              {catMeta.emoji} {catMeta.label}
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{feature.description}</p>

      {/* Navigation CTA or coming-soon message */}
      {isLive ? (
        <button
          onClick={() => onNavigate(feature.route!)}
          className="w-full mb-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-serif
                     bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 hover:border-primary/40
                     transition-all duration-300"
        >
          Enter {feature.name}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="mb-4 px-3 py-2.5 rounded-xl border border-border/30 bg-muted/30 text-center">
          <p className="text-xs text-muted-foreground font-serif">
            {feature.status === "building" ? "🌿 Growing — this feature is being built" : "🌱 Seed — this feature is planned for the future"}
          </p>
        </div>
      )}

      <div className="text-xs text-muted-foreground/70 mb-3">
        <span className="font-serif text-foreground/60">{regionMeta.label}</span> · {regionMeta.description}
      </div>

      {feature.notionLink && (
        <a
          href={feature.notionLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline mb-3"
        >
          <ExternalLink className="w-3 h-3" /> View documentation in Notion
        </a>
      )}

      {connected.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 mb-1.5 font-sans">
            Mycelial connections
          </p>
          <div className="flex flex-wrap gap-1.5">
            {connected.map((c) => (
              <span key={c.id} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/15 font-sans">
                {STAGE_META[c.stage].emoji} {c.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

/* ── environment particles ── */
const ForestParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
    {Array.from({ length: 8 }).map((_, i) => (
      <motion.span
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          background: "hsl(var(--sacred-gold))",
          left: `${12 + (i * 11) % 80}%`,
          top: `${8 + (i * 17) % 85}%`,
        }}
        animate={{
          opacity: [0, 0.6, 0],
          y: [0, -15, 0],
          x: [0, (i % 2 ? 8 : -8), 0],
        }}
        transition={{
          duration: 5 + (i % 3) * 2,
          repeat: Infinity,
          delay: i * 1.2,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

/* ── Map View (Kumu-style visual network) ── */
const MapView = ({ onNavigate }: { onNavigate: (route: string) => void }) => {
  const [activeFeature, setActiveFeature] = useState<RoadmapFeature | null>(null);
  const [regionFilter, setRegionFilter] = useState<RoadmapRegion | null>(null);
  const [statusFilter, setStatusFilter] = useState<RoadmapStatus | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<RoadmapCategory | null>(null);

  const filtered = useMemo(() => {
    let items = ROADMAP_FEATURES;
    if (regionFilter) items = items.filter((f) => f.region === regionFilter);
    if (statusFilter) items = items.filter((f) => f.status === statusFilter);
    if (categoryFilter) items = items.filter((f) => f.category === categoryFilter);
    return items;
  }, [regionFilter, statusFilter, categoryFilter]);

  const COLS = 5;
  const COL_W = 140;
  const ROW_H = 120;
  const positions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const f of ROADMAP_FEATURES) {
      map.set(f.id, {
        x: f.col * COL_W + COL_W / 2,
        y: f.row * ROW_H + ROW_H / 2 + 40,
      });
    }
    return map;
  }, []);

  const totalRows = Math.max(...ROADMAP_FEATURES.map((f) => f.row)) + 1;

  const handleSelect = useCallback((f: RoadmapFeature) => {
    setActiveFeature((prev) => (prev?.id === f.id ? null : f));
  }, []);

  return (
    <>
      {/* ── Filter chips ── */}
      <div className="space-y-2 mb-8">
        <div className="flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setRegionFilter(null)}
            className={`text-[11px] px-3 py-1 rounded-full font-serif transition-colors border
              ${!regionFilter
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/30 text-muted-foreground hover:border-primary/30"
              }`}
          >
            All regions
          </button>
          {(Object.keys(REGION_META) as RoadmapRegion[]).map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(regionFilter === r ? null : r)}
              className={`text-[11px] px-3 py-1 rounded-full font-serif transition-colors border
                ${regionFilter === r
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30"
                }`}
            >
              {REGION_META[r].label}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {(Object.keys(CATEGORY_META) as RoadmapCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-serif transition-colors border
                ${categoryFilter === cat
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30"
                }`}
            >
              {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
            </button>
          ))}
          <span className="w-px h-5 bg-border/30 self-center" />
          {(Object.keys(STATUS_META) as RoadmapStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(statusFilter === st ? null : st)}
              className={`text-[10px] px-2.5 py-1 rounded-full font-serif transition-colors border
                ${statusFilter === st
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border/30 text-muted-foreground hover:border-primary/30"
                }`}
            >
              {STATUS_META[st].emoji} {STATUS_META[st].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Forest landscape ── */}
      <div className="relative mx-auto overflow-x-auto">
        <div
          className="relative mx-auto"
          style={{
            width: COLS * COL_W,
            minHeight: totalRows * ROW_H + 80,
          }}
        >
          <ForestParticles />
          <MycelialLines
            features={ROADMAP_FEATURES}
            positions={positions}
            activeId={activeFeature?.id ?? null}
          />

          {([
            { region: "roots" as RoadmapRegion, startRow: 0 },
            { region: "trunk" as RoadmapRegion, startRow: 4 },
            { region: "canopy" as RoadmapRegion, startRow: 6 },
            { region: "mycelium" as RoadmapRegion, startRow: 8 },
          ]).map(({ region, startRow }) => (
            <div
              key={region}
              className="absolute left-0 right-0 flex items-center gap-2 px-2"
              style={{ top: startRow * ROW_H - 8 }}
            >
              <span className="h-px flex-1 bg-border/15" />
              <span className="text-[9px] md:text-[10px] font-serif tracking-[0.2em] uppercase text-muted-foreground/40">
                {REGION_META[region].label}
              </span>
              <span className="h-px flex-1 bg-border/15" />
            </div>
          ))}

          {filtered.map((f) => {
            const pos = positions.get(f.id);
            if (!pos) return null;
            return (
              <div
                key={f.id}
                className="absolute"
                style={{
                  left: pos.x - COL_W / 2,
                  top: pos.y - ROW_H / 2 + 10,
                  width: COL_W,
                  height: ROW_H,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FeatureNode
                  feature={f}
                  isActive={activeFeature?.id === f.id}
                  onSelect={handleSelect}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <section className="mt-12 text-center max-w-md mx-auto">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 mb-2 font-sans">
          How to read the forest
        </p>
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          Each node is a feature. Faint dashed lines beneath represent mycelial connections
          between systems. Click any node to learn more. The forest grows richer as development continues.
        </p>
      </section>

      <AnimatePresence>
        {activeFeature && (
          <DetailPanel
            key={activeFeature.id}
            feature={activeFeature}
            onClose={() => setActiveFeature(null)}
            onNavigate={onNavigate}
          />
        )}
      </AnimatePresence>
    </>
  );
};

/* ── View toggle tabs ── */
type RoadmapView = "map" | "list";

const ViewToggle = ({
  view,
  onChange,
}: {
  view: RoadmapView;
  onChange: (v: RoadmapView) => void;
}) => (
  <div className="flex justify-center mb-8">
    <div className="inline-flex items-center gap-1 p-1 rounded-full border border-border/40 bg-card/60 backdrop-blur-sm">
      <button
        onClick={() => onChange("map")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-serif transition-all duration-300
          ${view === "map"
            ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
          }`}
      >
        <MapIcon className="w-3.5 h-3.5" />
        Map View
      </button>
      <button
        onClick={() => onChange("list")}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-serif transition-all duration-300
          ${view === "list"
            ? "bg-primary/15 text-primary border border-primary/30 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
          }`}
      >
        <List className="w-3.5 h-3.5" />
        List View
      </button>
    </div>
  </div>
);

/* ── MAIN PAGE ── */
const LivingForestRoadmapPage = () => {
  useDocumentTitle("Living Forest Roadmap");
  const navigate = useNavigate();
  const [view, setView] = useState<RoadmapView>("map");

  const handleNavigate = useCallback((route: string) => {
    navigate(route);
  }, [navigate]);

  const counts = useMemo(() => {
    const c: Record<RoadmapStage, number> = { seed: 0, sprout: 0, rooted: 0, ancient: 0 };
    ROADMAP_FEATURES.forEach((f) => c[f.stage]++);
    return c;
  }, []);

  return (
    <PageShell cinematic>
      <div className="min-h-screen flex flex-col relative">
        <Header />

        <main className="flex-1 container mx-auto px-4 pb-28 md:pb-12" style={{ paddingTop: 'var(--content-top)' }}>
          {/* ── Hero ── */}
          <section className="text-center mb-6 max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-2">
              Living Forest Roadmap
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              The S33D ecosystem grows like a forest. Seeds are planted, shoots emerge,
              trees take root, and ancient pillars anchor the canopy.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/map")}
              className="font-serif text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
            >
              Enter the Living System
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </section>

          {/* ── Stats strip ── */}
          <div className="flex justify-center gap-4 md:gap-6 mb-4 flex-wrap">
            {(Object.keys(STAGE_META) as RoadmapStage[]).map((s) => (
              <div key={s} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <StageIcon stage={s} className="w-3.5 h-3.5" />
                <span className="font-serif">{counts[s]}</span>
                <span className="hidden sm:inline">{STAGE_META[s].label.split("—")[0].trim()}</span>
              </div>
            ))}
          </div>

          {/* Seasonal lens context */}
          <div className="max-w-lg mx-auto mb-6">
            <SeasonalLensBanner context="general" />
          </div>

          {/* ── View Toggle ── */}
          <ViewToggle view={view} onChange={setView} />

          {/* ── View Content ── */}
          <AnimatePresence mode="wait">
            {view === "map" ? (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
              >
                <MapView onNavigate={handleNavigate} />
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="max-w-3xl mx-auto"
              >
                <Suspense fallback={<div className="py-12 text-center text-muted-foreground text-sm">Growing the roadmap…</div>}>
                  <RoadmapEmbed />
                </Suspense>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <Footer />
      </div>
    </PageShell>
  );
};

export default LivingForestRoadmapPage;
