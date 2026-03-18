/**
 * DuplicateReviewQueue — steward panel for reviewing tree duplicate reports.
 * Shown inside the StewardToolsSection.
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, GitMerge, X, Check, TreeDeciduous, MapPin } from "lucide-react";
import { toast } from "sonner";

interface DuplicateReport {
  id: string;
  tree_a_id: string;
  tree_b_id: string;
  similarity_score: number;
  note: string | null;
  status: string;
  created_at: string;
  tree_a?: { name: string; species: string; latitude: number; longitude: number } | null;
  tree_b?: { name: string; species: string; latitude: number; longitude: number } | null;
}

interface Props {
  onMergeTrees: (primaryId: string, secondaryId: string) => void;
}

export default function DuplicateReviewQueue({ onMergeTrees }: Props) {
  const [reports, setReports] = useState<DuplicateReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tree_duplicate_reports" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      // Fetch tree details for each report
      const treeIds = new Set<string>();
      (data as any[]).forEach((r: any) => {
        treeIds.add(r.tree_a_id);
        treeIds.add(r.tree_b_id);
      });

      const { data: trees } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude")
        .in("id", [...treeIds]);

      const treeMap = new Map((trees || []).map((t) => [t.id, t]));

      setReports(
        (data as any[]).map((r: any) => ({
          ...r,
          tree_a: treeMap.get(r.tree_a_id) || null,
          tree_b: treeMap.get(r.tree_b_id) || null,
        })),
      );
    } else {
      setReports([]);
    }
    setLoading(false);
  };

  const handleResolve = async (reportId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("tree_duplicate_reports" as any)
      .update({
        status,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      } as any)
      .eq("id", reportId);

    if (error) {
      toast.error("Failed to update report");
    } else {
      toast.success(status === "confirmed_duplicate" ? "Marked as duplicate" : "Report resolved");
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <p className="text-xs text-muted-foreground font-serif text-center py-3">
        No pending duplicate reports
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-serif text-foreground/70 tracking-wide">
        Duplicate Reports ({reports.length})
      </h4>
      {reports.map((r) => (
        <Card key={r.id} className="bg-card/30 border-border/20">
          <CardContent className="p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <TreeInfo tree={r.tree_a} label="Tree A" />
              <TreeInfo tree={r.tree_b} label="Tree B" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">
                {Math.round(r.similarity_score * 100)}% similar
              </Badge>
              {r.note && (
                <span className="text-[10px] text-muted-foreground truncate">{r.note}</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] font-serif gap-1 flex-1"
                onClick={() => {
                  handleResolve(r.id, "confirmed_duplicate");
                  if (r.tree_a && r.tree_b) {
                    onMergeTrees(r.tree_a_id, r.tree_b_id);
                  }
                }}
              >
                <GitMerge className="h-3 w-3" />
                Merge
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-serif gap-1 flex-1"
                onClick={() => handleResolve(r.id, "separate_trees")}
              >
                <X className="h-3 w-3" />
                Separate
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-serif gap-1 flex-1"
                onClick={() => handleResolve(r.id, "rejected")}
              >
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TreeInfo({ tree, label }: { tree: any; label: string }) {
  if (!tree) return <div className="text-muted-foreground text-[10px]">{label}: Unknown</div>;
  return (
    <div>
      <p className="font-serif text-foreground/80 truncate">{tree.name}</p>
      <p className="text-[10px] text-muted-foreground">{tree.species}</p>
    </div>
  );
}
