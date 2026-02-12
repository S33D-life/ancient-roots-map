import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, MapPin, TreePine, Calendar, Compass, SlidersHorizontal, ChevronLeft, ChevronRight, Minimize2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface Tree {
  id: string;
  name: string;
  species: string;
  what3words: string;
  latitude: number;
  longitude: number;
  description: string | null;
  lineage: string | null;
  state: string | null;
  nation: string | null;
  estimated_age: number | null;
  grove_scale: string | null;
  created_at: string;
  created_by: string | null;
}

interface AncientFriendsExplorerProps {
  trees: Tree[];
  onClose: () => void;
  onWishlist: (treeId: string) => void;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const TreeCard = ({
  tree,
  photoUrl,
  style,
  onSwipe,
  isTop,
}: {
  tree: Tree;
  photoUrl?: string;
  style?: React.CSSProperties;
  onSwipe: (dir: "left" | "right") => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const leftOpacity = useTransform(x, [-120, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 120], [0, 1]);

  // Parallax: photo shifts opposite to drag, slight scale
  const photoX = useTransform(x, [-200, 0, 200], [20, 0, -20]);
  const photoScale = useTransform(x, [-200, 0, 200], [1.08, 1.05, 1.08]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  return (
    <motion.div
      className="absolute inset-4 sm:inset-8 md:inset-12 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      style={{
        x: isTop ? x : 0,
        rotate: isTop ? rotate : 0,
        ...style,
        background: "linear-gradient(160deg, hsl(28 30% 12%), hsl(22 25% 8%))",
        border: "1px solid hsla(42, 40%, 30%, 0.4)",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
      }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={isTop ? handleDragEnd : undefined}
      initial={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, opacity: isTop ? 1 : 0.7 }}
      exit={{
        x: 300,
        opacity: 0,
        rotate: 20,
        transition: { duration: 0.3 },
      }}
    >
      {/* Swipe indicators */}
      {isTop && (
        <>
          <motion.div
            className="absolute top-8 left-8 z-20 rounded-xl px-4 py-2 border-2 font-serif text-xl tracking-wider"
            style={{
              opacity: leftOpacity,
              borderColor: "hsl(0, 70%, 55%)",
              color: "hsl(0, 70%, 55%)",
              transform: "rotate(-12deg)",
            }}
          >
            SKIP
          </motion.div>
          <motion.div
            className="absolute top-8 right-8 z-20 rounded-xl px-4 py-2 border-2 font-serif text-xl tracking-wider"
            style={{
              opacity: rightOpacity,
              borderColor: "hsl(42, 80%, 55%)",
              color: "hsl(42, 80%, 55%)",
              transform: "rotate(12deg)",
            }}
          >
            WISH ✨
          </motion.div>
        </>
      )}

      {/* Card content */}
      <div className="relative h-full flex flex-col">
        {/* Top image area */}
        <div className="relative flex-shrink-0 h-[40%] overflow-hidden">
          {photoUrl ? (
            <motion.div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${photoUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                x: isTop ? photoX : 0,
                scale: isTop ? photoScale : 1.05,
              }}
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background: "radial-gradient(ellipse at center, hsla(120, 30%, 25%, 0.4), hsla(28, 20%, 10%, 0.9))",
              }}
            >
              <span className="text-6xl sm:text-7xl block mb-2">🌳</span>
            </div>
          )}
          <Badge
            className="absolute top-4 left-4 font-serif text-sm px-3 py-1 z-10"
            style={{
              background: "hsla(0, 0%, 0%, 0.55)",
              color: "hsl(42, 80%, 60%)",
              border: "1px solid hsla(42, 60%, 50%, 0.3)",
              backdropFilter: "blur(4px)",
            }}
          >
            {tree.species}
          </Badge>
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[hsl(22,25%,8%)] to-transparent z-[1]" />
        </div>

        {/* Info section */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col gap-4 overflow-y-auto">
          <h2
            className="text-2xl sm:text-3xl font-serif tracking-wide"
            style={{ color: "hsl(42, 80%, 65%)" }}
          >
            {tree.name}
          </h2>

          {tree.lineage && (
            <p className="text-sm italic font-serif" style={{ color: "hsla(42, 40%, 60%, 0.7)" }}>
              {tree.lineage}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            {tree.estimated_age && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(42, 50%, 58%)" }}>
                <Calendar className="w-4 h-4 shrink-0" />
                <span>~{tree.estimated_age} years</span>
              </div>
            )}
            {tree.what3words && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(42, 50%, 58%)" }}>
                <MapPin className="w-4 h-4 shrink-0" />
                <span className="truncate">/{tree.what3words}</span>
              </div>
            )}
            {tree.nation && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(42, 50%, 58%)" }}>
                <Compass className="w-4 h-4 shrink-0" />
                <span>{tree.nation}</span>
              </div>
            )}
            {tree.grove_scale && (
              <div className="flex items-center gap-2 text-sm" style={{ color: "hsl(42, 50%, 58%)" }}>
                <TreePine className="w-4 h-4 shrink-0" />
                <span className="capitalize">{tree.grove_scale.replace("_", " ")}</span>
              </div>
            )}
          </div>

          {tree.description && (
            <p
              className="text-sm leading-relaxed line-clamp-4 font-serif"
              style={{ color: "hsla(42, 30%, 65%, 0.8)" }}
            >
              {tree.description}
            </p>
          )}

          <div className="mt-auto" />
        </div>
      </div>
    </motion.div>
  );
};

