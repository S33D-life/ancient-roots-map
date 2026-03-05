import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { TreeDeciduous, Search, MapPin, Loader2, Eye, Map as MapIcon } from "lucide-react";
import TreeWhisperButton from "@/components/TreeWhisperButton";
import SendWhisperModal from "@/components/SendWhisperModal";
import { goToTreeOnMap } from "@/utils/mapNavigation";

interface NearbyTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  distanceM: number;
  description?: string | null;
}

interface NearbyTreesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userLat: number | null;
  userLng: number | null;
  onSelectTree: (tree: NearbyTree) => void;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_OPTIONS = [200, 500, 1000] as const;

const NearbyTreesSheet = ({ open, onOpenChange, userLat, userLng, onSelectTree }: NearbyTreesSheetProps) => {
  const [trees, setTrees] = useState<NearbyTree[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState<number>(500);
  const [whisperTree, setWhisperTree] = useState<NearbyTree | null>(null);
  const [whisperOpen, setWhisperOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || userLat === null || userLng === null) return;
    loadNearby();
  }, [open, userLat, userLng, radius]);

  const loadNearby = async () => {
    if (userLat === null || userLng === null) return;
    setLoading(true);
    try {
      // Bounding box approximation for the query
      const degLat = radius / 110540;
      const degLng = radius / (111320 * Math.cos((userLat * Math.PI) / 180));

      const { data, error } = await supabase
        .from("trees")
        .select("id, name, species, latitude, longitude, description")
        .gte("latitude", userLat - degLat)
        .lte("latitude", userLat + degLat)
        .gte("longitude", userLng - degLng)
        .lte("longitude", userLng + degLng)
        .limit(100);

      if (error) throw error;

      const withDist = (data || [])
        .filter((t) => t.latitude != null && t.longitude != null)
        .map((t) => ({
          id: t.id,
          name: t.name,
          species: t.species,
          latitude: t.latitude!,
          longitude: t.longitude!,
          distanceM: haversineM(userLat, userLng, t.latitude!, t.longitude!),
          description: t.description,
        }))
        .filter((t) => t.distanceM <= radius)
        .sort((a, b) => a.distanceM - b.distanceM);

      setTrees(withDist);
    } catch (err) {
      console.error("Nearby trees error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return trees;
    const q = search.toLowerCase();
    return trees.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.species.toLowerCase().includes(q)
    );
  }, [trees, search]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[75vh] rounded-t-2xl px-4 pb-6">
        <SheetHeader className="pb-3">
          <SheetTitle className="font-serif text-base tracking-wide" style={{ color: "hsl(42, 75%, 60%)" }}>
            Check In to an Existing Tree
          </SheetTitle>
        </SheetHeader>

        {/* Radius toggle */}
        <div className="flex items-center gap-2 mb-3">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className="px-3 py-1 rounded-full text-xs font-serif transition-all"
              style={{
                background: radius === r ? "hsla(42, 60%, 40%, 0.3)" : "hsla(0, 0%, 100%, 0.05)",
                color: radius === r ? "hsl(42, 80%, 65%)" : "hsl(var(--muted-foreground))",
                border: `1px solid ${radius === r ? "hsla(42, 60%, 50%, 0.4)" : "hsla(0, 0%, 100%, 0.1)"}`,
              }}
            >
              {r >= 1000 ? `${r / 1000}km` : `${r}m`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or species…"
            className="pl-9 h-9 text-sm font-serif"
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto max-h-[45vh] space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <TreeDeciduous className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm font-serif text-muted-foreground">
                {trees.length === 0
                  ? "No mapped trees within this radius"
                  : "No matches found"}
              </p>
              <p className="text-xs font-serif text-muted-foreground/60 mt-1">
                Try a larger radius, or create a new encounter
              </p>
            </div>
          ) : (
            filtered.map((tree) => (
              <div
                key={tree.id}
                className="flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-accent/10 relative"
                style={{
                  border: "1px solid hsla(0, 0%, 100%, 0.05)",
                }}
              >
                <div className="absolute top-2 right-2 z-10">
                  <TreeWhisperButton
                    onClick={(e) => {
                      e.stopPropagation();
                      setWhisperTree(tree);
                      setWhisperOpen(true);
                    }}
                    className="h-7 w-7"
                  />
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: "radial-gradient(circle, hsla(120, 40%, 25%, 0.4), hsla(120, 30%, 15%, 0.3))",
                    border: "1px solid hsla(120, 40%, 35%, 0.3)",
                  }}
                >
                  <TreeDeciduous className="w-4 h-4" style={{ color: "hsl(120, 45%, 50%)" }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm truncate" style={{ color: "hsl(42, 70%, 65%)" }}>
                    {tree.name || "Unnamed Tree"}
                  </p>
                  <p className="text-xs text-muted-foreground font-serif truncate">
                    {tree.species} ·{" "}
                    {tree.distanceM < 1000
                      ? `${Math.round(tree.distanceM)}m`
                      : `${(tree.distanceM / 1000).toFixed(1)}km`}
                  </p>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-serif"
                    onClick={() => navigate(`/tree/${encodeURIComponent(tree.id)}`)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs font-serif"
                    onClick={() =>
                      goToTreeOnMap(navigate, {
                        treeId: tree.id,
                        lat: tree.latitude,
                        lng: tree.longitude,
                        zoom: 16,
                        source: "nearby",
                      })
                    }
                  >
                    <MapIcon className="w-3 h-3 mr-1" />
                    Map
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-3 text-xs font-serif mr-8 sm:mr-0"
                    style={{
                      background: "linear-gradient(135deg, hsl(120, 30%, 22%), hsl(120, 25%, 18%))",
                      color: "hsl(120, 50%, 65%)",
                      border: "1px solid hsla(120, 40%, 35%, 0.4)",
                    }}
                    onClick={() => onSelectTree(tree)}
                  >
                    <MapPin className="w-3 h-3 mr-1" />
                    Check In
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        {whisperTree && (
          <SendWhisperModal
            open={whisperOpen}
            onOpenChange={setWhisperOpen}
            treeId={whisperTree.id}
            treeName={whisperTree.name}
            treeSpecies={whisperTree.species}
            contextLabel={`Nearby (${Math.round(whisperTree.distanceM)}m)`}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default NearbyTreesSheet;
