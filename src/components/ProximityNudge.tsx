/**
 * ProximityNudge — app-level component that uses the Geolocation API
 * to detect when the user is near a mapped Ancient Friend or wished tree.
 * Renders a floating notification pill.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreeDeciduous, Star, X, Navigation } from "lucide-react";
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
const CHECK_INTERVAL_MS = 60_000; // check every 60s
const DISMISS_KEY = "s33d_proximity_dismissed";

const ProximityNudge = () => {
  const popupsAllowed = usePopupGate();
  const [nearest, setNearest] = useState<NearbyResult | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const watchId = useRef<number | null>(null);
  const lastCheck = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show on map page (map has its own nudges)
  const isMapPage = location.pathname === "/map";

  const checkNearby = useCallback(async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastCheck.current < CHECK_INTERVAL_MS) return;
    lastCheck.current = now;

    // Check session dismissal
    const dismissedAt = sessionStorage.getItem(DISMISS_KEY);
    if (dismissedAt && now - parseInt(dismissedAt) < 30 * 60 * 1000) return;

    const { data: { user } } = await supabase.auth.getUser();

    // Bounding box query
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

    // Get user's wishlist for highlighting
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

    // Find closest
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

      // Prioritize wished trees, then closest
      if (!best || (candidate.isWished && !best.isWished) || (candidate.isWished === best.isWished && dist < best.distanceM)) {
        best = candidate;
      }
    }

    setNearest(best);
  }, []);

  useEffect(() => {
    if (isMapPage || !("geolocation" in navigator)) return;

    // Use watchPosition for continuous monitoring
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => checkNearby(pos.coords.latitude, pos.coords.longitude),
      () => {}, // silently fail
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
    );

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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 mx-auto z-[90] max-w-sm"
        initial={{ y: 60, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <button
          onClick={handleTap}
          className="w-full rounded-2xl border bg-card/95 backdrop-blur-lg shadow-xl overflow-hidden text-left"
          style={{ borderColor: nearest.isWished ? "hsl(var(--accent) / 0.4)" : "hsl(var(--border))" }}
        >
          <div
            className="h-0.5"
            style={{
              background: nearest.isWished
                ? "linear-gradient(90deg, transparent, hsl(var(--accent) / 0.5), transparent)"
                : "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.4), transparent)",
            }}
          />
          <div className="flex items-center gap-3 px-4 py-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
              style={{
                background: nearest.isWished
                  ? "hsl(var(--accent) / 0.15)"
                  : "hsl(var(--primary) / 0.15)",
                borderColor: nearest.isWished
                  ? "hsl(var(--accent) / 0.25)"
                  : "hsl(var(--primary) / 0.25)",
              }}
            >
              {nearest.isWished ? (
                <Star className="w-4 h-4 text-accent fill-accent/30" />
              ) : (
                <TreeDeciduous className="w-4 h-4 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-serif text-foreground truncate">
                {nearest.isWished ? "🌟 A wished tree is nearby!" : "An Ancient Friend is nearby"}
              </p>
              <p className="text-[10px] text-muted-foreground font-serif">
                {nearest.name} · {nearest.species} · {distLabel}
              </p>
            </div>

            <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />

            <button
              className="p-1 text-muted-foreground/50 hover:text-foreground shrink-0"
              onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProximityNudge;
