/**
 * TreeEditHistory — displays the change log for a tree record.
 * Shows who edited what and when, with field-level detail.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface HistoryEntry {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  edit_reason: string | null;
  edit_type: string;
  user_id: string;
  created_at: string;
}

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
};

const EDIT_TYPE_LABELS: Record<string, string> = {
  direct: "Direct edit",
  proposal_accepted: "Suggestion accepted",
  revert: "Reverted",
  merge: "Merged",
};

export default function TreeEditHistory({ treeId }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("tree_edit_history" as any)
        .select("*")
        .eq("tree_id", treeId)
        .order("created_at", { ascending: false })
        .limit(50);

      setEntries((data as any as HistoryEntry[]) ?? []);
      setLoading(false);
    };
    fetch();
  }, [treeId]);

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
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground font-serif text-center">
            No edits recorded yet — this tree's history is untouched.
          </p>
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
            Record History
          </h3>
          <Badge variant="outline" className="text-[10px]">
            {entries.length} edit{entries.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="space-y-2">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="flex items-start gap-3 text-xs border-l-2 border-primary/20 pl-3 py-1"
            >
              <div className="flex-1 min-w-0">
                <p className="text-foreground/80">
                  <span className="font-medium">{FIELD_LABELS[entry.field_name] || entry.field_name}</span>
                  {" updated"}
                </p>
                {entry.old_value && entry.new_value && (
                  <p className="text-muted-foreground/60 truncate">
                    {entry.old_value.substring(0, 40)} → {entry.new_value.substring(0, 40)}
                  </p>
                )}
                {entry.edit_reason && (
                  <p className="text-muted-foreground/50 italic truncate">"{entry.edit_reason}"</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[9px] px-1 py-0">
                    {EDIT_TYPE_LABELS[entry.edit_type] || entry.edit_type}
                  </Badge>
                  <span className="text-muted-foreground/40">
                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
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
