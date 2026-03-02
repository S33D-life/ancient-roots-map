/**
 * LegacyLayersPanel — Faithful recreation of the original "Living Layers" sidebar.
 * 
 * TEMPORARY — exists as a reference interface for auditing feature parity
 * with the unified AtlasFilter panel before safe decommission.
 */
import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X, Bug, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { VisualLayerSection, VisualLayerToggle } from "./AtlasFilter";
import { useMapFilters } from "@/contexts/MapFilterContext";
import type { HiveInfo } from "@/utils/hiveUtils";

interface LegacyLayersPanelProps {
  visualSections: VisualLayerSection[];
  layerStates: Record<string, boolean>;
  filterStates: Record<string, string>;
  hiveMap?: { hive: HiveInfo; count: number; speciesList: string[] }[];
  onAddTree?: () => void;
  /** Callback to toggle hive colour markers on map */
  showHiveLayer: boolean;
  onHiveLayerToggle: () => void;
}

/* ── Hive colour dot mapping — matches the original sidebar's palette ── */
function getHiveColourDot(family: string): string {
  const MAP: Record<string, string> = {
    "Taxaceae": "hsl(120, 65%, 50%)",        // Yew — green
    "Fagaceae": "hsl(35, 85%, 55%)",          // Oak & Beech — orange
    "Oleaceae": "hsl(55, 70%, 50%)",          // Ash & Olive — yellow-green
    "Rosaceae": "hsl(340, 70%, 60%)",         // Cherry & Rose — pink
    "Cupressaceae": "hsl(150, 55%, 45%)",     // Cypress & Redwood — teal-green
    "Platanaceae": "hsl(25, 80%, 55%)",       // Plane — deep orange
    "Pinaceae": "hsl(140, 50%, 45%)",         // Pine & Conifer — forest green
    "Aquifoliaceae": "hsl(210, 60%, 60%)",    // Holly — blue
    "Malvaceae": "hsl(45, 75%, 55%)",         // Lime & Baobab — gold
    "Moraceae": "hsl(15, 75%, 55%)",          // Fig & Banyan — red-orange
    "Salicaceae": "hsl(130, 55%, 50%)",       // Willow & Poplar — green
    "Betulaceae": "hsl(40, 70%, 55%)",        // Birch & Hazel — amber
    "Araucariaceae": "hsl(200, 55%, 55%)",    // Monkey Puzzle — sky blue
    "Magnoliaceae": "hsl(300, 50%, 55%)",     // Magnolia — magenta
    "Ericaceae": "hsl(220, 55%, 60%)",        // Ericaceae — blue
    "Boraginaceae": "hsl(215, 50%, 55%)",     // Boraginaceae — blue
    "Fabaceae": "hsl(38, 75%, 55%)",          // Legume Tree — orange
    "Ulmaceae": "hsl(100, 50%, 48%)",         // Elm & Zelkova — lime green
    "Sapindaceae": "hsl(10, 70%, 55%)",       // Maple & Sycamore — red
    "Buxaceae": "hsl(205, 55%, 55%)",         // Buxaceae — blue
  };
  return MAP[family] || "hsl(42, 50%, 50%)";
}

/** Wanderer layer descriptions — from the original sidebar */
const WANDERER_DESCRIPTIONS: Record<string, string> = {
  "bloomed-seeds": "Collectible seeds glowing on the map",
  "recent-visits": "Soft glows near recently visited trees",
  "seed-traces": "Subtle pulses that fade over time",
  "shared-trees": "Indicates others who visited the same tree",
  "tribe-activity": "Opt-in visibility for invited wanderers",
};

