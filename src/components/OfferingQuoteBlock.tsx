import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface OfferingQuoteBlockProps {
  text: string;
  author?: string | null;
  source?: string | null;
  /** Collapse after this many chars in feed (0 = never collapse) */
  collapseAfter?: number;
}

/**
 * Elegant quote block for offering cards.
 * Typographic, minimal — feels like a line placed at the roots of a tree.
 */
const OfferingQuoteBlock = ({
  text,
  author,
  source,
  collapseAfter = 280,
}: OfferingQuoteBlockProps) => {
  const needsCollapse = collapseAfter > 0 && text.length > collapseAfter;
  const [expanded, setExpanded] = useState(!needsCollapse);

  const displayText = expanded ? text : text.slice(0, collapseAfter) + "…";

  return (
    <div className="mt-3 mb-1 pl-4 border-l-2 py-2" style={{ borderColor: "hsl(var(--primary) / 0.25)" }}>
      <p className="font-serif text-base italic leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.78)" }}>
        "{displayText}"
      </p>
      {needsCollapse && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] font-serif mt-1.5 inline-flex items-center gap-0.5 transition-colors"
          style={{ color: "hsl(var(--primary) / 0.6)" }}
        >
          Expand <ChevronDown className="h-2.5 w-2.5" />
        </button>
      )}
      {author && (
        <p className="text-sm font-serif mt-2 tracking-wide" style={{ color: "hsl(var(--muted-foreground) / 0.65)" }}>
          — {author}
        </p>
      )}
      {source && (
        <p className="text-[10px] font-serif italic mt-0.5" style={{ color: "hsl(var(--muted-foreground) / 0.45)" }}>
          From <em>{source}</em>
        </p>
      )}
    </div>
  );
};

export default OfferingQuoteBlock;
