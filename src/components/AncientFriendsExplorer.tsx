import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { X, Heart, MapPin, TreePine, Calendar, Compass, SlidersHorizontal, Minimize2, Undo2, Camera, Music, BookOpen, Image, Sprout, User } from "lucide-react";
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

interface OfferingCounts {
  photo: number;
  poem: number;
  song: number;
  story: number;
  nft: number;
  total: number;
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

/** Species-specific gradient backgrounds for trees without photos */
const speciesGradients: Record<string, { bg: string; emoji: string }> = {
  Oak: { bg: "radial-gradient(ellipse at 40% 30%, hsla(28, 50%, 22%, 0.9), hsla(28, 30%, 10%, 1))", emoji: "🌳" },
  Yew: { bg: "radial-gradient(ellipse at 40% 30%, hsla(150, 30%, 18%, 0.9), hsla(160, 25%, 8%, 1))", emoji: "🌲" },
  Ash: { bg: "radial-gradient(ellipse at 40% 30%, hsla(45, 20%, 20%, 0.9), hsla(40, 15%, 9%, 1))", emoji: "🍂" },
  Beech: { bg: "radial-gradient(ellipse at 40% 30%, hsla(80, 30%, 18%, 0.9), hsla(75, 25%, 8%, 1))", emoji: "🌿" },
  Birch: { bg: "radial-gradient(ellipse at 40% 30%, hsla(200, 15%, 25%, 0.9), hsla(210, 10%, 12%, 1))", emoji: "🌳" },
  Willow: { bg: "radial-gradient(ellipse at 40% 30%, hsla(140, 35%, 20%, 0.9), hsla(145, 30%, 8%, 1))", emoji: "🌿" },
  Pine: { bg: "radial-gradient(ellipse at 40% 30%, hsla(160, 40%, 15%, 0.9), hsla(165, 35%, 7%, 1))", emoji: "🌲" },
  Cherry: { bg: "radial-gradient(ellipse at 40% 30%, hsla(340, 35%, 22%, 0.9), hsla(340, 25%, 10%, 1))", emoji: "🌸" },
  Holly: { bg: "radial-gradient(ellipse at 40% 30%, hsla(120, 40%, 16%, 0.9), hsla(125, 35%, 7%, 1))", emoji: "🎄" },
  Hawthorn: { bg: "radial-gradient(ellipse at 40% 30%, hsla(15, 35%, 20%, 0.9), hsla(10, 25%, 9%, 1))", emoji: "🌺" },
  Rowan: { bg: "radial-gradient(ellipse at 40% 30%, hsla(5, 40%, 20%, 0.9), hsla(0, 30%, 10%, 1))", emoji: "🍁" },
  Sycamore: { bg: "radial-gradient(ellipse at 40% 30%, hsla(90, 25%, 20%, 0.9), hsla(85, 20%, 9%, 1))", emoji: "🍃" },
  Elder: { bg: "radial-gradient(ellipse at 40% 30%, hsla(270, 20%, 18%, 0.9), hsla(280, 15%, 8%, 1))", emoji: "🫐" },
  Hazel: { bg: "radial-gradient(ellipse at 40% 30%, hsla(35, 40%, 20%, 0.9), hsla(30, 30%, 9%, 1))", emoji: "🌰" },
  Apple: { bg: "radial-gradient(ellipse at 40% 30%, hsla(100, 35%, 20%, 0.9), hsla(95, 25%, 9%, 1))", emoji: "🍎" },
  default: { bg: "radial-gradient(ellipse at center, hsla(120, 30%, 25%, 0.4), hsla(28, 20%, 10%, 0.9))", emoji: "🌳" },
};

function getSpeciesStyle(species: string) {
  // Match by first word (handles "English Oak", "Pedunculate Oak" etc.)
  const key = Object.keys(speciesGradients).find((k) =>
    species.toLowerCase().includes(k.toLowerCase())
  );
  return speciesGradients[key || "default"];
}

const TreeCard = ({
  tree,
  photoUrl,
  offeringCounts,
  wishlistCount,
  style,
  onSwipe,
  onTap,
  planterName,
  seedCount,
  isTop,
}: {
  tree: Tree;
  photoUrl?: string;
  offeringCounts?: OfferingCounts;
  wishlistCount?: number;
  planterName?: string;
  seedCount?: number;
  style?: React.CSSProperties;
  onSwipe: (dir: "left" | "right") => void;
  onTap: () => void;
  isTop: boolean;
}) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const leftOpacity = useTransform(x, [-120, 0], [1, 0]);
  const rightOpacity = useTransform(x, [0, 120], [0, 1]);
  const photoX = useTransform(x, [-200, 0, 200], [20, 0, -20]);
  const photoScale = useTransform(x, [-200, 0, 200], [1.08, 1.05, 1.08]);

