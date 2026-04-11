/**
 * TreePresenceLayer — renders presence signals on the map.
 * Subtle glowing rings around trees with recent visitors.
 */
import { useEffect, useRef } from "react";
import type { TreePresenceSignal } from "@/hooks/use-tree-presence-layer";

interface Props {
  map: any; // Leaflet map instance
  signals: TreePresenceSignal[];
  visible: boolean;
}

/** Create a CSS-only pulsing circle marker */
function createPresenceMarker(signal: TreePresenceSignal): HTMLElement {
  const el = document.createElement("div");
  const isHereNow = signal.presence_state === "here_now";
  const size = isHereNow ? 48 : 36;
  const color = isHereNow ? "140, 50%, 50%" : "200, 40%, 55%";
  const opacity = isHereNow ? 0.35 : 0.2;

  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: radial-gradient(circle, hsla(${color}, ${opacity}), transparent 70%);
    border: 1.5px solid hsla(${color}, ${opacity * 0.8});
    pointer-events: none;
    ${isHereNow ? "animation: presence-pulse 3s ease-in-out infinite;" : ""}
  `;

  // Tooltip
  el.title = isHereNow
    ? `${signal.presence_count} wanderer${signal.presence_count > 1 ? "s" : ""} here now`
    : `Recently met · ${signal.presence_count} visit${signal.presence_count > 1 ? "s" : ""}`;

  return el;
}

export default function TreePresenceLayer({ map, signals, visible }: Props) {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      // Clean up
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      return;
    }

    // Inject pulse animation if not already present
    if (!document.getElementById("presence-pulse-style")) {
      const style = document.createElement("style");
      style.id = "presence-pulse-style";
      style.textContent = `
        @keyframes presence-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
      `;
      document.head.appendChild(style);
    }

    // Import Leaflet dynamically to avoid SSR issues
    import("leaflet").then((L) => {
      // Clear previous
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      signals.forEach((signal) => {
        const el = createPresenceMarker(signal);
        const size = signal.presence_state === "here_now" ? 48 : 36;
        const icon = L.divIcon({
          html: el.outerHTML,
          className: "",
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
        const marker = L.marker([signal.latitude, signal.longitude], {
          icon,
          interactive: false,
          zIndexOffset: -100,
        }).addTo(map);

        markersRef.current.push(marker);
      });
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
    };
  }, [map, signals, visible]);

  return null;
}
