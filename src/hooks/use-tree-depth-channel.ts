/**
 * useTreeDepthChannel — single global RAF-throttled scroll driver that
 * publishes continuous depth signals to CSS custom properties on <html>.
 *
 * Any component can react to scroll-depth organically by reading:
 *   var(--tree-depth)        0 (crown) → 1 (roots)
 *   var(--tree-crown)        bell-curve opacity 0..1, peaks at crown
 *   var(--tree-canopy)       peaks at canopy
 *   var(--tree-trunk)        peaks at trunk
 *   var(--tree-roots)        peaks at roots
 *
 * One driver = no duplicate scroll listeners across atmosphere layers.
 */
import { useEffect } from "react";

const HABITATS: { name: "crown" | "canopy" | "trunk" | "roots"; center: number; width: number }[] = [
  { name: "crown",  center: 0.06, width: 0.32 },
  { name: "canopy", center: 0.32, width: 0.32 },
  { name: "trunk",  center: 0.58, width: 0.34 },
  { name: "roots",  center: 0.92, width: 0.32 },
];

function bell(p: number, center: number, width: number) {
  const d = Math.abs(p - center) / width;
  return Math.max(0, 1 - d * d * (3 - 2 * Math.min(1, d))); // smoothstep falloff
}

export function useTreeDepthChannel() {
  useEffect(() => {
    const root = document.documentElement;
    let raf = 0;
    let last = -1;

    const tick = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (Math.abs(p - last) < 0.0015) return;
      last = p;
      root.style.setProperty("--tree-depth", p.toFixed(4));
      for (const h of HABITATS) {
        root.style.setProperty(`--tree-${h.name}`, bell(p, h.center, h.width).toFixed(4));
      }
    };

    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    tick();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
