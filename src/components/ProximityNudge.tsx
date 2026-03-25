/**
 * ProximityNudge — app-level component that uses the Geolocation API
 * to detect when the user is near a mapped Ancient Friend or dreamed tree.
 * Renders a floating encounter card with rich visual presence.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuietMode } from "@/contexts/QuietModeContext";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous, Star, X, Sprout } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { usePopupGate } from "@/contexts/UIFlowContext";

interface NearbyResult {
  id: string;
  name: string;
  species: string;
  distanceM: number;
  isWished: boolean;
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const RADIUS_M = 500;
const CHECK_INTERVAL_MS = 60_000;
const DISMISS_KEY = "s33d_proximity_dismissed";

const ProximityNudge = () => {
  const popupsAllowed = usePopupGate();
  const [nearest, setNearest] = useState<NearbyResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastCheck = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  const isMapPage = location.pathname === "/map";

  const checkNearby = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastCheck.current < CHECK_INTERVAL_MS) return;
    lastCheck.current = now;

    const dismissedAt = sessionStorage.getItem(DISMISS_KEY);
    if (dismissedAt && now - parseInt(dismissedAt) < 30 * 60 * 1000) return;

    const { data: { user } } = await supabase.auth.getUser();

    const degLat = RADIUS_M / 110540;
    const degLng = RADIUS_M / (111320 * Math.cos((lat * Math.PI) / 180));

    const { data: trees } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .gte("latitude", lat - degLat)
      .lte("latitude", lat + degLat)
      .gte("longitude", lng - degLng)
      .lte("longitude", lng + degLng)
      .limit(50);

    if (!trees || trees.length === 0) {
      setNearest(null);
      return;
    }

    let wishedIds = new Set<string>();
    if (user) {
      const { data: wishes } = await supabase
        .from("tree_wishlist")
        .select("tree_id")
        .eq("user_id", user.id);
      if (wishes) {
        wishedIds = new Set(wishes.map(w => w.tree_id));
      }
    }

    let best: NearbyResult | null = null;
    for (const t of trees) {
      if (!t.latitude || !t.longitude) continue;
      const dist = haversineM(lat, lng, t.latitude, t.longitude);
      if (dist > RADIUS_M) continue;

      const candidate: NearbyResult = {
        id: t.id,
        name: t.name || "Unnamed Tree",
        species: t.species || "Unknown",
        distanceM: dist,
        isWished: wishedIds.has(t.id),
      };

      if (!best || (candidate.isWished && !best.isWished) || (candidate.isWished === best.isWished && dist < best.distanceM)) {
        best = candidate;
      }
    }

    setNearest(best);
  }, []);

  useEffect(() => {
    if (isMapPage || !("geolocation" in navigator)) return;

    const startWatchIfGranted = async () => {
      try {
        const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
        if (perm.state !== "granted") return;

        watchId.current = navigator.geolocation.watchPosition(
          (pos) => checkNearby(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
        );
      } catch {
        // permissions API not supported
      }
    };

    startWatchIfGranted();

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [isMapPage, checkNearby]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleTap = () => {
    if (nearest) navigate(`/tree/${encodeURIComponent(nearest.id)}`);
    handleDismiss();
  };

  if (!popupsAllowed || isMapPage || dismissed || !nearest) return null;

  const distLabel = nearest.distanceM < 1000
    ? `${Math.round(nearest.distanceM)}m away`
    : `${(nearest.distanceM / 1000).toFixed(1)}km away`;

  const inPlantingRange = nearest.distanceM <= 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed left-3 right-3 mx-auto z-[90] max-w-sm"
        style={{ bottom: "calc(4.5rem + max(env(safe-area-inset-bottom, 0px), 8px))" }}
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 280, damping: 28 }}
      >
        <div
          className="w-full rounded-2xl overflow-hidden text-left"
          style={{
            background: "linear-gradient(160deg, hsl(120 18% 14%), hsl(30 14% 12%))",
            border: nearest.isWished
              ? "1px solid hsl(42 65% 55% / 0.45)"
              : "1px solid hsl(42 55% 45% / 0.3)",
            boxShadow: "0 8px 32px -8px hsl(0 0% 0% / 0.55), inset 0 1px 0 hsl(42 55% 45% / 0.06)",
          }}
        >
          {/* Gold accent line */}
          <div
            className="h-[2px]"
            style={{
              background: nearest.isWished
                ? "linear-gradient(90deg, transparent 5%, hsl(42 70% 55% / 0.6) 30%, hsl(42 70% 55% / 0.7) 50%, hsl(42 70% 55% / 0.6) 70%, transparent 95%)"
                : "linear-gradient(90deg, transparent 5%, hsl(42 55% 45% / 0.4) 30%, hsl(42 55% 45% / 0.55) 50%, hsl(42 55% 45% / 0.4) 70%, transparent 95%)",
            }}
          />

          {/* Top label */}
          <div className="px-4 pt-3 pb-0">
            <p
              className="text-[9px] font-serif uppercase tracking-[0.14em]"
              style={{ color: "hsl(42 50% 55% / 0.7)" }}
            >
              {nearest.isWished ? "✦ Wished Tree Nearby" : inPlantingRange ? "Planting Range Reached" : "Nearby Ancient Friend"}
            </p>
          </div>

          <div
            onClick={handleTap}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-3.5 px-4 py-3">
              {/* Icon with heartbeat glow */}
              <motion.div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "radial-gradient(circle, hsl(42 60% 50% / 0.1), transparent 70%)",
                  border: "1px solid hsl(42 55% 45% / 0.2)",
                }}
                animate={{
                  boxShadow: [
                    "0 0 0 0 hsl(42 60% 50% / 0.04)",
                    "0 0 14px 3px hsl(42 60% 50% / 0.1)",
                    "0 0 0 0 hsl(42 60% 50% / 0.04)",
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {nearest.isWished ? (
                  <Star className="w-4.5 h-4.5" style={{ color: "hsl(42 60% 55%)", fill: "hsl(42 60% 55% / 0.25)" }} />
                ) : inPlantingRange ? (
                  <Sprout className="w-4.5 h-4.5" style={{ color: "hsl(42 60% 55%)" }} />
                ) : (
                  <TreeDeciduous className="w-4.5 h-4.5" style={{ color: "hsl(42 60% 55%)" }} />
                )}
              </motion.div>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-serif font-medium leading-snug"
                  style={{ color: "hsl(40 30% 88%)" }}
                >
                  {nearest.isWished
                    ? "A wished tree is within reach"
                    : inPlantingRange
                    ? "You're close enough to plant a seed here."
                    : "An Ancient Friend is nearby"
                  }
                </p>
                <p
                  className="text-[11px] font-serif mt-0.5 leading-snug"
                  style={{ color: "hsl(35 18% 60% / 0.7)" }}
                >
                  {nearest.name} · {nearest.species} · {distLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Dismiss */}
          <button
            className="absolute top-2.5 right-2.5 p-1.5 rounded-full transition-colors hover:bg-white/5"
            onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
          >
            <X className="w-3.5 h-3.5" style={{ color: "hsl(42 20% 60% / 0.4)" }} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProximityNudge;
