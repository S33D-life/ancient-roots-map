/**
 * AccessibilityFrame — coloured border that wraps a tree card / hero
 * to communicate how reachable the tree is.
 *
 * Sits OUTSIDE the visit-state dot (red/orange/green) so the two
 * systems stay visually distinct: dot inside, frame around.
 */
import { cn } from "@/lib/utils";
import {
  ACCESSIBILITY_VISUALS,
  type EffectiveAccessibilityTier,
} from "@/lib/treeAccessibility";

interface AccessibilityFrameProps {
  tier: EffectiveAccessibilityTier;
  /** "card" = ~2-3px (preview cards). "hero" = ~3-4px (detail page). */
  size?: "card" | "hero";
  /** Match the wrapped element's corner radius. */
  rounded?: string;
  className?: string;
  children: React.ReactNode;
}

export default function AccessibilityFrame({
  tier,
  size = "card",
  rounded = "rounded-xl",
  className,
  children,
}: AccessibilityFrameProps) {
  const v = ACCESSIBILITY_VISUALS[tier];
  const borderWidth = size === "hero" ? 3 : 2;
  const isGold = tier === "granted";

  return (
    <div
      className={cn("relative", rounded, className)}
      style={{
        // The coloured frame as a wrapping border + a soft outer glow.
        boxShadow: isGold
          ? `0 0 0 ${borderWidth}px ${v.border}, 0 0 14px ${v.glow}, inset 0 0 12px ${v.glow}`
          : `0 0 0 ${borderWidth}px ${v.border}, 0 0 8px ${v.glow}`,
      }}
      aria-label={`Accessibility: ${v.label}`}
      data-accessibility-tier={tier}
    >
      {children}
    </div>
  );
}
