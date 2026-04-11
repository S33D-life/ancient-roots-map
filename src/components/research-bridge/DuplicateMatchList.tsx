/**
 * DuplicateMatchList — Shows likely duplicate matches for a source candidate.
 */
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, TreeDeciduous, Sprout, MapPin } from "lucide-react";
import { findDuplicates, type DuplicateMatch } from "@/services/research-bridge";
import type { Database } from "@/integrations/supabase/types";

type SourceCandidate = Database["public"]["Tables"]["source_tree_candidates"]["Row"];

interface Props {
  candidate: SourceCandidate;
  onMarkDuplicate?: (duplicateOfId: string) => void;
}

export function DuplicateMatchList({ candidate, onMarkDuplicate }: Props) {
  const [matches, setMatches] = useState<DuplicateMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const results = await findDuplicates(
        candidate.raw_latitude,
        candidate.raw_longitude,
        candidate.raw_species || "",
        candidate.raw_name,
      );
      if (!cancelled) {
        setMatches(results);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [candidate.id, candidate.raw_latitude, candidate.raw_longitude, candidate.raw_species, candidate.raw_name]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground font-serif">
        <Loader2 className="w-3 h-3 animate-spin" /> Checking for duplicates…
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground font-serif py-1">
        ✓ No likely duplicates found within 500m.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-serif text-amber-600">
        <AlertTriangle className="w-3 h-3" />
        <span>{matches.length} likely duplicate{matches.length > 1 ? "s" : ""} found</span>
      </div>
      {matches.map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between gap-2 p-2 rounded-md text-[10px] font-serif"
          style={{ background: "hsl(var(--muted) / 0.3)", border: "1px solid hsl(var(--border) / 0.15)" }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {m.source === "ancient_friend" ? (
              <TreeDeciduous className="w-3 h-3 text-primary shrink-0" />
            ) : (
              <Sprout className="w-3 h-3 text-amber-500 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-foreground truncate">{m.name || "Unnamed"}</p>
              <p className="text-muted-foreground">
                {m.species} · {(m.distance_km * 1000).toFixed(0)}m away
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={`text-[8px] ${
                m.source === "ancient_friend"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {m.source === "ancient_friend" ? "Ancient Friend" : "Research"}
            </Badge>
            <span className="font-bold text-foreground">{m.score}%</span>
            {onMarkDuplicate && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 px-1.5 text-[9px]"
                onClick={() => onMarkDuplicate(m.id)}
              >
                Mark dup
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Small warning badge for candidate rows */
export function DuplicateWarningBadge({ candidate }: { candidate: SourceCandidate }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!candidate.raw_latitude || !candidate.raw_longitude) return;
    findDuplicates(
      candidate.raw_latitude,
      candidate.raw_longitude,
      candidate.raw_species || "",
      candidate.raw_name,
    ).then((m) => setCount(m.length));
  }, [candidate.id]);

  if (!count) return null;

  return (
    <Badge variant="outline" className="text-[8px] bg-amber-500/10 text-amber-600 border-amber-500/20 gap-0.5">
      <AlertTriangle className="w-2.5 h-2.5" /> {count}
    </Badge>
  );
}
