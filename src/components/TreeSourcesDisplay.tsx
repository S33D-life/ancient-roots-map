import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, ChevronDown, Shield, Clock } from "lucide-react";
import type { TreeSource } from "@/hooks/use-tree-sources";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  academic_paper: "Academic Paper",
  government_database: "Government Database",
  book: "Book",
  historical_archive: "Historical Archive",
  news_article: "News Article",
  personal_field_research: "Field Research",
  indigenous_oral_record: "Oral Record",
  other: "Other",
};

interface Props {
  verified: TreeSource[];
  pending: TreeSource[];
  loading: boolean;
  onContribute: () => void;
  showContributeButton?: boolean;
}

export default function TreeSourcesDisplay({ verified, pending, loading, onContribute, showContributeButton = true }: Props) {
  const [showPending, setShowPending] = useState(false);
  const total = verified.length + pending.length;

  if (loading) return null;
  if (total === 0 && !showContributeButton) return null;

  return (
    <div className="mt-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }}
        />
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary/70" />
          <h3 className="text-lg font-serif text-primary tracking-widest uppercase">Sources</h3>
          {total > 0 && (
            <Badge variant="outline" className="text-[10px] font-mono px-1.5">
              {verified.length} verified
            </Badge>
          )}
        </div>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }}
        />
      </div>

      {/* Verified sources */}
      {verified.length > 0 && (
        <div className="space-y-2 mb-4">
          {verified.map((s) => (
            <SourceCard key={s.id} source={s} />
          ))}
        </div>
      )}

      {/* Pending toggle */}
      {pending.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowPending(!showPending)}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground font-serif transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${showPending ? "rotate-180" : ""}`} />
            {pending.length} pending source{pending.length !== 1 ? "s" : ""}
          </button>
          {showPending && (
            <div className="space-y-2 mt-2">
              {pending.map((s) => (
                <SourceCard key={s.id} source={s} isPending />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contribute button */}
      {showContributeButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={onContribute}
          className="font-serif text-xs tracking-wider gap-1.5 border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
        >
          <BookOpen className="h-3.5 w-3.5" />
          Contribute a Source
        </Button>
      )}

      {total === 0 && !showContributeButton && (
        <p className="text-xs text-muted-foreground font-serif text-center py-4">
          No sources yet.
        </p>
      )}
    </div>
  );
}

function SourceCard({ source, isPending }: { source: TreeSource; isPending?: boolean }) {
  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
        isPending
          ? "border-border/30 bg-secondary/10 opacity-70"
          : "border-border/40 bg-card/40"
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isPending ? (
          <Clock className="h-4 w-4 text-muted-foreground/50" />
        ) : (
          <Shield className="h-4 w-4 text-primary/60" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-serif text-sm text-foreground truncate">
            {source.source_title}
          </span>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 font-serif text-muted-foreground"
          >
            {SOURCE_TYPE_LABELS[source.source_type] || source.source_type}
          </Badge>
        </div>
        {source.description && (
          <p className="text-xs text-muted-foreground font-serif mt-1 line-clamp-2 leading-relaxed">
            {source.description}
          </p>
        )}
        {source.contributor_name && (
          <p className="text-[10px] text-muted-foreground/60 font-serif mt-1">
            Contributed by {source.contributor_name}
          </p>
        )}
      </div>
      {source.url && (
        <a
          href={source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-primary/60 hover:text-primary transition-colors"
          title="Open source"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  );
}
