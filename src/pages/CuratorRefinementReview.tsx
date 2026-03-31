/**
 * CuratorRefinementReview — lightweight curator page for reviewing
 * location refinement proposals and accepting/rejecting them.
 */
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, MapPin, TreeDeciduous, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { clusterRefinements, CONFIDENCE_LABELS } from "@/utils/locationRefinement";
import type { RefinementPoint } from "@/utils/locationRefinement";
import Header from "@/components/Header";

interface RefinementRow {
  id: string;
  tree_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_m: number | null;
  source_type: string;
  at_trunk: boolean;
  trunk_photo_url: string | null;
  note: string | null;
  weight: number;
  status: string;
  created_at: string;
}

interface TreeSummary {
  tree_id: string;
  tree_name: string;
  tree_lat: number;
  tree_lng: number;
  location_confidence: string | null;
  refinements: RefinementRow[];
}

export default function CuratorRefinementReview() {
  const { hasRole, loading: roleLoading } = useHasRole("curator");
  const [trees, setTrees] = useState<TreeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadPending = useCallback(async () => {
    setLoading(true);
    const { data: rawData } = await supabase
      .from("tree_location_refinements" as any)
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(200);
    const data = (rawData as unknown as RefinementRow[] | null);

    if (!data || data.length === 0) {
      setTrees([]);
      setLoading(false);
      return;
    }

    // Group by tree
    const treeIds = [...new Set((data as RefinementRow[]).map((r) => r.tree_id))];
    const { data: treesData } = await supabase
      .from("trees")
      .select("id, name, latitude, longitude, location_confidence")
      .in("id", treeIds);

    const treeMap = new Map(
      (treesData || []).map((t: any) => [t.id, t])
    );

    const grouped: TreeSummary[] = treeIds
      .map((tid) => {
        const t = treeMap.get(tid);
        if (!t) return null;
        return {
          tree_id: tid,
          tree_name: t.name,
          tree_lat: Number(t.latitude),
          tree_lng: Number(t.longitude),
          location_confidence: t.location_confidence,
          refinements: (data as RefinementRow[]).filter((r) => r.tree_id === tid),
        };
      })
      .filter(Boolean) as TreeSummary[];

    setTrees(grouped);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (hasRole) loadPending();
  }, [hasRole, loadPending]);

  const handleAction = useCallback(
    async (treeId: string, action: "accept" | "reject") => {
      setActing(treeId);
      const tree = trees.find((t) => t.tree_id === treeId);
      if (!tree) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // Update all pending refinements for this tree
        const ids = tree.refinements.map((r) => r.id);
        await supabase
          .from("tree_location_refinements" as any)
          .update({
            status: action === "accept" ? "accepted" : "rejected",
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString(),
            review_note: reviewNote[treeId] || null,
          } as any)
          .in("id", ids);

        if (action === "accept") {
          // Compute cluster and update tree position
          const points: RefinementPoint[] = tree.refinements.map((r) => ({
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            accuracy_m: r.accuracy_m ? Number(r.accuracy_m) : null,
            at_trunk: r.at_trunk,
            source_type: r.source_type,
            user_id: r.user_id,
            weight: Number(r.weight),
          }));

          const cluster = clusterRefinements(points, tree.tree_lat, tree.tree_lng);

          await supabase
            .from("trees")
            .update({
              latitude: cluster.centroidLat,
              longitude: cluster.centroidLng,
              location_confidence: cluster.confidence,
              refinement_count: (tree.refinements.length),
            })
            .eq("id", treeId);

          toast({ title: `✅ ${tree.tree_name} location updated` });
        } else {
          toast({ title: `Refinements rejected for ${tree.tree_name}` });
        }

        setTrees((prev) => prev.filter((t) => t.tree_id !== treeId));
      } catch (err: any) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      } finally {
        setActing(null);
      }
    },
    [trees, reviewNote, toast]
  );

  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-serif">Curator access required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-muted-foreground hover:text-primary text-sm font-serif gap-1.5"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>

        <div>
          <h1 className="text-xl font-serif font-bold tracking-wide">Location Refinements</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review GPS proposals from wanderers to improve tree positions.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : trees.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground font-serif">No pending refinements</p>
            </CardContent>
          </Card>
        ) : (
          trees.map((tree) => {
            const points: RefinementPoint[] = tree.refinements.map((r) => ({
              latitude: Number(r.latitude),
              longitude: Number(r.longitude),
              accuracy_m: r.accuracy_m ? Number(r.accuracy_m) : null,
              at_trunk: r.at_trunk,
              source_type: r.source_type,
              user_id: r.user_id,
              weight: Number(r.weight),
            }));
            const cluster = clusterRefinements(points, tree.tree_lat, tree.tree_lng);
            const conf = CONFIDENCE_LABELS[cluster.confidence];

            return (
              <Card key={tree.tree_id} className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-serif flex items-center gap-2">
                    <TreeDeciduous className="h-4 w-4 text-primary" />
                    {tree.tree_name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] font-serif">
                      {tree.refinements.length} proposal{tree.refinements.length !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-serif">
                      {cluster.uniqueUsers} wanderer{cluster.uniqueUsers !== 1 ? "s" : ""}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-serif">
                      {conf.emoji} {conf.label}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-serif">
                      Avg ±{cluster.avgAccuracy}m
                    </Badge>
                    <Badge variant="outline" className="text-[10px] font-serif">
                      Drift: {cluster.maxDriftM}m
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Per-point detail */}
                  <div className="space-y-1.5">
                    {tree.refinements.map((r) => (
                      <div
                        key={r.id}
                        className="text-[11px] flex items-center gap-2 text-muted-foreground"
                      >
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="font-mono">
                          {Number(r.latitude).toFixed(5)}, {Number(r.longitude).toFixed(5)}
                        </span>
                        <span>±{r.accuracy_m ? Math.round(Number(r.accuracy_m)) : "?"}m</span>
                        {r.at_trunk && (
                          <Badge className="text-[9px] h-4 px-1" variant="secondary">
                            trunk
                          </Badge>
                        )}
                        <span className="ml-auto opacity-60">
                          w:{Number(r.weight).toFixed(1)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {cluster.suggestedUpdate && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-xs text-primary font-serif">
                      ✨ Suggested new position: {cluster.centroidLat}, {cluster.centroidLng}
                    </div>
                  )}

                  <Textarea
                    placeholder="Review note (optional)"
                    value={reviewNote[tree.tree_id] || ""}
                    onChange={(e) =>
                      setReviewNote((prev) => ({ ...prev, [tree.tree_id]: e.target.value }))
                    }
                    className="text-xs min-h-[50px] resize-none"
                  />

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1.5 font-serif text-xs text-destructive hover:text-destructive"
                      onClick={() => handleAction(tree.tree_id, "reject")}
                      disabled={acting === tree.tree_id}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 font-serif text-xs"
                      onClick={() => handleAction(tree.tree_id, "accept")}
                      disabled={acting === tree.tree_id}
                    >
                      {acting === tree.tree_id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Accept & update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
