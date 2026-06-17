/**
 * HabitatAtmosphere — fixed full-viewport overlay that cross-fades
 * four habitat tints driven by the global tree-depth channel.
 *
 * No JS per-frame work: opacities are CSS custom properties updated by
 * useTreeDepthChannel. The four gradients overlap continuously so the
 * visitor never experiences a hard zone change — only a gradual shift
 * from mycelial Roots → amber Trunk → green Canopy → gold Crown.
 *
 * Sits behind content (z-0), above the page background, pointer-events-none.
 */
import { memo } from "react";

const layerStyle = (
  background: string,
  opacityVar: string,
  blendMode: React.CSSProperties["mixBlendMode"] = "soft-light",
): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  background,
  opacity: `var(${opacityVar})` as unknown as number,
  mixBlendMode: blendMode,
  transition: "opacity 600ms ease-out",
  willChange: "opacity",
});

const HabitatAtmosphere = memo(() => {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0"
      style={{ contain: "strict" }}
    >
      {/* CROWN — gold sky-light raining from above */}
      <div
        style={layerStyle(
          "radial-gradient(ellipse 120% 70% at 50% -10%, hsl(45 85% 70% / 0.55), transparent 70%), linear-gradient(to bottom, hsl(48 80% 78% / 0.22), transparent 55%)",
          "--tree-crown",
          "screen",
        )}
      />
      {/* CANOPY — airy green diffused light */}
      <div
        style={layerStyle(
          "radial-gradient(ellipse 130% 80% at 50% 25%, hsl(135 50% 55% / 0.32), transparent 75%), linear-gradient(to bottom, transparent, hsl(140 45% 50% / 0.16) 40%, transparent 80%)",
          "--tree-canopy",
          "soft-light",
        )}
      />
      {/* TRUNK — warm amber heartwood glow */}
      <div
        style={layerStyle(
          "radial-gradient(ellipse 90% 100% at 50% 55%, hsl(28 70% 45% / 0.36), transparent 75%), linear-gradient(to bottom, transparent, hsl(32 60% 38% / 0.18) 45%, transparent 90%)",
          "--tree-trunk",
          "soft-light",
        )}
      />
      {/* ROOTS — mycelial, humid, dark earth with green pulse */}
      <div
        style={layerStyle(
          "radial-gradient(ellipse 130% 80% at 50% 95%, hsl(140 55% 38% / 0.38), transparent 70%), linear-gradient(to top, hsl(18 25% 6% / 0.45), transparent 55%)",
          "--tree-roots",
          "multiply",
        )}
      />
    </div>
  );
});
HabitatAtmosphere.displayName = "HabitatAtmosphere";

export default HabitatAtmosphere;
