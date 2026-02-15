/**
 * EncounterClusterPanel — Shows grouped wanderer encounters on a tree detail page.
 * Displays nearby duplicate entries as a social "shared encounters" section.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { findNearbyEncounters } from "@/utils/treeEncounterClustering";
import { Users, ChevronDown, ChevronUp, MapPin, Camera, Eye, Unlink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Tree = Database["public"]["Tables"]["trees"]["Row"];

interface WandererInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface EncounterWithMeta {
  tree: Tree;
  profile: WandererInfo | null;
  photoCount: number;
  heroPhoto: string | null;
}

interface EncounterClusterPanelProps {
  tree: Tree;
}

const EncounterClusterPanel = ({ tree }: EncounterClusterPanelProps) => {
  const [encounters, setEncounters] = useState<EncounterWithMeta[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEncounters = async () => {
      // Fetch all trees with same species in a bounding box for efficiency
      if (!tree.latitude || !tree.longitude) {
        setLoading(false);
        return;
      }

      const lat = Number(tree.latitude);
      const lng = Number(tree.longitude);
      const delta = 0.001; // ~100m in degrees

      const { data: nearbyTrees } = await supabase
        .from("trees")
        .select("*")
        .gte("latitude", lat - delta)
        .lte("latitude", lat + delta)
        .gte("longitude", lng - delta)
        .lte("longitude", lng + delta)
        .neq("id", tree.id);

      if (!nearbyTrees || nearbyTrees.length === 0) {
        setLoading(false);
        return;
      }

      const related = findNearbyEncounters(tree, nearbyTrees);
      if (related.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch profiles and photo counts for each encounter
      const creatorIds = [...new Set(related.map(t => t.created_by).filter(Boolean) as string[])];
      const treeIds = related.map(t => t.id);

      const [profilesRes, photosRes] = await Promise.all([
        creatorIds.length > 0
          ? supabase.rpc("get_safe_profiles", { p_ids: creatorIds })
          : Promise.resolve({ data: [] }),
        supabase.from("offerings").select("tree_id, media_url").in("tree_id", treeIds).eq("type", "photo"),
      ]);

      const profileMap = new Map<string, WandererInfo>();
      for (const p of (profilesRes.data || [])) {
        profileMap.set(p.id, p);
      }

      const photosByTree = new Map<string, { count: number; hero: string | null }>();
      for (const o of (photosRes.data || [])) {
        const curr = photosByTree.get(o.tree_id) || { count: 0, hero: null };
        curr.count++;
        if (!curr.hero && o.media_url) curr.hero = o.media_url;
        photosByTree.set(o.tree_id, curr);
      }

      const enriched: EncounterWithMeta[] = related.map(t => ({
        tree: t,
        profile: t.created_by ? profileMap.get(t.created_by) || null : null,
        photoCount: photosByTree.get(t.id)?.count || 0,
        heroPhoto: photosByTree.get(t.id)?.hero || null,
      }));

      // Sort by photo count descending, then date
      enriched.sort((a, b) => b.photoCount - a.photoCount || new Date(a.tree.created_at).getTime() - new Date(b.tree.created_at).getTime());

      setEncounters(enriched);
      setLoading(false);
    };

    fetchEncounters();
  }, [tree.id, tree.latitude, tree.longitude]);

  if (loading || encounters.length === 0) return null;

  const uniqueWanderers = new Set(encounters.map(e => e.tree.created_by).filter(Boolean));
  // Add current tree's creator
  if (tree.created_by) uniqueWanderers.add(tree.created_by);

  return (
    <div className="mb-8">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(90deg, hsl(var(--accent) / 0.3), transparent)" }}
        />
        <h2 className="text-lg font-serif tracking-widest uppercase flex items-center gap-2" style={{ color: "hsl(var(--accent))" }}>
          <Users className="h-4 w-4" />
          Shared Encounters
        </h2>
        <div
          className="h-px flex-1"
          style={{ background: "linear-gradient(270deg, hsl(var(--accent) / 0.3), transparent)" }}
        />
      </div>

      {/* Summary bar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card/40 backdrop-blur hover:bg-card/60 transition-all group"
      >
        {/* Stacked avatars */}
        <div className="flex -space-x-2">
          {encounters.slice(0, 4).map((enc, i) => (
            <div
              key={enc.tree.id}
              className="w-8 h-8 rounded-full border-2 border-card overflow-hidden"
              style={{ zIndex: 4 - i }}
            >
              {enc.profile?.avatar_url ? (
                <img src={enc.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : enc.heroPhoto ? (
                <img src={enc.heroPhoto} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center text-xs text-muted-foreground">
                  🌳
                </div>
              )}
            </div>
          ))}
          {encounters.length > 4 && (
            <div className="w-8 h-8 rounded-full border-2 border-card bg-secondary flex items-center justify-center text-xs text-muted-foreground font-serif" style={{ zIndex: 0 }}>
              +{encounters.length - 4}
            </div>
          )}
        </div>

        <div className="flex-1 text-left">
          <p className="text-sm font-serif text-foreground/90">
            {encounters.length} other wanderer{encounters.length > 1 ? "s" : ""} encountered this tree
          </p>
          <p className="text-xs text-muted-foreground font-serif">
            {uniqueWanderers.size} unique visitor{uniqueWanderers.size > 1 ? "s" : ""} · {encounters.reduce((sum, e) => sum + e.photoCount, 0)} shared photos
          </p>
        </div>

        <Badge variant="outline" className="font-serif text-xs gap-1 border-accent/40 text-accent">
          <Eye className="h-3 w-3" />
          {encounters.length + 1}
        </Badge>

        {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {/* Expanded encounter gallery */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-3">
              {/* Photo mosaic */}
              {encounters.some(e => e.heroPhoto) && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {encounters.filter(e => e.heroPhoto).map((enc) => (
                    <Link
                      key={enc.tree.id}
                      to={`/tree/${enc.tree.id}`}
                      className="flex-shrink-0 group/photo"
                    >
                      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden border border-border/50 hover:border-primary/50 transition-all">
                        <img
                          src={enc.heroPhoto!}
                          alt={`${enc.tree.name} by ${enc.profile?.full_name || "a wanderer"}`}
                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                          <p className="text-[10px] text-white/90 font-serif truncate">
                            {enc.profile?.full_name || "Anonymous"}
                          </p>
                        </div>
                        {enc.photoCount > 1 && (
                          <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Camera className="h-2.5 w-2.5" />
                            {enc.photoCount}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Individual encounter cards */}
              {encounters.map((enc, i) => (
                <motion.div
                  key={enc.tree.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                >
                  <Link
                    to={`/tree/${enc.tree.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 hover:border-primary/30 transition-all group/card"
                  >
                    {/* Avatar or tree emoji */}
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-border/50 flex-shrink-0">
                      {enc.profile?.avatar_url ? (
                        <img src={enc.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-secondary flex items-center justify-center text-lg">🌳</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-serif text-foreground/90 truncate">
                        {enc.profile?.full_name || "Anonymous Wanderer"}
                      </p>
                      <p className="text-xs text-muted-foreground font-serif">
                        Mapped as "{enc.tree.name}" · {new Date(enc.tree.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {enc.photoCount > 0 && (
                        <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                          <Camera className="h-3 w-3" />
                          {enc.photoCount}
                        </span>
                      )}
                      {enc.tree.what3words && (
                        <span className="text-[10px] text-muted-foreground/60 font-mono hidden md:block">
                          /{enc.tree.what3words}
                        </span>
                      )}
                    </div>
                  </Link>
                </motion.div>
              ))}

              {/* Separation option */}
              <p className="text-[10px] text-muted-foreground/50 font-serif text-center pt-2 flex items-center justify-center gap-1">
                <Unlink className="h-3 w-3" />
                If these are genuinely separate trees, each entry remains independently accessible.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EncounterClusterPanel;
