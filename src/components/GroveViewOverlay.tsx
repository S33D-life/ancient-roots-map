/**
 * GroveViewOverlay — "Living Earth Mode"
 *
 * A mythic ecological overlay that transforms the map into a breathing,
 * living forest view. Shows Grove Signals panel, mythic time selector,
 * live event stream, and seasonal atmosphere shifts.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGroveEvents,
  MYTHIC_TIMEFRAMES,
  getCurrentSeason,
  SEASON_PALETTE,
  type MythicTimeframe,
  type EventPulse,
} from "@/hooks/use-grove-events";

interface GroveViewOverlayProps {
  active: boolean;
  onToggle: () => void;
  userLat?: number;
  /** Tree lookup for coordinate pulses */
  treeLookup?: Map<string, { lat: number; lng: number }>;
  /** Callback to render event pulses on the map */
  onEventPulses?: (pulses: EventPulse[]) => void;
}

const GroveViewOverlay = ({ active, onToggle, userLat, treeLookup, onEventPulses }: GroveViewOverlayProps) => {
  const [timeframe, setTimeframe] = useState<MythicTimeframe>("moon");
  const [signalsExpanded, setSignalsExpanded] = useState(true);
  const { signals, loading, liveEventCount, eventPulses } = useGroveEvents(timeframe, treeLookup);

  // Pass pulses up to map for rendering
  if (onEventPulses && active) {
    onEventPulses(eventPulses);
  }

  // Seasonal atmosphere
  const season = useMemo(() => getCurrentSeason(userLat), [userLat]);
  const palette = SEASON_PALETTE[season];

  return (
    <>
      {/* Seasonal atmosphere overlay */}
      <AnimatePresence>
        {active && (
          <motion.div
            key={`atmosphere-${season}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, ${palette.primary} 0%, ${palette.secondary} 60%, ${palette.glow} 100%)`,
              mixBlendMode: "multiply",
            }}
          />
        )}
      </AnimatePresence>

      {/* Breathing shimmer — seasonal tinted */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.02, 0.06, 0.02] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 z-[6] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 30% 40%, hsla(42, 80%, 55%, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 60%, ${palette.glow} 0%, transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Mycelial network — subtle */}
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.01, 0.04, 0.01] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute inset-0 z-[5] pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 80%, ${palette.primary} 0%, transparent 30%), radial-gradient(circle at 20% 60%, ${palette.secondary} 0%, transparent 25%), radial-gradient(circle at 80% 40%, ${palette.glow} 0%, transparent 20%)`,
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
            className="absolute left-1/2 -translate-x-1/2 z-[1001] w-[min(260px,calc(100vw-2rem))]"
            style={{ bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px + 3.5rem)" }}
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
                {liveEventCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[8px] font-bold"
                    style={{
                      background: "hsla(120, 60%, 45%, 0.3)",
                      color: "hsl(120, 60%, 65%)",
                      border: "1px solid hsla(120, 50%, 50%, 0.4)",
                    }}
                  >
                    •
                  </motion.span>
                )}
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
                    {/* Season indicator */}
                    <div
                      className="text-[9px] font-serif text-center py-1 rounded-md"
                      style={{
                        background: palette.primary,
                        color: "hsl(42, 60%, 70%)",
                        border: `1px solid ${palette.glow}`,
                      }}
                    >
                      {palette.label}
                    </div>

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
                      <SignalRow icon="🌿" label="Trees Stirring" value={loading ? "…" : signals.treesStirring.toLocaleString()} color="120, 45%, 55%" />
                      <SignalRow icon="❤️" label="Hearts Gathered" value={loading ? "…" : signals.heartsGathered.toLocaleString()} color="0, 65%, 55%" />
                      <SignalRow icon="🌙" label="Offerings" value={loading ? "…" : signals.offeringsThisMoon.toLocaleString()} color="42, 80%, 55%" />
                      <SignalRow icon="👣" label="Wanderers Active" value={loading ? "…" : signals.activeWanderers.toLocaleString()} color="260, 45%, 60%" />
                      {signals.mostLovedWisdom && (
                        <div className="pt-1 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                          <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(42, 40%, 45%)" }}>
                            📜 Most Loved Wisdom
                          </p>
                          <p className="text-[10px] font-serif italic leading-relaxed line-clamp-2" style={{ color: "hsl(42, 60%, 65%)" }}>
                            "{signals.mostLovedWisdom}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Live event stream */}
                    {signals.recentEvents.length > 0 && (
                      <div className="pt-1 border-t" style={{ borderColor: "hsla(120, 30%, 30%, 0.2)" }}>
                        <p className="text-[8px] font-serif uppercase tracking-wider mb-1" style={{ color: "hsl(120, 35%, 45%)" }}>
                          ✦ Live Mycelial Whispers
                        </p>
                        <div className="space-y-1 max-h-[60px] overflow-hidden">
                          {signals.recentEvents.slice(0, 3).map(evt => (
                            <motion.div
                              key={evt.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-1.5 text-[9px] font-serif"
                              style={{ color: "hsl(120, 30%, 50%)" }}
                            >
                              <motion.span
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="text-[8px]"
                              >
                                ◌
                              </motion.span>
                              <span>
                                {evt.type === 'OFFERING_CREATED' ? 'New offering stirred' :
                                 evt.type === 'HEART_EARNED' ? 'Heart gathered' : 'Signal received'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
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
