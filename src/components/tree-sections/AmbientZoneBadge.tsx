/**
 * AmbientZoneBadge — a tiny, persistent whisper telling the visitor
 * which part of the tree they're inside, without reading any title.
 *
 * Mobile-first: TreeScrollIndicator is desktop-only, so this fills the
 * orienting role on small screens. Hidden on md+ (the desktop spine
 * indicator already does this job).
 *
 * Renders a single glyph + one serif word (Crown / Canopy / Trunk / Roots),
 * cross-fades when the active zone changes via the `tree-zone-*` body class
 * already set by use-tree-scroll. No fetches, no observers — pure CSS hook.
 */
import { useEffect, useState } from "react";

type Zone = "crown" | "canopy" | "trunk" | "roots";

const ZONE_FROM_BODY_CLASS: Record<string, Zone> = {
  "tree-zone-golden-dream": "crown",
  "tree-zone-council": "canopy",
  "tree-zone-heartwood": "trunk",
  "tree-zone-atlas-hero": "trunk",
  "tree-zone-ground": "roots",
  "tree-zone-atlas-content": "roots",
};

const ZONE_GLYPH: Record<Zone, string> = {
  crown: "☀",
  canopy: "🍃",
  trunk: "🪵",
  roots: "🌱",
};

const ZONE_LABEL: Record<Zone, string> = {
  crown: "Crown",
  canopy: "Canopy",
  trunk: "Trunk",
  roots: "Roots",
};

const ZONE_TINT: Record<Zone, string> = {
  crown:  "hsl(45 80% 60%)",
  canopy: "hsl(140 35% 50%)",
  trunk:  "hsl(28 45% 45%)",
  roots:  "hsl(22 40% 38%)",
};

const readZone = (): Zone => {
  if (typeof document === "undefined") return "roots";
  for (const cls of Array.from(document.body.classList)) {
    if (ZONE_FROM_BODY_CLASS[cls]) return ZONE_FROM_BODY_CLASS[cls];
  }
  return "roots";
};

const AmbientZoneBadge = () => {
  const [zone, setZone] = useState<Zone>("roots");

  useEffect(() => {
    setZone(readZone());
    const obs = new MutationObserver(() => setZone(readZone()));
    obs.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  const tint = ZONE_TINT[zone];

  return (
    <div
      aria-hidden="true"
      className="md:hidden fixed z-30 pointer-events-none select-none"
      style={{
        left: "max(env(safe-area-inset-left, 0px), 12px)",
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 76px)",
      }}
    >
      <div
        key={zone}
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md animate-fade-in"
        style={{
          background: "hsl(var(--background) / 0.55)",
          border: `1px solid ${tint}33`,
          boxShadow: `0 0 18px ${tint}22`,
          transition: "background 1.2s ease, border-color 1.2s ease, box-shadow 1.2s ease",
        }}
      >
        <span
          className="text-[13px] leading-none"
          style={{ filter: `drop-shadow(0 0 6px ${tint}66)` }}
        >
          {ZONE_GLYPH[zone]}
        </span>
        <span
          className="font-serif text-[10px] tracking-[0.25em] uppercase"
          style={{ color: tint, opacity: 0.85 }}
        >
          {ZONE_LABEL[zone]}
        </span>
      </div>
    </div>
  );
};

export default AmbientZoneBadge;