const AncientFriendsExplorer = ({ trees, onClose, onWishlist }: AncientFriendsExplorerProps) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [speciesFilter, setSpeciesFilter] = useState("all");
  const [ageRange, setAgeRange] = useState([0, 5000]);
  const [maxDistanceKm, setMaxDistanceKm] = useState(50000);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [treePhotos, setTreePhotos] = useState<Record<string, string>>({});

  // Fetch photo offerings for all trees
  useEffect(() => {
    const treeIds = trees.map((t) => t.id);
    if (!treeIds.length) return;
    supabase
      .from("offerings")
      .select("tree_id, media_url")
      .eq("type", "photo")
      .not("media_url", "is", null)
      .in("tree_id", treeIds)
      .then(({ data }) => {
        if (!data) return;
        const photoMap: Record<string, string> = {};
        // Use the first photo found per tree
        for (const row of data) {
          if (row.media_url && !photoMap[row.tree_id]) {
            photoMap[row.tree_id] = row.media_url;
          }
        }
        setTreePhotos(photoMap);
      });
  }, [trees]);

  // Try to get user location for proximity filtering
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const uniqueSpecies = useMemo(
    () => Array.from(new Set(trees.map((t) => t.species))).sort(),
    [trees]
  );

  const maxAge = useMemo(
    () => Math.max(...trees.filter((t) => t.estimated_age).map((t) => t.estimated_age!), 5000),
    [trees]
  );

  const filteredTrees = useMemo(() => {
    return trees.filter((tree) => {
      if (speciesFilter !== "all" && tree.species !== speciesFilter) return false;

      if (tree.estimated_age != null) {
        if (tree.estimated_age < ageRange[0] || tree.estimated_age > ageRange[1]) return false;
      }

      if (userLocation && tree.latitude && tree.longitude && maxDistanceKm < 50000) {
        const dist = getDistanceKm(userLocation.lat, userLocation.lng, tree.latitude, tree.longitude);
        if (dist > maxDistanceKm) return false;
      }

      return true;
    });
  }, [trees, speciesFilter, ageRange, maxDistanceKm, userLocation]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [speciesFilter, ageRange, maxDistanceKm]);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      const tree = filteredTrees[currentIndex];
      if (dir === "right" && tree) {
        onWishlist(tree.id);
      }
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, filteredTrees, onWishlist]
  );

  const handleButtonSwipe = (dir: "left" | "right") => {
    handleSwipe(dir);
  };

  const currentTree = filteredTrees[currentIndex];
  const nextTree = filteredTrees[currentIndex + 1];
  const isEnd = currentIndex >= filteredTrees.length;

  const distanceLabels = [
    { val: 5, label: "5 km" },
    { val: 25, label: "25 km" },
    { val: 100, label: "100 km" },
    { val: 500, label: "500 km" },
    { val: 2000, label: "2,000 km" },
    { val: 10000, label: "10,000 km" },
    { val: 50000, label: "🌍 All" },
  ];
  const closestDistLabel = distanceLabels.reduce((best, d) =>
    Math.abs(d.val - maxDistanceKm) < Math.abs(best.val - maxDistanceKm) ? d : best
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{
        background: "linear-gradient(160deg, hsl(220 40% 6%), hsl(28 20% 8%), hsl(220 30% 6%))",
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 z-10">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-serif transition-all active:scale-95"
          style={{
            background: "hsla(30, 20%, 15%, 0.8)",
            color: "hsl(42, 50%, 60%)",
            border: "1px solid hsla(42, 40%, 30%, 0.3)",
          }}
        >
          <Minimize2 className="w-3 h-3" /> Close
        </button>

        <div className="flex items-center gap-2">
          <span
            className="text-xs font-serif tabular-nums px-2 py-1 rounded-full"
            style={{
              background: "hsla(30, 20%, 12%, 0.8)",
              color: "hsl(42, 50%, 55%)",
              border: "1px solid hsla(42, 40%, 30%, 0.3)",
            }}
          >
            {currentIndex + 1} / {filteredTrees.length}
          </span>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-serif transition-all active:scale-95"
            style={{
              background: showFilters ? "hsla(42, 80%, 50%, 0.2)" : "hsla(30, 20%, 15%, 0.8)",
              color: showFilters ? "hsl(42, 80%, 60%)" : "hsl(42, 50%, 60%)",
              border: `1px solid ${showFilters ? "hsla(42, 70%, 50%, 0.5)" : "hsla(42, 40%, 30%, 0.3)"}`,
            }}
          >
            <SlidersHorizontal className="w-3 h-3" /> Tune
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-4 z-10"
          >
            <div
              className="rounded-xl p-4 space-y-4 mb-2"
              style={{
                background: "hsla(30, 20%, 10%, 0.95)",
                border: "1px solid hsla(42, 40%, 30%, 0.3)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Species */}
              <div>
                <label className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block" style={{ color: "hsl(42, 40%, 50%)" }}>
                  Species
                </label>
                <Select value={speciesFilter} onValueChange={setSpeciesFilter}>
                  <SelectTrigger
                    className="h-8 text-xs font-serif"
                    style={{
                      background: "hsla(28, 20%, 14%, 0.8)",
                      borderColor: "hsla(42, 40%, 30%, 0.4)",
                      color: "hsl(42, 55%, 62%)",
                    }}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">TETOL — All Species</SelectItem>
                    {uniqueSpecies.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Age range */}
              <div>
                <label className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block" style={{ color: "hsl(42, 40%, 50%)" }}>
                  Estimated Age: {ageRange[0]}–{ageRange[1]}+ years
                </label>
                <Slider
                  value={ageRange}
                  onValueChange={setAgeRange}
                  min={0}
                  max={maxAge}
                  step={10}
                  className="mt-2"
                />
              </div>

              {/* Proximity */}
              <div>
                <label className="text-[10px] font-serif uppercase tracking-widest mb-1.5 block" style={{ color: "hsl(42, 40%, 50%)" }}>
                  Proximity: {closestDistLabel.label}
                  {!userLocation && <span className="ml-2 opacity-60">(location unavailable)</span>}
                </label>
                <Slider
                  value={[maxDistanceKm]}
                  onValueChange={([v]) => setMaxDistanceKm(v)}
                  min={5}
                  max={50000}
                  step={5}
                  disabled={!userLocation}
                  className="mt-2"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card stack */}
      <div className="flex-1 relative overflow-hidden">
        {isEnd ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="text-5xl">🍃</span>
            <p className="text-xl font-serif" style={{ color: "hsl(42, 70%, 60%)" }}>
              You've seen all {filteredTrees.length} ancient friends
            </p>
            <p className="text-sm font-serif" style={{ color: "hsla(42, 30%, 55%, 0.7)" }}>
              Try adjusting your filters to discover more
            </p>
            <button
              onClick={() => setCurrentIndex(0)}
              className="mt-4 px-5 py-2 rounded-full text-sm font-serif transition-all active:scale-95"
              style={{
                background: "hsla(42, 80%, 50%, 0.15)",
                color: "hsl(42, 80%, 60%)",
                border: "1px solid hsla(42, 60%, 50%, 0.3)",
              }}
            >
              Start Over
            </button>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {nextTree && (
              <TreeCard
                key={nextTree.id}
                tree={nextTree}
                photoUrl={treePhotos[nextTree.id]}
                onSwipe={() => {}}
                isTop={false}
              />
            )}
            {currentTree && (
              <TreeCard
                key={currentTree.id}
                tree={currentTree}
                photoUrl={treePhotos[currentTree.id]}
                onSwipe={handleSwipe}
                isTop
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom actions */}
      {!isEnd && (
        <div className="flex items-center justify-center gap-6 pb-6 pt-2 z-10">
          <button
            onClick={() => handleButtonSwipe("left")}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "hsla(0, 50%, 40%, 0.2)",
              border: "2px solid hsla(0, 50%, 50%, 0.4)",
              color: "hsl(0, 60%, 60%)",
            }}
          >
            <X className="w-6 h-6" />
          </button>

          <button
            onClick={() => {
              if (currentTree?.latitude && currentTree?.longitude) {
                navigate(`/map?lat=${currentTree.latitude}&lng=${currentTree.longitude}&zoom=16`);
              } else if (currentTree?.what3words) {
                navigate(`/map?w3w=${currentTree.what3words}`);
              }
            }}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "hsla(200, 50%, 40%, 0.2)",
              border: "2px solid hsla(200, 50%, 50%, 0.3)",
              color: "hsl(200, 50%, 60%)",
            }}
            title="View on map"
          >
            <MapPin className="w-5 h-5" />
          </button>

          <button
            onClick={() => handleButtonSwipe("right")}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "hsla(42, 70%, 45%, 0.2)",
              border: "2px solid hsla(42, 70%, 50%, 0.4)",
              color: "hsl(42, 80%, 60%)",
            }}
          >
            <Heart className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AncientFriendsExplorer;
