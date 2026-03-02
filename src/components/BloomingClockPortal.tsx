/**
 * BloomingClockPortal — Hearth-level celestial instrument & Atlas portal.
 *
 * 4 progressive layers revealed by deliberate user action:
 *   Layer 1 — Beauty Mode (default): Dial + seasonal animation only
 *   Layer 2 — Insight Mode: Tap regions for seasonal cards
 *   Layer 3 — Tuning Mode: Full Atlas tuning panel
 *   Layer 4 — Research Mode: Timeline scrubbing & deep data
 *
 * Unlocking is gated by useAtlasProgression.
 */
import { useState, useCallback, lazy, Suspense, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Eye, SlidersHorizontal, FlaskConical, Lock, ChevronRight, Compass, Sparkles } from "lucide-react";
import { useAtlasProgression, type AtlasLayer } from "@/hooks/use-atlas-progression";
import { useFoodCycles, type CycleStage, STAGE_VISUALS } from "@/hooks/use-food-cycles";
import BloomingClockFace from "@/components/BloomingClockFace";

/* ── Layer metadata ── */
const LAYERS: {
  key: AtlasLayer;
  label: string;
  icon: React.ReactNode;
  desc: string;
  accent: string;
}[] = [
  { key: "beauty", label: "Beauty", icon: <Eye className="w-3.5 h-3.5" />, desc: "Observe the seasons turn", accent: "42, 70%, 55%" },
  { key: "insight", label: "Insight", icon: <Sparkles className="w-3.5 h-3.5" />, desc: "Discover regional rhythms", accent: "340, 55%, 65%" },
  { key: "tuning", label: "Tuning", icon: <SlidersHorizontal className="w-3.5 h-3.5" />, desc: "Craft your perspective", accent: "200, 55%, 50%" },
  { key: "research", label: "Research", icon: <FlaskConical className="w-3.5 h-3.5" />, desc: "Deep seasonal analysis", accent: "152, 40%, 45%" },
];

const LAYER_ORDER: AtlasLayer[] = ["beauty", "insight", "tuning", "research"];

/* ── Palette matching BloomingClockFace ── */
const P = {
  brass: "hsl(42, 55%, 52%)",
  brassLight: "hsl(42, 65%, 68%)",
  brassDim: "hsl(42, 28%, 32%)",
  midnight: "hsl(225, 28%, 7%)",
  midnightL: "hsl(225, 20%, 12%)",
};

