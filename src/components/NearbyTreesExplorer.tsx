/**
 * NearbyTreesExplorer — Compact nearby trees section for tree detail pages.
 * Shows up to 5 trees within ~2km, encouraging exploration loops.
 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TreeDeciduous, MapPin, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { haversineKm } from "@/utils/mapGeometry";
import { getHiveForSpecies } from "@/utils/hiveUtils";

interface NearbyTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  distKm: number;
}

interface NearbyTreesExplorerProps {
  treeId: string;
  lat: number;
  lng: number;
  species?: string;
}

const SEARCH_RADIUS_DEG = 0.02; // ~2km

const NearbyTreesExplorer = ({ treeId, lat, lng, species }: NearbyTreesExplorerProps) => {
  const [trees, setTrees] = useState<NearbyTree[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude")
        .gte("latitude", lat - SEARCH_RADIUS_DEG)
        .lte("latitude", lat + SEARCH_RADIUS_DEG)
        .gte("longitude", lng - SEARCH_RADIUS_DEG)
        .lte("longitude", lng + SEARCH_RADIUS_DEG)
        .neq("id", treeId)
        .limit(20);

      if (data) {
        const withDist = data
          .map((t) => ({
            ...t,
            distKm: haversineKm(lat, lng, t.latitude, t.longitude),
          }))
          .sort((a, b) => a.distKm - b.distKm)
          .slice(0, 5);
        setTrees(withDist);
      }
      setLoading(false);
    };
    fetch();
  }, [treeId, lat, lng]);

  if (loading || trees.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <TreeDeciduous className="w-4 h-4 text-primary/60" />
        <h3 className="text-sm font-serif text-foreground/80 tracking-wide">
          Nearby Ancient Friends
        </h3>
        <span className="text-[9px] text-muted-foreground/50 font-mono ml-auto">
          within 2km
        </span>
      </div>

      <div className="space-y-1">
        {trees.map((t) => {
          const hive = getHiveForSpecies(t.species);
          return (
            <Link
              key={t.id}
              to={`/tree/${t.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-200 group hover:border-primary/30 hover:bg-card/50"
              style={{
                borderColor: "hsl(var(--border) / 0.15)",
                background: "hsl(var(--card) / 0.2)",
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: hive
                    ? `hsl(${hive.accentHsl} / 0.12)`
                    : "hsl(var(--primary) / 0.08)",
                }}
              >
                <span className="text-sm">{hive?.icon || "🌳"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-serif text-foreground/80 truncate group-hover:text-primary transition-colors">
                  {t.name}
                </p>
                <p className="text-[10px] text-muted-foreground/50 italic truncate">
                  {t.species}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <MapPin className="w-2.5 h-2.5 text-muted-foreground/40" />
                <span className="text-[10px] text-muted-foreground/50 font-mono">
                  {t.distKm < 1
                    ? `${Math.round(t.distKm * 1000)}m`
                    : `${t.distKm.toFixed(1)}km`}
                </span>
              </div>
              <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary/60 transition-colors shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Map link for broader exploration */}
      <Link
        to={`/map?lat=${lat}&lng=${lng}&zoom=15&arrival=nearby`}
        className="flex items-center justify-center gap-1.5 text-[10px] font-serif text-primary/50 hover:text-primary/80 transition-colors py-1"
      >
        Explore more on the map <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
};

export default NearbyTreesExplorer;
