/**
 * MapLoadingOverlay — warm, trust-building overlay shown while map tiles load.
 * Fades out smoothly once tiles are ready.
 */
import { useEffect, useState } from "react";

interface MapLoadingOverlayProps {
  /** true once tiles have loaded or map is interactive */
  ready: boolean;
}

export default function MapLoadingOverlay({ ready }: MapLoadingOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!ready) return;
    // Keep overlay briefly so the fade feels intentional
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      className="absolute inset-0 z-[500] flex flex-col items-center justify-center pointer-events-none"
      style={{
        background: "linear-gradient(180deg, hsl(35 25% 92%) 0%, hsl(30 15% 88%) 100%)",
        opacity: ready ? 0 : 1,
        transition: "opacity 0.8s ease-out",
      }}
      aria-live="polite"
    >
      {/* Subtle tree pulse */}
      <div className="relative mb-4">
        <svg
          width="48"
          height="48"
          viewBox="0 0 48 48"
          fill="none"
          className="animate-pulse"
          style={{ animationDuration: "2.4s" }}
        >
          <circle cx="24" cy="24" r="18" fill="hsl(42 30% 78% / 0.4)" />
          <path
            d="M24 8 C20 16, 14 18, 14 24 C14 30, 18 34, 24 38 C30 34, 34 30, 34 24 C34 18, 28 16, 24 8Z"
            fill="hsl(120 25% 35% / 0.7)"
          />
          <rect x="23" y="34" width="2" height="6" rx="1" fill="hsl(30 30% 35% / 0.6)" />
        </svg>
      </div>

      <p
        className="font-serif text-sm tracking-wide"
        style={{ color: "hsl(30 15% 35%)" }}
      >
        Locating Ancient Friends…
      </p>
    </div>
  );
}
