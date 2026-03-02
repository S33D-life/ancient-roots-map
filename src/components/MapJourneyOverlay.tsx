/**
 * MapJourneyOverlay — Subtle dim overlay shown during ceremonial zoom journeys.
 * Fades in at ~5% opacity during descent and fades out when animation completes.
 * Pure CSS, no animation loops, pointer-events: none.
 */
import { useEffect, useState } from "react";

interface MapJourneyOverlayProps {
  active: boolean;
}

export default function MapJourneyOverlay({ active }: MapJourneyOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
    } else {
      // Delay removal for fade-out
      const t = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(t);
    }
  }, [active]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[15] pointer-events-none transition-opacity duration-500"
      style={{
        backgroundColor: "hsla(30, 20%, 8%, 0.06)",
        opacity: active ? 1 : 0,
      }}
    />
  );
}
