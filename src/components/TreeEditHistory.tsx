/**
 * TreeEditHistory — displays the unified read-only refinement trail for a tree.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ChevronDown, ChevronUp, MapPin, GitMerge, MessageSquarePlus, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRefinementTrail, type RefinementTrailEntry, type RefinementTrailState } from "@/hooks/use-refinement-trail";

interface Props {
  treeId: string;
}

const FIELD_LABELS: Record<string, string> = {
  name: "Tree Name",
  species: "Species",
  description: "Description",
  latitude: "Latitude",
  longitude: "Longitude",
  what3words: "What3Words",
  estimated_age: "Estimated Age",
  lore_text: "Lore",
  wish_tags: "Wish Tags",
  location: "Location",
  location_confidence: "Location Confidence",
  duplicate_review: "Duplicate Review",
  merge: "Merge",
};

const EDIT_TYPE_LABELS: Record<string, string> = {
  direct: "Direct edit",
  proposal_accepted: "Suggestion accepted",
  revert: "Reverted",
  merge: "Merged",
  proposal_merged: "Proposal merged",
  change_logged: "Change logged",
  edit_proposal: "Edit proposal",
  location_refinement: "Location refinement",
  checkin_location_refinement: "Check-in refinement",
  location_update_applied: "Location applied",
  duplicate_report: "Duplicate report",
  tree_merged: "Tree merge",
};

const STATE_LABELS: Record<RefinementTrailState, string> = {
  pending: "Pending",
  accepted: "Accepted",
  rejected: "Rejected",
  needs_more_info: "Needs info",
  unknown: "Unknown",
};

const STATE_CLASSES: Record<RefinementTrailState, string> = {
  pending: "border-yellow-500/30 text-yellow-600",
  accepted: "border-primary/30 text-primary",
  rejected: "border-destructive/30 text-destructive",
  needs_more_info: "border-accent/30 text-accent",
  unknown: "border-muted-foreground/30 text-muted-foreground",
};

function getEntryIcon(entry: RefinementTrailEntry) {
  if (entry.source === "tree_location_refinement" || entry.source === "tree_location_history") {
    return <MapPin className="h-3.5 w-3.5" />;
  }
  if (entry.source === "tree_duplicate_report" || entry.source === "tree_merge_history") {
    return <GitMerge className="h-3.5 w-3.5" />;
  }
  if (entry.source === "tree_edit_proposal" || entry.source === "tree_change_log") {
    return <MessageSquarePlus className="h-3.5 w-3.5" />;
  }
  return <History className="h-3.5 w-3.5" />;
}

function fieldLabel(field: string) {
  return FIELD_LABELS[field] || field.replace(/_/g, " ");
}

function trimValue(value: string) {
  return value.length > 48 ? `${value.slice(0, 48)}...` : value;
}

export default function TreeEditHistory({ treeId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const { entries, loading, error } = useRefinementTrail(treeId);

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground/40 animate-pulse" />
          <span className="text-xs font-serif text-muted-foreground">Loading history…</span>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="bg-card/50 border-border/30">
        <CardContent className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground font-serif text-center">
            No refinements recorded yet - this tree's record is untouched.
          </p>
          {error && (
            <p className="text-[10px] text-destructive/80 font-serif text-center">
              Some trail sources could not be loaded: {error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  const visible = expanded ? entries : entries.slice(0, 3);

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

        {error && (
          <p className="text-[10px] text-destructive/80 font-serif">
            Some trail sources could not be loaded: {error}
          </p>
        )}

        <div className="space-y-2">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 text-xs border-l-2 border-primary/20 pl-3 py-1"
            >
              <div className="mt-0.5 text-muted-foreground/60">
                {getEntryIcon(entry)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-foreground/80">
                    <span className="font-medium">{entry.summary}</span>
                  </p>
                  <Badge variant="outline" className={`text-[9px] px-1 py-0 shrink-0 ${STATE_CLASSES[entry.state]}`}>
                    {STATE_LABELS[entry.state]}
                  </Badge>
                </div>
                {entry.changedFields.length > 0 && (
                  <p className="text-muted-foreground/60 truncate">
                    {entry.changedFields.map(fieldLabel).join(", ")}
                  </p>
                )}
                {entry.fieldChanges.slice(0, 2).map((change) => (
                  <p key={`${entry.id}-${change.field}`} className="text-muted-foreground/60 truncate">
                    {fieldLabel(change.field)}
                    {change.oldValue || change.newValue ? ": " : ""}
                    {change.oldValue && <span>{trimValue(change.oldValue)}</span>}
                    {change.oldValue && change.newValue && <span> → </span>}
                    {change.newValue && <span>{trimValue(change.newValue)}</span>}
                  </p>
                ))}
                {entry.fieldChanges.length > 2 && (
                  <p className="text-muted-foreground/40">
                    +{entry.fieldChanges.length - 2} more field{entry.fieldChanges.length - 2 !== 1 ? "s" : ""}
                  </p>
                )}
                {entry.reason && (
                  <p className="text-muted-foreground/50 italic truncate">"{entry.reason}"</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {EDIT_TYPE_LABELS[entry.actionType] || entry.actionType.replace(/_/g, " ")}
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-muted-foreground/45">
                    <User className="h-2.5 w-2.5" />
                    {entry.actorLabel}
                  </span>
                  <span className="text-muted-foreground/40">
                    {formatDistanceToNow(new Date(entry.occurredAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {entries.length > 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Show less <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>Show {entries.length - 3} more <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
