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
 * Typographic, minimal, never overpowers Staff sigil or Skystamp.
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
    <div className="mt-3 mb-1 pl-3 border-l-2 border-primary/25 py-1.5">
      <p className="font-serif text-sm italic text-foreground/75 whitespace-pre-wrap leading-relaxed">
        "{displayText}"
      </p>
      {needsCollapse && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] text-primary/60 hover:text-primary font-serif mt-1 inline-flex items-center gap-0.5 transition-colors"
        >
          Expand <ChevronDown className="h-2.5 w-2.5" />
        </button>
      )}
      {author && (
        <p className="text-xs text-muted-foreground/70 font-serif mt-1.5 tracking-wide">
          — {author}
        </p>
      )}
      {source && (
        <p className="text-[10px] text-muted-foreground/50 font-serif italic mt-0.5">
          From <em>{source}</em>
        </p>
      )}
    </div>
  );
};

export default OfferingQuoteBlock;