  const [dragged, setDragged] = useState(false);

  const handleDragStart = () => setDragged(false);
  const handleDrag = () => setDragged(true);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const handleClick = () => {
    if (!dragged) onTap();
  };

  const speciesStyle = getSpeciesStyle(tree.species);
  const counts = offeringCounts;

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
      onDragStart={isTop ? handleDragStart : undefined}
      onDrag={isTop ? handleDrag : undefined}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onClick={isTop ? handleClick : undefined}
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
              style={{ background: speciesStyle.bg }}
            >
              <span className="text-6xl sm:text-7xl block mb-2">{speciesStyle.emoji}</span>
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

          {/* Community signals badge */}
          {counts && counts.total > 0 && (
            <div
              className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-serif"
              style={{
                background: "hsla(0, 0%, 0%, 0.55)",
                color: "hsl(42, 60%, 65%)",
                border: "1px solid hsla(42, 40%, 30%, 0.3)",
                backdropFilter: "blur(4px)",
              }}
            >
              {counts.photo > 0 && <span className="flex items-center gap-0.5"><Camera className="w-3 h-3" />{counts.photo}</span>}
              {counts.song > 0 && <span className="flex items-center gap-0.5"><Music className="w-3 h-3" />{counts.song}</span>}
              {(counts.poem + counts.story) > 0 && <span className="flex items-center gap-0.5"><BookOpen className="w-3 h-3" />{counts.poem + counts.story}</span>}
              {counts.nft > 0 && <span className="flex items-center gap-0.5"><Image className="w-3 h-3" />{counts.nft}</span>}
            </div>
          )}

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

