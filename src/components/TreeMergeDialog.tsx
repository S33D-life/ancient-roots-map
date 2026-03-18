/**
 * TreeMergeDialog — steward tool for merging duplicate tree records.
 * Preserves all offerings, encounters, and contributor attribution.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, GitMerge, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { haversineDistance } from "@/utils/treeSimilarityEngine";

interface TreeInfo {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  primaryTreeId: string;
  secondaryTreeId: string;
  onMergeComplete: () => void;
}

export default function TreeMergeDialog({
  open,
  onOpenChange,
  primaryTreeId,
  secondaryTreeId,
  onMergeComplete,
}: Props) {
  const [primary, setPrimary] = useState<TreeInfo | null>(null);
  const [secondary, setSecondary] = useState<TreeInfo | null>(null);
  const [reason, setReason] = useState("");
  const [merging, setMerging] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setReason("");
    loadTrees();
  }, [open, primaryTreeId, secondaryTreeId]);

  const loadTrees = async () => {
    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .in("id", [primaryTreeId, secondaryTreeId]);

    if (data) {
      const p = data.find((t) => t.id === primaryTreeId) || null;
      const s = data.find((t) => t.id === secondaryTreeId) || null;
      setPrimary(p);
      setSecondary(s);

      // Safety warnings
      const w: string[] = [];
      if (p && s) {
        if (p.species !== s.species) w.push(`Species conflict: "${p.species}" vs "${s.species}"`);
        if (p.latitude && p.longitude && s.latitude && s.longitude) {
          const dist = haversineDistance(p.latitude, p.longitude, s.latitude, s.longitude);
          if (dist > 50) w.push(`Distance between trees: ${Math.round(dist)}m (>50m)`);
        }
      }
      setWarnings(w);
    }
  };

  const executeMerge = async () => {
    if (!primary || !secondary) return;
    setMerging(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Reassign offerings from secondary → primary
      const { count: offeringsCount } = await supabase
        .from("offerings")
        .update({ tree_id: primary.id } as any)
        .eq("tree_id", secondary.id)
        .select("id", { count: "exact", head: true });

      // 2. Reassign checkins
      const { count: checkinsCount } = await supabase
        .from("tree_checkins" as any)
        .update({ tree_id: primary.id } as any)
        .eq("tree_id", secondary.id)
        .select("id", { count: "exact", head: true });

      // 3. Reassign heart transactions
      await supabase
        .from("heart_transactions" as any)
        .update({ tree_id: primary.id } as any)
        .eq("tree_id", secondary.id);

      // 4. Mark secondary as merged
      await supabase
        .from("trees")
        .update({ merged_into_tree_id: primary.id } as any)
        .eq("id", secondary.id);

      // 5. Record merge history
      await supabase.from("tree_merge_history" as any).insert({
        primary_tree_id: primary.id,
        secondary_tree_id: secondary.id,
        merged_by: user.id,
        merge_reason: reason.trim() || null,
        data_migrated: {
          offerings_moved: offeringsCount || 0,
          checkins_moved: checkinsCount || 0,
        },
      } as any);

      // 6. Record edit history
      await supabase.from("tree_edit_history" as any).insert({
        tree_id: primary.id,
        user_id: user.id,
        field_name: "merge",
        old_value: null,
        new_value: secondary.id,
        edit_reason: `Merged duplicate: ${secondary.name}`,
        edit_type: "merge",
      } as any);

      toast.success(`Merged "${secondary.name}" into "${primary.name}"`);
      onMergeComplete();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Merge failed: " + (err.message || "Unknown error"));
    } finally {
      setMerging(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-serif flex items-center gap-2">
            <GitMerge className="h-5 w-5 text-primary" />
            Merge Duplicate Records
          </AlertDialogTitle>
          <AlertDialogDescription className="font-serif text-sm space-y-3">
            {primary && secondary && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-card/50 border border-border/20">
                <div className="flex-1 text-center">
                  <p className="text-foreground font-medium text-xs">{secondary.name}</p>
                  <p className="text-[10px] text-muted-foreground">{secondary.species}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-primary/60 shrink-0" />
                <div className="flex-1 text-center">
                  <p className="text-foreground font-medium text-xs">{primary.name}</p>
                  <p className="text-[10px] text-muted-foreground">{primary.species}</p>
                  <Badge variant="outline" className="text-[8px] mt-1">Primary</Badge>
                </div>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="space-y-1">
                {warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-yellow-500">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span className="text-[10px]">{w}</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-muted-foreground text-xs">
              All offerings, encounters, and contributor records will be moved to the primary tree.
              The secondary record will be archived with a redirect.
            </p>

            <Textarea
              placeholder="Merge reason (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="text-xs font-serif min-h-[60px]"
              maxLength={500}
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
          <Button
            onClick={executeMerge}
            disabled={merging}
            className="font-serif gap-1.5"
          >
            {merging ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4" />}
            Confirm Merge
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
