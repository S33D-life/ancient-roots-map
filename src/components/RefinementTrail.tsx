/**
 * RefinementTrail — the unified, read-only "how this tree card evolved" view.
 *
 * Combines direct edits, accepted suggestions, open/closed proposals, location
 * refinements, and merges into one chronological, human-readable trail. Supersedes
 * the single-source TreeEditHistory (which read only tree_edit_history).
 *
 * READ-ONLY. No actions, no writes.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock, ChevronDown, ChevronUp, Pencil, CheckCircle2, MessageSquarePlus,
  MapPin, GitMerge, ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRefinementTrail } from "@/hooks/use-refinement-trail";
import {
  TRAIL_FIELD_LABELS, TRAIL_KIND_LABELS, type RefinementTrailEntry, type RefinementTrailKind,
} from "@/utils/refinementTrail";

interface Props {
  treeId: string;
}

const KIND_ICON: Record<RefinementTrailKind, React.ReactNode> = {
  direct_edit: <Pencil className="h-3 w-3" />,
  proposal_accepted: <CheckCircle2 className="h-3 w-3" />,
  proposal: <MessageSquarePlus className="h-3 w-3" />,
  location_refined: <MapPin className="h-3 w-3" />,
  merge: <GitMerge className="h-3 w-3" />,
};

const STATUS_TONE: Record<string, string> = {
  pending: "border-yellow-500/40 text-yellow-600",
  rejected: "border-destructive/40 text-destructive",
  needs_more_info: "border-blue-500/40 text-blue-500",
};

function truncate(v: string | null, n = 40): string {
  if (!v) return "—";
  return v.length > n ? v.slice(0, n) + "…" : v;
}

function TrailEntry({ entry, name }: { entry: RefinementTrailEntry; name: string }) {
  return (
    <div className="flex items-start gap-3 text-xs border-l-2 border-primary/20 pl-3 py-1">
      <div className="mt-0.5 text-primary/50">{KIND_ICON[entry.kind]}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[9px] px-1 py-0">
            {TRAIL_KIND_LABELS[entry.kind]}
          </Badge>
          {entry.status && entry.status !== "pending" && (
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${STATUS_TONE[entry.status] || ""}`}>
              {entry.status.replace(/_/g, " ")}
            </Badge>
          )}
          {entry.status === "pending" && (
            <Badge variant="outline" className={`text-[9px] px-1 py-0 ${STATUS_TONE.pending}`}>
              awaiting review
            </Badge>
          )}
        </div>

        {/* Field diffs */}
        <div className="mt-1 space-y-0.5">
          {entry.fields.map((f, i) => (
            <p key={i} className="text-foreground/80 flex items-center gap-1.5 flex-wrap">
              <span className="font-medium">{TRAIL_FIELD_LABELS[f.field] || f.field}</span>
              {f.from != null ? (
                <>
                  <span className="text-muted-foreground/50 line-through">{truncate(f.from)}</span>
                  <ArrowRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />
                  <span className="text-foreground/70">{truncate(f.to)}</span>
                </>
              ) : (
                <span className="text-foreground/70">{truncate(f.to)}</span>
              )}
            </p>
          ))}
        </div>

        {entry.reason && (
          <p className="text-muted-foreground/50 italic truncate mt-0.5">"{entry.reason}"</p>
        )}

        <div className="flex items-center gap-2 mt-0.5 text-muted-foreground/40">
          <span>{name}</span>
          <span>·</span>
          <span>{formatDistanceToNow(new Date(entry.at), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
}

export default function RefinementTrail({ treeId }: Props) {
  const { entries, names, loading } = useRefinementTrail(treeId);
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/40 animate-pulse" />
          <span className="text-xs font-serif text-muted-foreground">Loading the refinement trail…</span>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-serif text-center">
            No refinements yet — this tree's record is untouched.
          </p>
        </CardContent>
      </Card>
    );
  }

  const visible = expanded ? entries : entries.slice(0, 4);
  const nameFor = (id: string | null) => (id ? names[id] || "A wanderer" : "A wanderer");

  return (
    <Card className="bg-card/50 border-border/30">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm tracking-wide text-muted-foreground flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Refinement Trail
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {entries.length} event{entries.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-2">
          {visible.map((entry) => (
            <TrailEntry key={entry.id} entry={entry} name={nameFor(entry.actorId)} />
          ))}
        </div>

        {entries.length > 4 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>Show {entries.length - 4} more <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