export default function BloomingClockPortal() {
  const navigate = useNavigate();
  const { unlockedLayers, highestLayer, nextLayerProgress, nextUnlockHint, loading: progressionLoading } = useAtlasProgression();
  const { foods: foodCycles } = useFoodCycles();

  const [activeLayer, setActiveLayer] = useState<AtlasLayer>("beauty");
  const [bloomMonth, setBloomMonth] = useState(new Date().getMonth() + 1);
  const [bloomStage, setBloomStage] = useState<CycleStage | "all">("all");
  const [selectedFoodIds, setSelectedFoodIds] = useState<string[]>([]);
  const [showTuningPanel, setShowTuningPanel] = useState(false);

  // Tuning sliders (Layer 3)
  const [tuning, setTuning] = useState({
    hiveEmphasis: 50,
    seasonalIntensity: 70,
    activityPulse: 40,
    dataDensity: 60,
    particleSubtlety: 50,
  });

  // Insight mode state (Layer 2)
  const [insightCard, setInsightCard] = useState<{ month: number; stage: string } | null>(null);

  const isLayerUnlocked = useCallback((layer: AtlasLayer) => unlockedLayers.includes(layer), [unlockedLayers]);

  const handleLayerSelect = useCallback((layer: AtlasLayer) => {
    if (!isLayerUnlocked(layer)) return;
    setActiveLayer(layer);
    if (layer === "tuning") setShowTuningPanel(true);
    else setShowTuningPanel(false);
  }, [isLayerUnlocked]);

  const handleFoodToggle = useCallback((id: string) => {
    setSelectedFoodIds(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  }, []);

  const handleMonthChange = useCallback((m: number) => {
    setBloomMonth(m);
    if (activeLayer === "insight") {
      const stage = bloomStage === "all" ? "flowering" : bloomStage;
      setInsightCard({ month: m, stage });
    }
  }, [activeLayer, bloomStage]);

  const handleEnterAtlas = useCallback(() => {
    const params = new URLSearchParams();
    if (bloomStage !== "all") params.set("bloomStage", bloomStage);
    if (selectedFoodIds.length > 0) params.set("foods", selectedFoodIds.join(","));
    // Encode tuning as query params for Atlas to pick up
    if (activeLayer === "tuning" || activeLayer === "research") {
      Object.entries(tuning).forEach(([k, v]) => {
        if (v !== 50) params.set(k, String(v));
      });
    }
    const qs = params.toString();
    navigate(`/map${qs ? `?${qs}` : ""}`);
  }, [navigate, bloomStage, selectedFoodIds, activeLayer, tuning]);

  const activeLayerIdx = LAYER_ORDER.indexOf(activeLayer);
  const activeAccent = LAYERS.find(l => l.key === activeLayer)?.accent || "42, 70%, 55%";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* ── Portal Header ── */}
      <div className="text-center mb-4">
        <h2
          className="font-serif text-lg md:text-xl tracking-wider mb-1"
          style={{ color: P.brassLight, textShadow: `0 0 30px hsla(42, 70%, 50%, 0.3)` }}
        >
          Blooming Clock
        </h2>
        <p className="font-serif text-[11px] italic tracking-wide" style={{ color: P.brassDim }}>
          The planet's seasonal heartbeat
        </p>
      </div>

      {/* ── Layer Selector Tabs ── */}
      <div
        className="flex items-center justify-center gap-1 mb-5 p-1 rounded-full mx-auto w-fit"
        style={{
          background: "hsla(225, 25%, 8%, 0.9)",
          border: `1px solid hsla(${activeAccent}, 0.2)`,
          backdropFilter: "blur(12px)",
        }}
      >
        {LAYERS.map((layer, i) => {
          const unlocked = isLayerUnlocked(layer.key);
          const isActive = activeLayer === layer.key;
          return (
            <motion.button
              key={layer.key}
              onClick={() => handleLayerSelect(layer.key)}
              whileTap={unlocked ? { scale: 0.95 } : undefined}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-serif transition-all duration-200"
              style={{
                color: !unlocked
                  ? "hsla(42, 20%, 35%, 0.4)"
                  : isActive
                    ? `hsl(${layer.accent})`
                    : "hsla(42, 30%, 55%, 0.6)",
                cursor: unlocked ? "pointer" : "default",
                opacity: unlocked ? 1 : 0.5,
              }}
              title={!unlocked ? `Locked — ${nextUnlockHint || "Keep exploring"}` : layer.desc}
            >
              {isActive && (
                <motion.div
                  layoutId="portal-layer-indicator"
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `hsla(${layer.accent}, 0.1)`,
                    border: `1.5px solid hsla(${layer.accent}, 0.35)`,
                    boxShadow: `0 0 12px hsla(${layer.accent}, 0.15)`,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">
                {unlocked ? layer.icon : <Lock className="w-3 h-3" />}
              </span>
              <span className="relative z-10 hidden sm:inline tracking-wide">{layer.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* ── Clock Face ── */}
      <div className="relative">
        <BloomingClockFace
          currentMonth={bloomMonth}
          onMonthChange={handleMonthChange}
          stageFilter={bloomStage}
          onStageChange={setBloomStage}
          foods={foodCycles}
          selectedFoodIds={selectedFoodIds}
          onFoodToggle={handleFoodToggle}
          onFoodClear={() => setSelectedFoodIds([])}
        />

        {/* Layer 2 — Insight Card overlay */}
        <AnimatePresence>
          {activeLayer === "insight" && insightCard && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-3 rounded-xl max-w-[260px]"
              style={{
                background: "hsla(225, 25%, 10%, 0.95)",
                border: `1px solid hsla(${activeAccent}, 0.3)`,
                backdropFilter: "blur(16px)",
                boxShadow: `0 8px 32px hsla(0, 0%, 0%, 0.4), 0 0 20px hsla(${activeAccent}, 0.1)`,
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{STAGE_VISUALS[insightCard.stage as CycleStage]?.icon || "🌿"}</span>
                <span className="font-serif text-xs tracking-wide" style={{ color: `hsl(${activeAccent})` }}>
                  {STAGE_VISUALS[insightCard.stage as CycleStage]?.label || insightCard.stage}
                </span>
              </div>
              <p className="font-serif text-[10px] leading-relaxed" style={{ color: P.brassLight, opacity: 0.7 }}>
                {getInsightText(insightCard.month, insightCard.stage)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Layer 3 — Tuning Panel ── */}
      <AnimatePresence>
        {activeLayer === "tuning" && showTuningPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden mt-4"
          >
            <div
              className="rounded-2xl p-5 space-y-4"
              style={{
                background: "linear-gradient(135deg, hsla(225, 25%, 10%, 0.9), hsla(225, 20%, 7%, 0.95))",
                border: "1px solid hsla(200, 55%, 50%, 0.15)",
                boxShadow: "0 0 30px hsla(200, 55%, 50%, 0.06), inset 0 1px 0 hsla(0, 0%, 100%, 0.03)",
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif text-xs tracking-[0.15em] uppercase" style={{ color: "hsl(200, 55%, 55%)" }}>
                  <SlidersHorizontal className="w-3 h-3 inline mr-1.5" style={{ opacity: 0.6 }} />
                  Craft Your Perspective
                </h3>
              </div>

              {Object.entries(tuning).map(([key, value]) => (
                <TuningSlider
                  key={key}
                  label={formatTuningLabel(key)}
                  value={value}
                  onChange={(v) => setTuning(prev => ({ ...prev, [key]: v }))}
                  accent={activeAccent}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Layer 4 — Research teaser ── */}
      <AnimatePresence>
        {activeLayer === "research" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 rounded-2xl p-5"
            style={{
              background: "linear-gradient(135deg, hsla(152, 20%, 10%, 0.9), hsla(152, 15%, 7%, 0.95))",
              border: "1px solid hsla(152, 40%, 45%, 0.15)",
            }}
          >
            <h3 className="font-serif text-xs tracking-[0.15em] uppercase mb-3" style={{ color: "hsl(152, 40%, 50%)" }}>
              <FlaskConical className="w-3 h-3 inline mr-1.5" style={{ opacity: 0.6 }} />
              Research Mode
            </h3>
            <div className="space-y-2">
              {["Timeline Scrubbing", "Historic Bloom Comparison", "Climate Overlay", "Deep Data Visualization"].map(feature => (
                <div key={feature} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "hsla(152, 25%, 15%, 0.3)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(152, 50%, 50%)" }} />
                  <span className="font-serif text-[11px]" style={{ color: "hsl(152, 30%, 65%)" }}>{feature}</span>
                  <span className="text-[8px] font-serif ml-auto" style={{ color: "hsla(152, 30%, 45%, 0.5)" }}>coming soon</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Portal CTA — Enter Atlas ── */}
      <motion.button
        onClick={handleEnterAtlas}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-5 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-serif text-sm tracking-wide transition-all duration-300"
        style={{
          background: `linear-gradient(135deg, hsla(${activeAccent}, 0.2), hsla(${activeAccent}, 0.08))`,
          color: `hsl(${activeAccent})`,
          border: `1px solid hsla(${activeAccent}, 0.25)`,
          boxShadow: `0 4px 20px hsla(${activeAccent}, 0.1)`,
        }}
      >
        <Compass className="w-4 h-4" />
        Enter the Atlas
        <ChevronRight className="w-3.5 h-3.5 ml-1" />
      </motion.button>

      {/* ── Progression hint ── */}
      {nextUnlockHint && (
        <div className="mt-3 text-center">
          <p className="font-serif text-[9px] italic tracking-wide" style={{ color: P.brassDim, opacity: 0.6 }}>
            Next unlock: {nextUnlockHint}
          </p>
          <div className="w-32 h-0.5 mx-auto mt-1.5 rounded-full overflow-hidden" style={{ background: "hsla(42, 30%, 25%, 0.3)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: P.brass, width: `${nextLayerProgress * 100}%` }}
              initial={{ width: 0 }}
              animate={{ width: `${nextLayerProgress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tuning Slider sub-component ── */
function TuningSlider({ label, value, onChange, accent }: {
  label: string; value: number; onChange: (v: number) => void; accent: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-serif text-[10px] tracking-wide" style={{ color: "hsla(42, 40%, 60%, 0.7)" }}>
          {label}
        </span>
        <span className="font-mono text-[9px] tabular-nums" style={{ color: `hsla(${accent}, 0.5)` }}>
          {value}%
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(${accent}) ${value}%, hsla(42, 20%, 20%, 0.4) ${value}%)`,
            // @ts-ignore — vendor prefix
            WebkitAppearance: "none",
          }}
        />
      </div>
    </div>
  );
}

/* ── Helpers ── */
function formatTuningLabel(key: string): string {
  return key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase());
}

function getInsightText(month: number, stage: string): string {
  const monthNames = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const stageDescs: Record<string, string> = {
    flowering: "Blossoms unfold across temperate regions. Pollinators awaken.",
    fruiting: "Fruits swell beneath canopies. The grove prepares its harvest.",
    harvest: "The earth yields its gifts. Communities gather abundance.",
    dormant: "Deep rest. Roots deepen. The forest dreams of spring.",
    peak: "Full radiance. Every branch heavy with life.",
  };
  return `${monthNames[month]} — ${stageDescs[stage] || "The forest breathes."}`;
}
