/**
 * TreePresenceLayer — renders presence signals on the map.
 * Soft, breathing halos around trees with recent or current visitors.
 * Includes graceful fade-in and fade-out transitions.
 */
import { useEffect, useRef } from "react";
import type { TreePresenceSignal } from "@/hooks/use-tree-presence-layer";

interface Props {
  map: any;
  signals: TreePresenceSignal[];
  visible: boolean;
}

const STYLE_ID = "presence-layer-styles";

/** Inject keyframes + base styles once */
function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes presence-breathe {
      0%, 100% { transform: scale(1); opacity: 0.85; }
      50% { transform: scale(1.15); opacity: 0.5; }
    }
    @keyframes presence-fade-in {
      from { opacity: 0; transform: scale(0.6); }
      to   { opacity: 1; transform: scale(1); }
    }
    .presence-halo {
      border-radius: 50%;
      pointer-events: none;
      animation: presence-fade-in 0.6s ease-out both;
      will-change: transform, opacity;
      transition: opacity 0.5s ease-out;
    }
    .presence-halo--here-now {
      animation: presence-fade-in 0.6s ease-out both,
                 presence-breathe 4.5s ease-in-out 0.6s infinite;
    }
    .presence-halo--fading {
      opacity: 0 !important;
      animation: none !important;
      transition: opacity 0.5s ease-out;
    }
  `;
  document.head.appendChild(style);
}

function createPresenceEl(signal: TreePresenceSignal): HTMLElement {
  const isHere = signal.presence_state === "here_now";
  const size = isHere ? 54 : 40;
  // "here now": warm emerald | "recently met": cool mist
  const hue = isHere ? "145, 55%, 48%" : "210, 30%, 60%";
  const fillOpacity = isHere ? 0.3 : 0.1;
  const borderOpacity = isHere ? 0.35 : 0.14;

  const el = document.createElement("div");
  el.className = `presence-halo ${isHere ? "presence-halo--here-now" : ""}`;
  el.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    background: radial-gradient(circle, hsla(${hue}, ${fillOpacity}) 0%, transparent 75%);
    border: 1px solid hsla(${hue}, ${borderOpacity});
    box-shadow: 0 0 ${isHere ? 16 : 5}px hsla(${hue}, ${fillOpacity * 0.5});
  `;

  const count = signal.presence_count;
  el.title = isHere
    ? count > 1 ? `${count} wanderers here now` : "Someone is here now"
    : count > 1 ? `${count} wanderers here recently` : "Recently met";

  return el;
}

export default function TreePresenceLayer({ map, signals, visible }: Props) {
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !visible) {
      // Fade out then remove
      markersRef.current.forEach(m => {
        const el = m.getElement?.();
        if (el) {
          const halo = el.querySelector(".presence-halo");
          if (halo) halo.classList.add("presence-halo--fading");
        }
      });
      const toRemove = [...markersRef.current];
      setTimeout(() => toRemove.forEach(m => m.remove()), 550);
      markersRef.current = [];
      return;
    }

    ensureStyles();

    import("leaflet").then((L) => {
      // Diff: fade out + remove markers for signals that no longer exist
      const newIds = new Set(signals.map(s => s.tree_id));
      const kept: any[] = [];
      const removing: any[] = [];

      for (const m of markersRef.current) {
        if (!newIds.has(m._presenceTreeId)) {
          removing.push(m);
        } else {
          kept.push(m);
        }
      }

      // Graceful fade-out for removed markers
      removing.forEach(m => {
        const el = m.getElement?.();
        if (el) {
          const halo = el.querySelector(".presence-halo");
          if (halo) halo.classList.add("presence-halo--fading");
        }
      });
      setTimeout(() => removing.forEach(m => m.remove()), 550);

      markersRef.current = kept;
      const existingIds = new Set(kept.map(m => m._presenceTreeId));

      signals.forEach((signal) => {
        if (existingIds.has(signal.tree_id)) return;

        const el = createPresenceEl(signal);
        const size = signal.presence_state === "here_now" ? 54 : 40;
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

        (marker as any)._presenceTreeId = signal.tree_id;
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
