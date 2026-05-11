/**
 * HangingMemoryTree — responsive grid of offerings hanging in branches.
 * Prototype: a soft grid; future: SVG branch positioning by memory_position_data.
 */
import { OFFERING_TYPES, type LifeGroveOffering } from "@/lib/life-groves/types";
import LifeGroveOfferingGlyph from "./LifeGroveOfferingGlyph";

interface Props {
  offerings: LifeGroveOffering[];
}

export default function HangingMemoryTree({ offerings }: Props) {
  if (offerings.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/40 bg-card/30">
        <p className="font-serif text-sm text-muted-foreground italic">
          The branches are waiting. Hang the first offering to begin the library.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {offerings.map((o) => {
        const meta = OFFERING_TYPES.find((t) => t.value === o.offering_type);
        return (
          <article
            key={o.id}
            className="group p-3 rounded-xl border border-border/40 bg-gradient-to-br from-card/60 to-card/30 hover:border-primary/30 transition-all"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base" aria-hidden>{meta?.glyph ?? "🍃"}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-serif text-muted-foreground/70">
                {meta?.label ?? o.offering_type}
              </span>
            </div>
            {o.title && (
              <h4 className="font-serif text-sm text-foreground leading-snug">{o.title}</h4>
            )}
            {o.body_text && (
              <p className="text-xs font-serif text-muted-foreground/90 mt-1 line-clamp-4">
                {o.body_text}
              </p>
            )}
            {o.media_url && (
              <a
                href={o.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-primary hover:underline mt-1 inline-block break-all"
              >
                Open media
              </a>
            )}
            <p className="text-[10px] font-serif text-muted-foreground/60 mt-2">
              — {o.contributor_name}
            </p>
          </article>
        );
      })}
    </div>
  );
}