          {/* Community engagement row */}
          {/* Community engagement signals */}
          <div className="flex items-center gap-2 flex-wrap">
            {planterName && (
              <span
                className="text-xs font-serif flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: "hsla(200, 30%, 30%, 0.12)",
                  color: "hsl(200, 40%, 62%)",
                  border: "1px solid hsla(200, 30%, 40%, 0.2)",
                }}
              >
                <User className="w-3 h-3" /> {planterName}
              </span>
            )}
            {wishlistCount != null && wishlistCount > 0 && (
              <span
                className="text-xs font-serif flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: "hsla(42, 70%, 45%, 0.12)",
                  color: "hsl(42, 60%, 60%)",
                  border: "1px solid hsla(42, 50%, 40%, 0.2)",
                }}
              >
                <Heart className="w-3 h-3" /> {wishlistCount} wishlisted
              </span>
            )}
            {counts && counts.total > 0 && (
              <span
                className="text-xs font-serif px-2 py-0.5 rounded-full"
                style={{
                  background: "hsla(120, 30%, 30%, 0.12)",
                  color: "hsl(120, 30%, 55%)",
                  border: "1px solid hsla(120, 25%, 35%, 0.2)",
                }}
              >
                {counts.total} offering{counts.total !== 1 ? "s" : ""}
              </span>
            )}
            {seedCount != null && seedCount > 0 && (
              <span
                className="text-xs font-serif flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{
                  background: "hsla(80, 40%, 30%, 0.12)",
                  color: "hsl(80, 40%, 55%)",
                  border: "1px solid hsla(80, 30%, 35%, 0.2)",
                }}
              >
                <Sprout className="w-3 h-3" /> {seedCount} seed{seedCount !== 1 ? "s" : ""}
              </span>
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

          {/* Tap hint */}
          {isTop && (
            <p className="text-[10px] font-serif text-center mt-auto pt-2" style={{ color: "hsla(42, 30%, 50%, 0.5)" }}>
              tap to view full profile
            </p>
          )}
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
  const [offeringCounts, setOfferingCounts] = useState<Record<string, OfferingCounts>>({});
  const [wishlistCounts, setWishlistCounts] = useState<Record<string, number>>({});
  const [swipeHistory, setSwipeHistory] = useState<{ index: number; dir: "left" | "right" }[]>([]);
  const [planterNames, setPlanterNames] = useState<Record<string, string>>({});
  const [seedCounts, setSeedCounts] = useState<Record<string, number>>({});
  const [heartBurst, setHeartBurst] = useState(false);

  // Fetch photo offerings + offering type counts for all trees
  useEffect(() => {
    const treeIds = trees.map((t) => t.id);
    if (!treeIds.length) return;

    // Fetch all offerings to build photo map + counts
    supabase
      .from("offerings")
      .select("tree_id, media_url, type")
      .in("tree_id", treeIds)
      .then(({ data }) => {
        if (!data) return;
        const photoMap: Record<string, string> = {};
        const countsMap: Record<string, OfferingCounts> = {};

        for (const row of data) {
          // First photo per tree
          if (row.media_url && row.type === "photo" && !photoMap[row.tree_id]) {
            photoMap[row.tree_id] = row.media_url;
          }
          // Offering counts
          if (!countsMap[row.tree_id]) {
            countsMap[row.tree_id] = { photo: 0, poem: 0, song: 0, story: 0, nft: 0, total: 0 };
          }
          const c = countsMap[row.tree_id];
          if (row.type in c) (c as any)[row.type]++;
          c.total++;
        }
        setTreePhotos(photoMap);
        setOfferingCounts(countsMap);
      });

    // Fetch wishlist counts per tree
    supabase
      .from("tree_wishlist")
      .select("tree_id")
      .in("tree_id", treeIds)
      .then(({ data }) => {
        if (!data) return;
        const wc: Record<string, number> = {};
        for (const row of data) {
          wc[row.tree_id] = (wc[row.tree_id] || 0) + 1;
        }
        setWishlistCounts(wc);
      });

    // Fetch creator profiles (who planted each tree)
    const creatorIds = [...new Set(trees.filter(t => t.created_by).map(t => t.created_by!))];
    if (creatorIds.length > 0) {
      supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", creatorIds)
        .then(({ data }) => {
          if (!data) return;
          const nameMap: Record<string, string> = {};
          for (const p of data) {
            if (p.full_name) nameMap[p.id] = p.full_name;
          }
          // Map tree id → planter name
          const treeNameMap: Record<string, string> = {};
          for (const t of trees) {
            if (t.created_by && nameMap[t.created_by]) {
              treeNameMap[t.id] = nameMap[t.created_by];
            }
          }
          setPlanterNames(treeNameMap);
        });
    }

    // Fetch seed counts per tree
    supabase
      .from("planted_seeds")
      .select("tree_id")
      .in("tree_id", treeIds)
      .then(({ data }) => {
        if (!data) return;
        const sc: Record<string, number> = {};
        for (const row of data) {
          sc[row.tree_id] = (sc[row.tree_id] || 0) + 1;
        }
        setSeedCounts(sc);
      });
  }, [trees]);

  // Try to get user location
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

  // Smart ordering: photos first, then by offering richness, then estimated age
  const filteredTrees = useMemo(() => {
    const filtered = trees.filter((tree) => {
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

    // Smart ordering: photos first → engagement richness → estimated age → name
    return filtered.sort((a, b) => {
      // 1. Trees with photos always surface first
      const aHasPhoto = treePhotos[a.id] ? 1 : 0;
      const bHasPhoto = treePhotos[b.id] ? 1 : 0;
      if (bHasPhoto !== aHasPhoto) return bHasPhoto - aHasPhoto;

      // 2. Engagement richness: offerings (×3) + wishlists (×2) + seeds (×1)
      const aScore = (offeringCounts[a.id]?.total || 0) * 3
        + (wishlistCounts[a.id] || 0) * 2
        + (seedCounts[a.id] || 0);
      const bScore = (offeringCounts[b.id]?.total || 0) * 3
        + (wishlistCounts[b.id] || 0) * 2
        + (seedCounts[b.id] || 0);
      if (bScore !== aScore) return bScore - aScore;

      // 3. Estimated age descending (ancient trees first)
      const aAge = a.estimated_age || 0;
      const bAge = b.estimated_age || 0;
      if (bAge !== aAge) return bAge - aAge;

      return a.name.localeCompare(b.name);
    });
  }, [trees, speciesFilter, ageRange, maxDistanceKm, userLocation, treePhotos, offeringCounts, wishlistCounts, seedCounts]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
    setSwipeHistory([]);
  }, [speciesFilter, ageRange, maxDistanceKm]);

  const handleSwipe = useCallback(
    (dir: "left" | "right") => {
      const tree = filteredTrees[currentIndex];
      if (dir === "right" && tree) {
        onWishlist(tree.id);
        setHeartBurst(true);
        setTimeout(() => setHeartBurst(false), 900);
        toast({
          title: `💛 ${tree.name} wishlisted`,
          description: "Added to your Wishing Tree",
          action: (
            <ToastAction altText="View Wishlist" onClick={() => navigate("/library/wishing-tree")}>
              View Wishlist
            </ToastAction>
          ),
          duration: 3000,
        });
      }
      setSwipeHistory((prev) => [...prev, { index: currentIndex, dir }]);
      setCurrentIndex((prev) => prev + 1);
    },
    [currentIndex, filteredTrees, onWishlist]
  );

  const handleUndo = useCallback(() => {
    if (swipeHistory.length === 0) return;
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(last.index);
  }, [swipeHistory]);

  const handleTapDetail = useCallback(() => {
    const tree = filteredTrees[currentIndex];
    if (tree) navigate(`/tree/${tree.id}`);
  }, [currentIndex, filteredTrees, navigate]);

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
              onClick={() => { setCurrentIndex(0); setSwipeHistory([]); }}
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
                offeringCounts={offeringCounts[nextTree.id]}
                wishlistCount={wishlistCounts[nextTree.id]}
                planterName={planterNames[nextTree.id]}
                seedCount={seedCounts[nextTree.id]}
                onSwipe={() => {}}
                onTap={() => {}}
                isTop={false}
              />
            )}
            {currentTree && (
              <TreeCard
                key={currentTree.id}
                tree={currentTree}
                photoUrl={treePhotos[currentTree.id]}
                offeringCounts={offeringCounts[currentTree.id]}
                wishlistCount={wishlistCounts[currentTree.id]}
                planterName={planterNames[currentTree.id]}
                seedCount={seedCounts[currentTree.id]}
                onSwipe={handleSwipe}
                onTap={handleTapDetail}
                isTop
              />
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Heart burst animation */}
      <AnimatePresence>
        {heartBurst && (
          <div className="fixed inset-0 z-[110] pointer-events-none flex items-center justify-center">
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * 360;
              const rad = (angle * Math.PI) / 180;
              const dist = 80 + Math.random() * 60;
              return (
                <motion.span
                  key={i}
                  className="absolute text-lg"
                  initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 1 + Math.random() * 0.6,
                    x: Math.cos(rad) * dist,
                    y: Math.sin(rad) * dist,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7 + Math.random() * 0.3, ease: "easeOut" }}
                >
                  {["💛", "✨", "💚", "🤍"][i % 4]}
                </motion.span>
              );
            })}
            <motion.span
              className="text-4xl"
              initial={{ opacity: 1, scale: 0.3 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              💛
            </motion.span>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom actions */}
      {!isEnd && (
        <div className="flex items-center justify-center gap-5 pb-6 pt-2 z-10">
          <button
            onClick={() => handleSwipe("left")}
            className="w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "hsla(0, 50%, 40%, 0.2)",
              border: "2px solid hsla(0, 50%, 50%, 0.4)",
              color: "hsl(0, 60%, 60%)",
            }}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Undo button */}
          <button
            onClick={handleUndo}
            disabled={swipeHistory.length === 0}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 disabled:opacity-25"
            style={{
              background: "hsla(270, 30%, 30%, 0.2)",
              border: "1.5px solid hsla(270, 30%, 45%, 0.3)",
              color: "hsl(270, 40%, 65%)",
            }}
            title="Undo last swipe"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (currentTree?.latitude && currentTree?.longitude) {
                navigate(`/map?lat=${currentTree.latitude}&lng=${currentTree.longitude}&zoom=16`);
              } else if (currentTree?.what3words) {
                navigate(`/map?w3w=${currentTree.what3words}`);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{
              background: "hsla(200, 50%, 40%, 0.2)",
              border: "1.5px solid hsla(200, 50%, 50%, 0.3)",
              color: "hsl(200, 50%, 60%)",
            }}
            title="View on map"
          >
            <MapPin className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={() => handleSwipe("right")}
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
