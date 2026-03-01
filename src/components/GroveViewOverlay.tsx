/**
 * GroveViewOverlay — "Living Earth Mode"
 *
 * A mythic ecological overlay that transforms the map into a breathing,
 * living forest view. Shows Grove Signals panel and mythic time selector.
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { useGroveEvents, MYTHIC_TIMEFRAMES, type MythicTimeframe } from "@/hooks/use-grove-events";

interface GroveViewOverlayProps {
  active: boolean;
  onToggle: () => void;
}

const GroveViewOverlay = ({ active, onToggle }: GroveViewOverlayProps) => {
  const [timeframe, setTimeframe] = useState<MythicTimeframe>("moon");
  const [signalsExpanded, setSignalsExpanded] = useState(true);
  const { signals, loading } = useGroveEvents(timeframe);

  return (
    <>
      {/* Living Earth atmosphere overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 50%, hsla(160, 30%, 8%, 0.35) 0%, hsla(120, 25%, 5%, 0.55) 60%, hsla(100, 20%, 3%, 0.7) 100%)",
              mixBlendMode: "multiply",
            }}
          />
        )}
      </AnimatePresence>

      {/* Breathing shimmer for active mode */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.02, 0.06, 0.02] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 z-[6] pointer-events-none"
            style={{
              background: "radial-gradient(circle at 30% 40%, hsla(42, 80%, 55%, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, hsla(120, 50%, 40%, 0.1) 0%, transparent 40%)",
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Grove Signals Panel (bottom-left) ── */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute bottom-24 left-3 z-[1000] max-w-[220px]"
          >
            {/* Collapse toggle */}
            <button
              onClick={() => setSignalsExpanded(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-t-xl text-[10px] font-serif tracking-wider transition-colors"
              style={{
                background: "hsla(120, 20%, 8%, 0.92)",
                color: "hsl(120, 40%, 65%)",
                border: "1px solid hsla(120, 30%, 30%, 0.3)",
                borderBottom: signalsExpanded ? "none" : undefined,
                borderRadius: signalsExpanded ? "12px 12px 0 0" : "12px",
                backdropFilter: "blur(12px)",
              }}
            >
              <span className="flex items-center gap-1.5">
                <motion.span
                  animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  🌿
                </motion.span>
                Grove Signals
              </span>
              <span style={{ transform: signalsExpanded ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.2s" }}>▾</span>
            </button>

            <AnimatePresence>
              {signalsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div
                    className="px-3 pb-3 pt-2 space-y-2.5 rounded-b-xl"
                    style={{
                      background: "hsla(120, 20%, 8%, 0.92)",
                      border: "1px solid hsla(120, 30%, 30%, 0.3)",
                      borderTop: "none",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    {/* Mythic Time Selector */}
                    <div className="flex gap-1">
                      {MYTHIC_TIMEFRAMES.map(tf => (
                        <button
                          key={tf.key}
                          onClick={() => setTimeframe(tf.key)}
                          className="flex-1 px-1 py-1.5 rounded-md text-center transition-all"
                          style={{
                            background: timeframe === tf.key ? "hsla(42, 60%, 40%, 0.2)" : "transparent",
                            color: timeframe === tf.key ? "hsl(42, 80%, 65%)" : "hsl(42, 30%, 40%)",
                            border: timeframe === tf.key ? "1px solid hsla(42, 60%, 40%, 0.3)" : "1px solid transparent",
                            fontSize: "9px",
                            fontFamily: "serif",
                          }}
                          title={tf.label}
                        >
                          <span className="block text-[13px] leading-none">{tf.icon}</span>
                          <span className="block mt-0.5">{tf.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Signal rows */}
                    <div className="space-y-1.5">
                      <SignalRow
                        icon="🌿"
                        label="Trees Stirring"
                        value={loading ? "…" : signals.treesStirring.toLocaleString()}
                        color="120, 45%, 55%"
                      />
                      <SignalRow
                        icon="❤️"
                        label="Hearts Gathered"
                        value={loading ? "…" : signals.heartsGathered.toLocaleString()}
                        color="0, 65%, 55%"
                      />
                      <SignalRow
                        icon="🌙"
                        label="Offerings"
                        value={loading ? "…" : signals.offeringsThisMoon.toLocaleString()}
                        color="42, 80%, 55%"
                      />
                      {signals.mostLovedWisdom && (
                        <div className="pt-1 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                          <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(42, 40%, 45%)" }}>
                            📜 Most Loved Wisdom
                          </p>
                          <p
                            className="text-[10px] font-serif italic leading-relaxed line-clamp-2"
                            style={{ color: "hsl(42, 60%, 65%)" }}
                          >
                            "{signals.mostLovedWisdom}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

function SignalRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-serif flex items-center gap-1.5" style={{ color: `hsl(${color})` }}>
        <span className="text-[12px]">{icon}</span>
        {label}
      </span>
      <motion.span
        key={value}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-[11px] font-serif tabular-nums"
        style={{ color: `hsl(${color})` }}
      >
        {value}
      </motion.span>
    </div>
  );
}

export default GroveViewOverlay;
