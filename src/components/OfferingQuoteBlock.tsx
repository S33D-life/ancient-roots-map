import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface OfferingQuoteBlockProps {
  text: string;
  author?: string | null;
  source?: string | null;
  /** Max visible lines when collapsed (0 = never collapse) */
  maxLines?: number;
}

/**
 * Elegant quote block for offering cards.
 * Uses CSS line-clamp for stable visual truncation instead of
 * character-count slicing (which breaks on different widths/fonts).
 *
 * Future Pretext candidate: if we ever need to pre-compute the
 * collapsed height for virtualized lists, prepare() + layout()
 * would give us that without DOM measurement.
 */
const OfferingQuoteBlock = ({
  text,
  author,
  source,
  maxLines = 4,
}: OfferingQuoteBlockProps) => {
  const [expanded, setExpanded] = useState(false);
  // Heuristic: only offer collapse if text is likely longer than maxLines
  const likelyLong = maxLines > 0 && text.length > maxLines * 45;

  return (
    <div className="mt-3 mb-1 pl-4 border-l-2 border-primary/25 py-2">
      <p
        className={`font-serif text-base italic leading-relaxed text-foreground/[0.78] ${
          !expanded && likelyLong ? `line-clamp-${maxLines}` : ""
        }`}
        style={
          !expanded && likelyLong
            ? { display: "-webkit-box", WebkitLineClamp: maxLines, WebkitBoxOrient: "vertical", overflow: "hidden" }
            : undefined
        }
      >
        "{text}"
      </p>
      {likelyLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[10px] font-serif mt-1.5 inline-flex items-center gap-0.5 transition-colors text-primary/60 hover:text-primary"
        >
          {expanded ? (
            <>Collapse <ChevronUp className="h-2.5 w-2.5" /></>
          ) : (
            <>Expand <ChevronDown className="h-2.5 w-2.5" /></>
          )}
        </button>
      )}
      {author && (
        <p className="text-sm font-serif mt-2 tracking-wide text-muted-foreground/65">
          — {author}
        </p>
      )}
      {source && (
        <p className="text-[10px] font-serif italic mt-0.5 text-muted-foreground/45">
          From <em>{source}</em>
        </p>
      )}
    </div>
  );
};

export default OfferingQuoteBlock;
