/**
 * NearbyDiscoveryPanel — Floating panel showing Ancient Friends near the user.
 * Updates as user location changes. Tap to fly the map to that tree.
 * Designed to be subtle, elegant, and encouraging of wandering.
 */
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import { haversineKm } from "@/utils/mapGeometry";

interface NearbyTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

interface NearbyDiscoveryPanelProps {
  trees: Array<{
    id: string;
    name: string;
    species: string;
    latitude: number;
    longitude: number;
  }>;
  userLat: number | null;
  userLng: number | null;
  onTreeSelect: (lat: number, lng: number, treeId: string) => void;
  visible?: boolean;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

const MAX_NEARBY = 5;
const MAX_RADIUS_KM = 50;

const NearbyDiscoveryPanel = ({
  trees,
  userLat,
  userLng,
  onTreeSelect,
  visible = true,
}: NearbyDiscoveryPanelProps) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const nearbyTrees = useMemo<NearbyTree[]>(() => {
    if (userLat == null || userLng == null || trees.length === 0) return [];

    return trees
      .map((t) => ({
        ...t,
        distanceKm: haversineKm(userLat, userLng, t.latitude, t.longitude),
      }))
      .filter((t) => t.distanceKm <= MAX_RADIUS_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, MAX_NEARBY);
  }, [trees, userLat, userLng]);

  const handleSelect = useCallback(
    (tree: NearbyTree) => {
      onTreeSelect(tree.latitude, tree.longitude, tree.id);
    },
    [onTreeSelect]
  );

  if (!visible || dismissed || nearbyTrees.length === 0) return null;

  const preview = nearbyTrees.slice(0, expanded ? MAX_NEARBY : 2);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="absolute right-3 z-[999] max-w-[220px]"
        style={{
          top: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
        }}
      >
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: "hsla(30, 18%, 10%, 0.88)",
            borderColor: "hsla(42, 35%, 30%, 0.35)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            boxShadow: "0 8px 32px hsla(0, 0%, 0%, 0.4)",
          }}
        >
          {/* Header */}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-3 py-2 transition-colors hover:bg-white/5"
          >
            <div className="flex items-center gap-1.5">
              <Navigation
                className="w-3 h-3"
                style={{ color: "hsl(42, 70%, 60%)" }}
              />
              <span
                className="text-[10px] font-serif tracking-wide uppercase"
                style={{ color: "hsl(42, 55%, 60%)" }}
              >
                Nearby
              </span>
              <span
                className="text-[9px] font-serif"
                style={{ color: "hsla(42, 40%, 55%, 0.6)" }}
              >
                · {nearbyTrees.length}
              </span>
            </div>
            {expanded ? (
              <ChevronUp
                className="w-3 h-3"
                style={{ color: "hsla(42, 40%, 55%, 0.5)" }}
              />
            ) : (
              <ChevronDown
                className="w-3 h-3"
                style={{ color: "hsla(42, 40%, 55%, 0.5)" }}
              />
            )}
          </button>

          {/* Tree list */}
          <div className="px-1 pb-1.5">
            <AnimatePresence mode="popLayout">
              {preview.map((tree, i) => (
                <motion.button
                  key={tree.id}
                  layout
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  onClick={() => handleSelect(tree)}
                  className="w-full text-left px-2 py-1.5 rounded-lg transition-colors hover:bg-white/5 flex items-center gap-2 group"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      background: "hsla(120, 30%, 18%, 0.6)",
                      border: "1px solid hsla(120, 35%, 35%, 0.3)",
                    }}
                  >
                    <TreeDeciduous
                      className="w-3 h-3"
                      style={{ color: "hsl(120, 45%, 55%)" }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[11px] font-serif truncate"
                      style={{ color: "hsl(42, 65%, 65%)" }}
                    >
                      {tree.name || tree.species}
                    </p>
                    <p
                      className="text-[9px] font-serif truncate"
                      style={{ color: "hsla(42, 40%, 50%, 0.6)" }}
                    >
                      {tree.species !== tree.name && tree.species
                        ? tree.species + " · "
                        : ""}
                      {formatDistance(tree.distanceKm)}
                    </p>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Dismiss */}
          {expanded && (
            <div className="px-3 pb-2">
              <button
                onClick={() => setDismissed(true)}
                className="w-full text-center py-1 text-[9px] font-serif transition-colors hover:text-muted-foreground/60"
                style={{ color: "hsla(42, 30%, 50%, 0.35)" }}
              >
                dismiss
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NearbyDiscoveryPanel;
