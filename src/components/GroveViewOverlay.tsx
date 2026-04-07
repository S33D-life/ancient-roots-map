/**
 * GroveViewOverlay — "Living Earth Mode"
 *
 * Renders atmospheric seasonal overlays on the map.
 * Signal panel has been unified into MapControlPanel.
 */
import { useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useGroveEvents,
  getCurrentSeason,
  SEASON_PALETTE,
  type EventPulse,
} from "@/hooks/use-grove-events";

interface GroveViewOverlayProps {
  active: boolean;
  onToggle: () => void;
  userLat?: number;
  treeLookup?: Map<string, { lat: number; lng: number }>;
  onEventPulses?: (pulses: EventPulse[]) => void;
  onTreeClick?: (treeId: string) => void;
}

const GroveViewOverlay = ({ active, userLat, treeLookup, onEventPulses }: GroveViewOverlayProps) => {
  const { eventPulses } = useGroveEvents("moon", treeLookup);

  // Propagate event pulses to parent
  useEffect(() => {
    if (onEventPulses && active && eventPulses.length > 0) {
      onEventPulses(eventPulses);
    }
  }, [onEventPulses, active, eventPulses]);

  const season = useMemo(() => getCurrentSeason(userLat), [userLat]);
  const palette = SEASON_PALETTE[season];

  if (!active) return null;

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

      {/* Breathing shimmer */}
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

      {/* Mycelial network */}
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
    </>
  );
};

export default GroveViewOverlay;
