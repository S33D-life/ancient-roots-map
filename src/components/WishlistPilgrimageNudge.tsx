/**
 * WishlistPilgrimageNudge — shows nearby wished trees as a gentle
 * floating pill on the map. Encourages users to visit trees they've saved.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, X, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/utils/mapGeometry";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NearbyWish {
  wishId: string;
  treeId: string;
  treeName: string;
  species: string;
  distanceKm: number;
  lat: number;
  lng: number;
}

interface Props {
  /** Current map center or user location */
  userLat?: number | null;
  userLng?: number | null;
  /** Max distance in km to show nudges */
  radiusKm?: number;
}

export default function WishlistPilgrimageNudge({ userLat, userLng, radiusKm = 5 }: Props) {
  const [nearby, setNearby] = useState<NearbyWish[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const fetchNearbyWishes = useCallback(async () => {
    if (userLat == null || userLng == null) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("tree_wishlist")
      .select("id, tree_id, tree:trees(id, name, species, latitude, longitude)")
      .eq("user_id", user.id);

    if (!data) return;

    const results: NearbyWish[] = [];
    for (const item of data) {
      const tree = item.tree as any;
      if (!tree?.latitude || !tree?.longitude) continue;
      const dist = haversineKm(userLat, userLng, tree.latitude, tree.longitude);
      if (dist <= radiusKm) {
        results.push({
          wishId: item.id,
          treeId: tree.id,
          treeName: tree.name || "Unnamed Tree",
          species: tree.species || "Unknown",
          distanceKm: dist,
          lat: tree.latitude,
          lng: tree.longitude,
        });
      }
    }

    results.sort((a, b) => a.distanceKm - b.distanceKm);
    setNearby(results.slice(0, 5));
  }, [userLat, userLng, radiusKm]);

  useEffect(() => {
    fetchNearbyWishes();
  }, [fetchNearbyWishes]);

  if (dismissed || nearby.length === 0) return null;

  const closest = nearby[0];
  const distLabel = closest.distanceKm < 1
    ? `${Math.round(closest.distanceKm * 1000)}m`
    : `${closest.distanceKm.toFixed(1)}km`;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-lg shadow-xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

          {/* Collapsed: single pill */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center border border-accent/25 shrink-0">
              <Star className="w-4 h-4 text-accent fill-accent/30" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground truncate">
                {nearby.length} wished tree{nearby.length !== 1 ? "s" : ""} nearby
              </p>
              <p className="text-[10px] text-muted-foreground font-serif">
                Closest: {closest.treeName} · {distLabel}
              </p>
            </div>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            <button
              className="p-1 text-muted-foreground/50 hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </button>

          {/* Expanded: list */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-1.5">
                  {nearby.map((w) => {
                    const d = w.distanceKm < 1
                      ? `${Math.round(w.distanceKm * 1000)}m`
                      : `${w.distanceKm.toFixed(1)}km`;
                    return (
                      <button
                        key={w.wishId}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-secondary/10 border border-border/30 hover:border-accent/30 transition-colors text-left"
                        onClick={() => navigate(`/tree/${w.treeId}`)}
                      >
                        <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-serif text-foreground truncate">{w.treeName}</p>
                          <p className="text-[10px] text-muted-foreground font-serif">{w.species}</p>
                        </div>
                        <span className="text-[10px] text-muted-foreground font-serif tabular-nums shrink-0">
                          {d}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
