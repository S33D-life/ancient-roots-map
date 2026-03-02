/**
 * LegacyLayersPanel — Temporary reference interface for auditing layer parity.
 * 
 * Shows a flat, ungrouped list of ALL visual layer toggles alongside the unified
 * AtlasFilter panel. Includes a "Compare" dev mode that logs discrepancies.
 * 
 * TEMPORARY — remove after audit is complete.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VisualLayerSection } from "./AtlasFilter";
import { useMapFilters } from "@/contexts/MapFilterContext";

interface LegacyLayersPanelProps {
  visualSections: VisualLayerSection[];
  /** All layer state keys and their current values — for comparison audit */
  layerStates: Record<string, boolean>;
  /** Additional context filters for comparison */
  filterStates: Record<string, string>;
}

/** Master registry of ALL layer keys that should exist — the "ground truth" */
const EXPECTED_LAYERS = [
  // Mycelial Whispers / Signals
  { key: "seeds", label: "💚 Bloomed Seeds", group: "Signals" },
  { key: "offering-glow", label: "🔥 Forest Warmth", group: "Signals" },
  { key: "heart-glow", label: "❤️ Heart Glow", group: "Signals" },
  { key: "birdsong", label: "🐦 Birdsong Heat", group: "Signals" },
  { key: "hive-layer", label: "🐝 Species Hives", group: "Signals" },
  // Structures
  { key: "groves", label: "🌿 Grove Boundaries", group: "Structures" },
  { key: "root-threads", label: "✦ Root Threads", group: "Structures" },
  { key: "research", label: "📜 Elder Archives", group: "Structures" },
  { key: "champion", label: "🏆 Champion Trees", group: "Structures" },
  { key: "immutable", label: "🔱 Minted Sigils", group: "Structures" },
  { key: "external", label: "🗺️ Distant Groves", group: "Structures" },
  // Pilgrimage
  { key: "waters", label: "🌊 Waterside Guardians", group: "Sacred" },
  { key: "churchyards", label: "⛪ Churchyards", group: "Sacred" },
  { key: "parklands", label: "🏛️ Parkland Elders", group: "Sacred" },
  { key: "commons", label: "🌾 Commons Witnesses", group: "Sacred" },
  // Wanderer
  { key: "bloomed-seeds", label: "🌱 Bloomed Seeds (personal)", group: "Wanderer" },
  { key: "recent-visits", label: "◎ Recent Visits", group: "Wanderer" },
  { key: "seed-traces", label: "✿ Seed & Offering Traces", group: "Wanderer" },
  { key: "shared-trees", label: "◐ Shared Trees", group: "Wanderer" },
  { key: "tribe-activity", label: "⊛ Tribe Activity", group: "Wanderer" },
  // Blooming Clock
  { key: "seasonal-foods", label: "🌸 Seasonal Foods", group: "Blooming Clock" },
  { key: "constellation", label: "🌾 Constellation Mode", group: "Blooming Clock" },
  // Living Earth
  { key: "grove-view", label: "👁 Living Earth Mode", group: "Mode" },
] as const;

