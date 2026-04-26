/**
 * AccessibilityStrip — small info strip that sits below a tree's name
 * on the detail page, explaining how reachable the tree is.
 */
import { cn } from "@/lib/utils";
import {
  ACCESSIBILITY_VISUALS,
  type EffectiveAccessibilityTier,
} from "@/lib/treeAccessibility";

interface AccessibilityStripProps {
  tier: EffectiveAccessibilityTier;
  notes?: string | null;
  className?: string;
}

export default function AccessibilityStrip({
  tier,
  notes,
  className,
}: AccessibilityStripProps) {
  const v = ACCESSIBILITY_VISUALS[tier];

  // Garden tier shows notes inline if present; everyone else shows them below.
  const inlineNotes = tier === "garden" && notes ? ` — ${notes}` : "";
  const trailingNotes = tier !== "garden" && notes ? notes : null;

  return (
    <div
      className={cn(
        "rounded-md px-2.5 py-1.5 flex flex-col gap-0.5 font-serif text-[11px] leading-snug",
        className,
      )}
      style={{
        background: v.glow,
        border: `1px solid ${v.border}`,
        color: v.text,
      }}
    >
      <span className="flex items-center gap-1.5">
        <span className="text-[10px]">{v.emoji}</span>
        <span>
          {v.strip}
          {inlineNotes}
        </span>
      </span>
      {trailingNotes && (
        <span className="text-muted-foreground/80 text-[10px] pl-5">
          {trailingNotes}
        </span>
      )}
    </div>
  );
}
