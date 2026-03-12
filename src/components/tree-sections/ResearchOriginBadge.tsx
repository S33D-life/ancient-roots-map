/**
 * ResearchOriginBadge — Visual badge and provenance card for research-derived trees.
 */
import { ExternalLink, FileText, MapPin, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ResearchOrigin } from "@/utils/researchTreeToTreeRow";

interface Props {
  origin: ResearchOrigin;
}

const DESIGNATION_LABELS: Record<string, string> = {
  "Ancient Tree": "🌳 Ancient Tree",
  "Champion Tree": "🏆 Champion Tree",
  "Heritage Tree": "🏛️ Heritage Tree",
  "Sacred Tree": "✨ Sacred Tree",
  "Notable Tree": "📜 Notable Tree",
};

const ResearchOriginBadge = ({ origin }: Props) => {
  const designLabel = DESIGNATION_LABELS[origin.designationType] || `📜 ${origin.designationType}`;
  const precisionLabel =
    origin.geoPrecision === "exact" ? "Exact location" :
    origin.geoPrecision === "approx" ? "Approximate location" :
    "Location unverified";

  const measurements = [
    origin.heightM ? `${origin.heightM}m tall` : null,
    origin.girthOrStem ? `Girth: ${origin.girthOrStem}` : null,
    origin.crownSpread ? `Crown: ${origin.crownSpread}` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Origin badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="font-serif text-xs tracking-wider border-amber-500/30 bg-amber-500/10 text-amber-400"
        >
          🌱 Research Grove
        </Badge>
        <Badge
          variant="outline"
          className="font-serif text-xs tracking-wider border-primary/25 bg-primary/10 text-primary"
        >
          {designLabel}
        </Badge>
        {origin.verifiedBy && (
          <Badge
            variant="outline"
            className="font-serif text-xs tracking-wider border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
          >
            ✓ Verified
          </Badge>
        )}
      </div>

      {/* Source provenance card */}
      <div
        className="rounded-xl border p-4 space-y-3"
        style={{
          borderColor: "hsl(var(--border) / 0.4)",
          background: "hsl(var(--card) / 0.5)",
        }}
      >
        <h3 className="text-xs font-serif uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Root Source
        </h3>

        <div className="space-y-2">
          <p className="text-sm font-serif text-foreground/80">
            {origin.sourceDocTitle} ({origin.sourceDocYear})
          </p>
          <p className="text-xs text-muted-foreground">
            Program: {origin.sourceProgram}
          </p>
          {origin.sourceDocUrl && (
            <a
              href={origin.sourceDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              View original source
            </a>
          )}
        </div>

        {/* Location precision */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span>{precisionLabel}</span>
          {origin.localityText && (
            <span className="text-foreground/50">· {origin.localityText}</span>
          )}
        </div>

        {/* Measurements */}
        {measurements.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Ruler className="h-3 w-3" />
            <span>{measurements.join(" · ")}</span>
          </div>
        )}
      </div>

      {/* Lineage note */}
      <p className="text-xs font-serif italic text-muted-foreground/70 leading-relaxed border-l-2 border-primary/20 pl-3">
        This Ancient Friend emerged from the Research Grove — a curated record from {origin.sourceProgram}.
        Visit in person to help verify and deepen its story.
      </p>
    </div>
  );
};

export default ResearchOriginBadge;