const LegacyLayersPanel = ({
  visualSections,
  layerStates,
  filterStates,
}: LegacyLayersPanelProps) => {
  const [open, setOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const { perspective, ageBand, girthBand, groveScale } = useMapFilters();

  // Flatten unified panel's layers for comparison
  const unifiedLayers = useMemo(() => {
    const map = new Map<string, { active: boolean; toggle: () => void }>();
    visualSections.forEach(s => {
      s.layers.forEach(l => {
        map.set(l.key, { active: l.active, toggle: l.toggle });
      });
    });
    return map;
  }, [visualSections]);

  // Run parity audit
  const runAudit = useCallback(() => {
    const log: string[] = [];
    log.push("═══ LAYER PARITY AUDIT ═══");
    log.push(`Timestamp: ${new Date().toISOString()}`);
    log.push("");

    // Check every expected layer
    let missing = 0;
    let present = 0;
    let active = 0;

    EXPECTED_LAYERS.forEach(expected => {
      const inUnified = unifiedLayers.has(expected.key);
      const stateValue = layerStates[expected.key];
      const isActive = stateValue === true || unifiedLayers.get(expected.key)?.active === true;

      if (!inUnified) {
        log.push(`❌ MISSING in unified: ${expected.label} [${expected.group}]`);
        missing++;
      } else {
        present++;
        if (isActive) active++;
        log.push(`✅ ${expected.label} — ${isActive ? "ON" : "off"}`);
      }
    });

    log.push("");
    log.push(`── Summary ──`);
    log.push(`Present: ${present}/${EXPECTED_LAYERS.length}`);
    log.push(`Missing: ${missing}`);
    log.push(`Active: ${active}`);
    log.push("");

    // Filter context
    log.push(`── Filter Context ──`);
    log.push(`Perspective: ${perspective}`);
    log.push(`Age Band: ${ageBand}`);
    log.push(`Girth Band: ${girthBand}`);
    log.push(`Grove Scale: ${groveScale}`);
    Object.entries(filterStates).forEach(([k, v]) => {
      log.push(`${k}: ${v}`);
    });

    log.push("");
    log.push("═══ END AUDIT ═══");

    setAuditLog(log);
    // Also output to console for dev inspection
    console.group("🔍 Layer Parity Audit");
    log.forEach(l => console.log(l));
    console.groupEnd();
  }, [unifiedLayers, layerStates, filterStates, perspective, ageBand, girthBand, groveScale]);

  return (
    <>
      {/* Legacy Layers floating button — positioned right side */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute bottom-8 right-3 z-[1000] flex items-center gap-1.5 px-3 py-2.5 rounded-full text-[10px] font-serif transition-all duration-200 active:scale-90"
        style={{
          background: open ? "hsla(0, 60%, 25%, 0.95)" : "hsla(30, 30%, 12%, 0.92)",
          border: open ? "1px solid hsla(0, 50%, 45%, 0.5)" : "1px solid hsla(42, 40%, 30%, 0.5)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
          color: open ? "hsl(0, 70%, 70%)" : "hsl(42, 60%, 60%)",
        }}
        title="Legacy Layers (Temporary)"
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="tracking-wide">Legacy</span>
      </button>

      {/* Legacy Panel — slides from right */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 z-[1001] bg-background/10"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 z-[1002] w-[300px] max-w-[85vw] border-l bg-card/95 backdrop-blur-xl shadow-2xl"
              style={{ borderColor: "hsla(0, 40%, 35%, 0.3)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: "hsla(0, 40%, 35%, 0.2)" }}>
                <div className="flex flex-col">
                  <h3 className="text-sm font-serif tracking-wider flex items-center gap-2" style={{ color: "hsl(0, 55%, 60%)" }}>
                    <Layers className="w-3.5 h-3.5" />
                    Legacy Layers
                  </h3>
                  <span className="text-[9px] font-serif uppercase tracking-widest" style={{ color: "hsl(0, 40%, 45%)" }}>
                    Temporary — For Audit Only
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setCompareMode(!compareMode); if (!compareMode) runAudit(); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-serif transition-all"
                    style={{
                      background: compareMode ? "hsla(280, 50%, 35%, 0.3)" : "hsla(0, 0%, 100%, 0.05)",
                      color: compareMode ? "hsl(280, 60%, 70%)" : "hsl(0, 0%, 55%)",
                      border: compareMode ? "1px solid hsla(280, 50%, 50%, 0.3)" : "1px solid hsla(0, 0%, 100%, 0.1)",
                    }}
                  >
                    <Bug className="w-3 h-3" />
                    {compareMode ? "Audit Active" : "Compare"}
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                    style={{ color: "hsl(0, 40%, 55%)" }}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ScrollArea className="h-[calc(100%-60px)]">
                <div className="p-3 space-y-1">
                  {/* Flat list of ALL expected layers with status indicators */}
                  {EXPECTED_LAYERS.map((expected, i) => {
                    const unified = unifiedLayers.get(expected.key);
                    const stateActive = layerStates[expected.key] ?? false;
                    const unifiedActive = unified?.active ?? false;
                    const isPresent = !!unified;
                    const hasDiscrepancy = compareMode && isPresent && stateActive !== unifiedActive;

                    // Group header
                    const showGroupHeader = i === 0 || EXPECTED_LAYERS[i - 1].group !== expected.group;

                    return (
                      <div key={expected.key}>
                        {showGroupHeader && (
                          <div className="flex items-center gap-2 pt-3 pb-1">
                            <span className="text-[9px] font-serif uppercase tracking-[0.15em]" style={{ color: "hsl(0, 40%, 50%)" }}>
                              {expected.group}
                            </span>
                            <div className="flex-1 h-px" style={{ background: "hsla(0, 30%, 40%, 0.15)" }} />
                          </div>
                        )}
                        <button
                          onClick={() => unified?.toggle()}
                          disabled={!isPresent}
                          className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg transition-all text-left"
                          style={{
                            background: hasDiscrepancy
                              ? "hsla(45, 80%, 50%, 0.08)"
                              : unifiedActive
                              ? "hsla(42, 40%, 25%, 0.15)"
                              : "transparent",
                            opacity: isPresent ? 1 : 0.4,
                          }}
                        >
                          {/* Status dot */}
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background: !isPresent
                                ? "hsl(0, 60%, 50%)"
                                : unifiedActive
                                ? "hsl(120, 55%, 50%)"
                                : "hsla(0, 0%, 40%, 0.4)",
                              boxShadow: unifiedActive ? "0 0 6px hsla(120, 55%, 50%, 0.4)" : "none",
                            }}
                          />
                          <span className="text-[11px] font-serif flex-1" style={{
                            color: !isPresent ? "hsl(0, 50%, 55%)" : unifiedActive ? "hsl(42, 60%, 70%)" : "hsl(0, 0%, 55%)",
                          }}>
                            {expected.label}
                          </span>
                          {/* Parity indicator */}
                          {compareMode && (
                            <span className="text-[8px] font-mono shrink-0" style={{
                              color: !isPresent ? "hsl(0, 60%, 55%)" : hasDiscrepancy ? "hsl(45, 80%, 55%)" : "hsl(120, 40%, 45%)",
                            }}>
                              {!isPresent ? "MISSING" : hasDiscrepancy ? "DIFF" : "OK"}
                            </span>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {/* Audit log output */}
                  {compareMode && auditLog.length > 0 && (
                    <div className="mt-4 p-2 rounded-lg" style={{ background: "hsla(280, 30%, 15%, 0.4)", border: "1px solid hsla(280, 40%, 35%, 0.2)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Bug className="w-3 h-3" style={{ color: "hsl(280, 55%, 65%)" }} />
                        <span className="text-[10px] font-serif" style={{ color: "hsl(280, 55%, 65%)" }}>Layer Parity Audit</span>
                      </div>
                      <pre className="text-[8px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(280, 30%, 65%)" }}>
                        {auditLog.join("\n")}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LegacyLayersPanel;