const LegacyLayersPanel = ({
  visualSections,
  layerStates,
  filterStates,
  hiveMap = [],
  onAddTree,
  showHiveLayer,
  onHiveLayerToggle,
}: LegacyLayersPanelProps) => {
  const [open, setOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [hivesExpanded, setHivesExpanded] = useState(true);
  const { perspective, ageBand, girthBand, groveScale } = useMapFilters();

  // Flatten unified panel's layers for comparison
  const unifiedLayers = useMemo(() => {
    const map = new Map<string, VisualLayerToggle>();
    visualSections.forEach(s => s.layers.forEach(l => map.set(l.key, l)));
    return map;
  }, [visualSections]);

  // Find sections by key
  const getSection = (key: string) => visualSections.find(s => s.key === key);
  const signalsSection = getSection("signals");
  const structuresSection = getSection("structures");
  const pilgrimageSection = getSection("pilgrimage");
  const wandererSection = getSection("wanderer");
  const bloomingSection = getSection("blooming-clock");

  // Run parity audit
  const runAudit = useCallback(() => {
    const log: string[] = [];
    log.push("═══ LAYER PARITY AUDIT ═══");
    log.push(`Timestamp: ${new Date().toISOString()}`);
    log.push("");

    // Compare legacy expected features vs unified
    const expected = [
      { key: "colour-markers-by-family", label: "Colour markers by family toggle", inUnified: !!unifiedLayers.get("hive-layer") },
      { key: "hive-list-with-dots", label: "Hive list with colour dots", inUnified: hiveMap.length > 0 },
      { key: "hive-tree-counts", label: "Hive tree counts", inUnified: hiveMap.length > 0 },
      { key: "seeds", label: "Bloomed Seeds", inUnified: !!unifiedLayers.get("seeds") },
      { key: "offering-glow", label: "Offering Glow", inUnified: !!unifiedLayers.get("offering-glow") },
      { key: "birdsong", label: "Birdsong Heat", inUnified: !!unifiedLayers.get("birdsong") },
      { key: "heart-glow", label: "Heart Glow", inUnified: !!unifiedLayers.get("heart-glow") },
      { key: "groves", label: "Grove Boundaries", inUnified: !!unifiedLayers.get("groves") },
      { key: "root-threads", label: "Root Threads", inUnified: !!unifiedLayers.get("root-threads") },
      { key: "research", label: "Research Grove", inUnified: !!unifiedLayers.get("research") },
      { key: "immutable", label: "Immutable Ancient Friends", inUnified: !!unifiedLayers.get("immutable") },
      { key: "external", label: "External Trees", inUnified: !!unifiedLayers.get("external") },
      { key: "waters", label: "Waters & Commons", inUnified: !!unifiedLayers.get("waters") },
      { key: "churchyards", label: "Churchyards", inUnified: !!unifiedLayers.get("churchyards") },
      { key: "bloomed-seeds", label: "Bloomed Seeds (wanderer)", inUnified: !!unifiedLayers.get("bloomed-seeds") },
      { key: "recent-visits", label: "Recent Visits", inUnified: !!unifiedLayers.get("recent-visits") },
      { key: "seed-traces", label: "Seed & Offering Traces", inUnified: !!unifiedLayers.get("seed-traces") },
      { key: "shared-trees", label: "Shared Trees", inUnified: !!unifiedLayers.get("shared-trees") },
      { key: "tribe-activity", label: "Tribe Activity", inUnified: !!unifiedLayers.get("tribe-activity") },
      { key: "seasonal-foods", label: "Blooming Clock", inUnified: !!unifiedLayers.get("seasonal-foods") },
      { key: "wanderer-descriptions", label: "Wanderer layer descriptions", inUnified: false },
      { key: "add-ancient-friend-cta", label: "Add Ancient Friend CTA in panel", inUnified: false },
    ];

    let missing = 0;
    expected.forEach(e => {
      if (e.inUnified) {
        log.push(`✅ ${e.label}`);
      } else {
        log.push(`❌ MISSING: ${e.label}`);
        missing++;
      }
    });

    log.push("");
    log.push(`── Summary ──`);
    log.push(`Present: ${expected.length - missing}/${expected.length}`);
    log.push(`Missing from unified: ${missing}`);
    log.push("");
    log.push(`── Active Filter Context ──`);
    log.push(`Perspective: ${perspective} | Age: ${ageBand} | Girth: ${girthBand} | Scale: ${groveScale}`);
    Object.entries(filterStates).forEach(([k, v]) => log.push(`${k}: ${v}`));
    log.push("═══ END AUDIT ═══");

    setAuditLog(log);
    console.group("🔍 Layer Parity Audit");
    log.forEach(l => console.log(l));
    console.groupEnd();
  }, [unifiedLayers, hiveMap, filterStates, perspective, ageBand, girthBand, groveScale]);

  return (
    <>
      {/* Legacy floating button — right side */}
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

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[1001] bg-background/10"
              onClick={() => setOpen(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 z-[1002] w-[320px] max-w-[85vw] flex flex-col"
              style={{
                background: "hsla(30, 18%, 8%, 0.97)",
                borderLeft: "1px solid hsla(42, 40%, 30%, 0.3)",
                boxShadow: "-4px 0 24px rgba(0,0,0,0.4)",
              }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 pt-3 pb-2" style={{ borderBottom: "1px solid hsla(42, 40%, 30%, 0.25)" }}>
                <h3 className="text-[14px] font-serif tracking-[0.12em] uppercase flex items-center gap-2" style={{ color: "hsl(42, 70%, 55%)" }}>
                  <span className="text-base">🌿</span> Living Layers
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setCompareMode(!compareMode); if (!compareMode) runAudit(); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-serif transition-all"
                    style={{
                      background: compareMode ? "hsla(280, 50%, 35%, 0.3)" : "hsla(0, 0%, 100%, 0.05)",
                      color: compareMode ? "hsl(280, 60%, 70%)" : "hsl(0, 0%, 50%)",
                      border: compareMode ? "1px solid hsla(280, 50%, 50%, 0.3)" : "1px solid hsla(0, 0%, 100%, 0.1)",
                    }}
                  >
                    <Bug className="w-3 h-3" /> {compareMode ? "Audit" : "Compare"}
                  </button>
                  <button onClick={() => setOpen(false)} style={{ color: "hsl(42, 50%, 50%)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <ScrollArea className="flex-1">
                <div className="px-4 py-3 space-y-1">

                  {/* ══════ SPECIES HIVES ══════ */}
                  <LegacySectionHeader
                    icon="🐝"
                    title="Species Hives"
                    count={hiveMap.length}
                    colour="hsl(42, 70%, 55%)"
                    expanded={hivesExpanded}
                    onToggle={() => setHivesExpanded(v => !v)}
                  />

                  {hivesExpanded && (
                    <div className="pb-2">
                      {/* Colour markers by family toggle */}
                      <LegacyToggle
                        label="Colour markers by family"
                        active={showHiveLayer}
                        onToggle={onHiveLayerToggle}
                        colour="hsl(42, 50%, 50%)"
                      />

                      {/* Hive list with colour dots */}
                      <div className="space-y-0.5 mt-1">
                        {hiveMap.map(({ hive, count }) => {
                          const dotColour = getHiveColourDot(hive.family);
                          return (
                            <div key={hive.family} className="flex items-center gap-3 py-2 px-1">
                              <span
                                className="w-3.5 h-3.5 rounded-full shrink-0"
                                style={{
                                  background: dotColour,
                                  boxShadow: `0 0 6px ${dotColour}`,
                                }}
                              />
                              <span className="text-[13px] font-serif tracking-wide uppercase flex-1" style={{ color: "hsl(42, 60%, 65%)" }}>
                                {hive.icon} {hive.displayName}
                              </span>
                              <span className="text-[12px] font-sans tabular-nums" style={{ color: "hsl(42, 70%, 55%)" }}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ══════ LIVING SIGNALS ══════ */}
                  {signalsSection && (
                    <>
                      <LegacySectionHeader icon="✦" title="Living Signals" colour="hsl(42, 70%, 55%)" />
                      <div className="space-y-0.5">
                        {signalsSection.layers.filter(l => l.key !== "hive-layer").map(layer => (
                          <LegacyToggle key={layer.key} label={layer.label} active={layer.active} onToggle={layer.toggle} colour={`hsl(${layer.accent || "42, 70%, 55%"})`} extra={layer.extra} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ══════ STRUCTURES & CONTEXT ══════ */}
                  {structuresSection && (
                    <>
                      <LegacySectionHeader icon="🌿" title="Structures & Context" colour="hsl(120, 45%, 55%)" />
                      <div className="space-y-0.5">
                        {structuresSection.layers.map(layer => (
                          <LegacyToggle key={layer.key} label={layer.label} active={layer.active} onToggle={layer.toggle} colour={`hsl(${layer.accent || "42, 70%, 55%"})`} extra={layer.extra} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ══════ PILGRIMAGE LENSES ══════ */}
                  {pilgrimageSection && (
                    <>
                      <LegacySectionHeader icon="🌊" title="Pilgrimage Lenses" colour="hsl(200, 55%, 60%)" />
                      <p className="text-[11px] font-serif italic px-1 pb-1" style={{ color: "hsl(200, 40%, 50%)" }}>
                        Where trees, water, and people have long met.
                      </p>
                      <div className="space-y-0.5">
                        {pilgrimageSection.layers.map(layer => (
                          <LegacyToggle key={layer.key} label={layer.label} active={layer.active} onToggle={layer.toggle} colour={`hsl(${layer.accent || "200, 55%, 60%"})`} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ══════ WANDERER ACTIVITY ══════ */}
                  {wandererSection && (
                    <>
                      <LegacySectionHeader icon="◎" title="Wanderer Activity" colour="hsl(260, 50%, 65%)" />
                      <p className="text-[11px] font-serif italic px-1 pb-1" style={{ color: "hsl(260, 35%, 50%)" }}>
                        Sense the presence of others — gently, like traces in a forest.
                      </p>
                      <div className="space-y-0.5">
                        {wandererSection.layers.map(layer => (
                          <LegacyToggle
                            key={layer.key}
                            label={layer.label}
                            active={layer.active}
                            onToggle={layer.toggle}
                            colour={`hsl(${layer.accent || "260, 50%, 65%"})`}
                            description={WANDERER_DESCRIPTIONS[layer.key]}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ══════ BLOOMING CLOCK ══════ */}
                  {bloomingSection && (
                    <>
                      <LegacySectionHeader icon="🌸" title="Blooming Clock" colour="hsl(340, 55%, 65%)" />
                      <div className="space-y-0.5">
                        {bloomingSection.layers.map(layer => (
                          <LegacyToggle key={layer.key} label={layer.label} active={layer.active} onToggle={layer.toggle} colour={`hsl(${layer.accent || "340, 55%, 65%"})`} />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ══════ AUDIT LOG ══════ */}
                  {compareMode && auditLog.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg" style={{ background: "hsla(280, 30%, 12%, 0.6)", border: "1px solid hsla(280, 40%, 35%, 0.2)" }}>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Bug className="w-3 h-3" style={{ color: "hsl(280, 55%, 65%)" }} />
                        <span className="text-[10px] font-serif tracking-wider uppercase" style={{ color: "hsl(280, 55%, 65%)" }}>Layer Parity Audit</span>
                      </div>
                      <pre className="text-[8px] font-mono leading-relaxed whitespace-pre-wrap" style={{ color: "hsl(280, 30%, 65%)" }}>
                        {auditLog.join("\n")}
                      </pre>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* ── Add Ancient Friend CTA ── */}
              <div className="px-4 py-3" style={{ borderTop: "1px solid hsla(42, 40%, 30%, 0.2)" }}>
                <button
                  onClick={() => { onAddTree?.(); setOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-serif tracking-[0.1em] uppercase transition-all active:scale-95"
                  style={{
                    background: "hsla(42, 40%, 20%, 0.3)",
                    border: "1px solid hsla(42, 50%, 40%, 0.35)",
                    color: "hsl(42, 70%, 55%)",
                    boxShadow: "0 2px 10px hsla(42, 50%, 30%, 0.15)",
                  }}
                >
                  <Plus className="w-4 h-4" /> Add Ancient Friend
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

/* ── Sub-components matching old Living Layers visual language ── */

function LegacySectionHeader({ icon, title, count, colour, expanded, onToggle }: {
  icon: string; title: string; count?: number; colour: string;
  expanded?: boolean; onToggle?: () => void;
}) {
  const Wrapper = onToggle ? "button" : "div";
  return (
    <Wrapper
      onClick={onToggle}
      className="w-full flex items-center gap-2 pt-5 pb-2"
      style={{ borderBottom: `1px solid ${colour}33` }}
    >
      <span className="text-base">{icon}</span>
      <span className="text-[13px] font-serif tracking-[0.12em] uppercase font-semibold" style={{ color: colour }}>
        {title}
      </span>
      {count !== undefined && (
        <span className="text-[12px] font-sans tabular-nums" style={{ color: colour }}>{count}</span>
      )}
      {onToggle && (
        <span className="ml-auto text-[10px]" style={{ color: colour, transform: expanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
      )}
    </Wrapper>
  );
}

function LegacyToggle({ label, active, onToggle, colour, extra, description }: {
  label: string; active: boolean; onToggle: () => void; colour: string;
  extra?: string; description?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex flex-col gap-0.5 px-1 py-2.5 rounded-md text-left transition-colors"
    >
      <div className="flex items-center gap-3 w-full">
        {/* Circle toggle — matches original */}
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
          style={{
            borderColor: active ? colour : "hsla(0, 0%, 40%, 0.4)",
            background: active ? `${colour}22` : "transparent",
          }}
        >
          {active && (
            <span className="text-[10px] font-bold" style={{ color: colour }}>✓</span>
          )}
        </div>
        <span
          className="text-[13px] font-serif tracking-wide uppercase flex-1"
          style={{ color: active ? colour : "hsl(42, 35%, 48%)" }}
        >
          {label}
        </span>
        {extra && (
          <span className="text-[11px] font-sans tabular-nums shrink-0" style={{ color: "hsl(180, 50%, 55%)" }}>
            {extra}
          </span>
        )}
      </div>
      {description && (
        <span className="text-[11px] font-serif pl-8" style={{ color: "hsl(260, 30%, 50%)" }}>
          {description}
        </span>
      )}
    </button>
  );
}

export default LegacyLayersPanel;
