/**
 * NearbyDuplicateWarning — shown during tree creation when similar
 * trees are detected nearby. Helps prevent accidental duplicates.
 */
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, TreeDeciduous, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  findSimilarTrees,
  type SimilarityCandidate,
  type SimilarityResult,
} from "@/utils/treeSimilarityEngine";

interface Props {
  latitude: number | null;
  longitude: number | null;
  name: string;
  species: string;
  /** Called when user picks "This is the same tree" */
  onSelectExisting: (treeId: string) => void;
  /** Called when user picks "Create new anyway" */
  onDismiss: () => void;
}

export default function NearbyDuplicateWarning({
  latitude,
  longitude,
  name,
  species,
  onSelectExisting,
  onDismiss,
}: Props) {
  const [results, setResults] = useState<SimilarityResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Cache nearby candidates so we don't re-query on name/species edits
  const [nearbyCandidates, setNearbyCandidates] = useState<SimilarityCandidate[]>([]);
  const lastCoordsRef = useRef<string>("");

  // Only fetch from DB when location changes (not on name/species keystrokes)
  const fetchNearbyCandidates = useCallback(async () => {
    if (latitude === null || longitude === null) return;
    const coordKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    if (coordKey === lastCoordsRef.current) return; // skip duplicate coord fetches
    lastCoordsRef.current = coordKey;

    setLoading(true);
    try {
      const degLat = 60 / 110540;
      const degLng = 60 / (111320 * Math.cos((latitude * Math.PI) / 180));

      const { data } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude")
        .gte("latitude", latitude - degLat)
        .lte("latitude", latitude + degLat)
        .gte("longitude", longitude - degLng)
        .lte("longitude", longitude + degLng)
        .is("merged_into_tree_id", null)
        .limit(20);

      const candidates: SimilarityCandidate[] = (data || [])
        .filter((t) => t.latitude != null && t.longitude != null)
        .map((t) => ({
          id: t.id,
          name: t.name,
          species: t.species,
          latitude: t.latitude!,
          longitude: t.longitude!,
        }));
      setNearbyCandidates(candidates);
    } catch {
      setNearbyCandidates([]);
    } finally {
      setLoading(false);
    }
  }, [latitude, longitude]);

  // Re-run similarity scoring client-side when name/species change (no DB call)
  useEffect(() => {
    if (latitude === null || longitude === null || nearbyCandidates.length === 0) {
      setResults([]);
      return;
    }
    const similar = findSimilarTrees(
      { name: name || species || "", species: species || "", latitude, longitude },
      nearbyCandidates,
      0.45,
    ).slice(0, 3);
    setResults(similar);
  }, [nearbyCandidates, name, species, latitude, longitude]);

  // Fetch candidates only when coordinates change
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      setDismissed(false);
      fetchNearbyCandidates();
    }
  }, [latitude, longitude, fetchNearbyCandidates]);

  if (dismissed || (results.length === 0 && !loading)) return null;

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg border border-border/20 bg-card/30">
        <Loader2 className="h-4 w-4 animate-spin text-primary/40" />
        <span className="text-xs font-serif text-muted-foreground">Checking for nearby Ancient Friends…</span>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
              <p className="text-xs font-serif text-foreground/80">
                Possible Ancient Friend nearby
              </p>
            </div>

            <div className="space-y-2">
              {results.map((r) => (
                <div
                  key={r.tree.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/20"
                >
                  <TreeDeciduous className="h-5 w-5 text-primary/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-serif text-foreground truncate">
                      {r.tree.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {r.tree.species} · {Math.round(r.distanceM)}m away
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] shrink-0 ${
                      r.confidence === "very_likely"
                        ? "border-accent/40 text-accent"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {Math.round(r.score * 100)}% match
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    onClick={() => onSelectExisting(r.tree.id)}
                    title="View this tree"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="text-[10px] font-serif flex-1"
                onClick={() => {
                  if (results[0]) onSelectExisting(results[0].tree.id);
                }}
              >
                This is the same tree
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] font-serif flex-1 text-muted-foreground"
                onClick={() => {
                  setDismissed(true);
                  onDismiss();
                }}
              >
                Create new tree anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
