/**
 * MapArrivalBanner — Contextual breadcrumb + accent strip shown at the top
 * of the map when arriving from a specific origin. Auto-dismisses after 6s.
 * Tapping the banner navigates back to the origin context.
 */
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Globe, Layers, Flower2, Clock, Search, MapPin, Sparkles, ArrowLeft } from "lucide-react";
import type { ArrivalOrigin } from "@/hooks/use-map-focus";

interface ArrivalMeta {
  icon: React.ReactNode;
  label: string;
  /** HSL accent — matches semantic tokens where possible */
  accentHsl: string;
  feeling: string;
  /** Route to return to (null = no return action) */
  returnTo?: string;
  returnLabel?: string;
}

const ARRIVAL_PROFILES: Record<ArrivalOrigin, ArrivalMeta> = {
  tree: {
    icon: <TreePine className="w-3.5 h-3.5" />,
    label: "Approaching a Guardian",
    accentHsl: "42 80% 55%",
    feeling: "Reverent descent",
  },
  country: {
    icon: <Globe className="w-3.5 h-3.5" />,
    label: "Entering a Realm",
    accentHsl: "160 50% 45%",
    feeling: "Territory sweep",
    returnTo: "/atlas",
    returnLabel: "Atlas",
  },
  region: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "Watershed Descent",
    accentHsl: "200 50% 50%",
    feeling: "Landscape body",
    returnTo: "/atlas",
    returnLabel: "Atlas",
  },
  county: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "Local Watershed",
    accentHsl: "200 40% 45%",
    feeling: "Entering the fold",
    returnTo: "/atlas",
    returnLabel: "Atlas",
  },
  hive: {
    icon: <Flower2 className="w-3.5 h-3.5" />,
    label: "Seasonal Current",
    accentHsl: "80 60% 45%",
    feeling: "Following fruit",
    returnTo: "/hives",
    returnLabel: "Hives",
  },
  clock: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Time → Place",
    accentHsl: "30 60% 50%",
    feeling: "From season to soil",
    returnTo: "/blooming-clock",
    returnLabel: "Clock",
  },
  search: {
    icon: <Search className="w-3.5 h-3.5" />,
    label: "Seeking",
    accentHsl: "42 50% 50%",
    feeling: "Intentional focus",
  },
  nearby: {
    icon: <MapPin className="w-3.5 h-3.5" />,
    label: "Awakening Locally",
    accentHsl: "120 40% 45%",
    feeling: "Discovery close to home",
  },
  featured: {
    icon: <Sparkles className="w-3.5 h-3.5" />,
    label: "Featured",
    accentHsl: "42 80% 55%",
    feeling: "Editorial highlight",
  },
  species: {
    icon: <Flower2 className="w-3.5 h-3.5" />,
    label: "Species Distribution",
    accentHsl: "80 50% 45%",
    feeling: "Following a species thread",
  },
  collection: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "Linked Trees",
    accentHsl: "30 50% 50%",
    feeling: "Connected records",
    returnTo: "/library",
    returnLabel: "Library",
  },
};

interface MapArrivalBannerProps {
  arrival: ArrivalOrigin | null;
  contextLabel?: string;
  /** Country slug for return-to-country deep link */
  countrySlug?: string;
  /** Hive slug for return-to-hive deep link */
  hiveSlug?: string;
}

export default function MapArrivalBanner({ arrival, contextLabel, countrySlug, hiveSlug }: MapArrivalBannerProps) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!arrival) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(timer);
  }, [arrival]);

  const profile = arrival ? ARRIVAL_PROFILES[arrival] : null;

  // Build dynamic return route based on context
  const returnRoute = useCallback(() => {
    if (!profile) return null;
    if (arrival === "country" && countrySlug) return `/atlas/${countrySlug}`;
    if (arrival === "hive" && hiveSlug) return `/hive/${hiveSlug}`;
    return profile.returnTo || null;
  }, [arrival, profile, countrySlug, hiveSlug]);

  const handleReturn = useCallback(() => {
    const route = returnRoute();
    if (route) {
      navigate(route);
    }
  }, [returnRoute, navigate]);

  if (!profile) return null;

  const canReturn = !!returnRoute();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute left-1/2 -translate-x-1/2 z-[25]"
          style={{
            top: "calc(env(safe-area-inset-top, 0px) + 4rem)",
            pointerEvents: canReturn ? "auto" : "none",
          }}
        >
          <button
            onClick={canReturn ? handleReturn : undefined}
            disabled={!canReturn}
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-transform active:scale-95 disabled:cursor-default"
            style={{
              background: `hsla(${profile.accentHsl} / 0.12)`,
              borderColor: `hsla(${profile.accentHsl} / 0.3)`,
              color: `hsl(${profile.accentHsl})`,
            }}
          >
            {canReturn && <ArrowLeft className="w-3 h-3 opacity-60" />}
            {profile.icon}
            <span className="font-serif text-[11px] tracking-wide">
              {contextLabel || profile.label}
            </span>
            <span className="text-[9px] opacity-60 font-serif italic hidden sm:inline">
              — {profile.feeling}
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
