/**
 * MapArrivalBanner — Contextual breadcrumb + accent strip shown at the top
 * of the map when arriving from a specific origin. Auto-dismisses after 5s.
 *
 * The arrival origin shapes both the label and the accent color,
 * reinforcing the story of how you entered.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TreePine, Globe, Layers, Flower2, Clock, Search, MapPin, Sparkles } from "lucide-react";
import type { ArrivalOrigin } from "@/hooks/use-map-focus";

interface ArrivalMeta {
  icon: React.ReactNode;
  label: string;
  /** HSL accent — matches semantic tokens where possible */
  accentHsl: string;
  feeling: string;
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
  },
  region: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "Watershed Descent",
    accentHsl: "200 50% 50%",
    feeling: "Landscape body",
  },
  county: {
    icon: <Layers className="w-3.5 h-3.5" />,
    label: "Local Watershed",
    accentHsl: "200 40% 45%",
    feeling: "Entering the fold",
  },
  hive: {
    icon: <Flower2 className="w-3.5 h-3.5" />,
    label: "Seasonal Current",
    accentHsl: "80 60% 45%",
    feeling: "Following fruit",
  },
  clock: {
    icon: <Clock className="w-3.5 h-3.5" />,
    label: "Time → Place",
    accentHsl: "30 60% 50%",
    feeling: "From season to soil",
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
};

interface MapArrivalBannerProps {
  arrival: ArrivalOrigin | null;
  contextLabel?: string;
}

export default function MapArrivalBanner({ arrival, contextLabel }: MapArrivalBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!arrival) {
      setVisible(false);
      return;
    }
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [arrival]);

  const profile = arrival ? ARRIVAL_PROFILES[arrival] : null;
  if (!profile) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute left-1/2 -translate-x-1/2 z-[25] pointer-events-none"
          style={{ top: "calc(env(safe-area-inset-top, 0px) + 4rem)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border"
            style={{
              background: `hsla(${profile.accentHsl} / 0.12)`,
              borderColor: `hsla(${profile.accentHsl} / 0.3)`,
              color: `hsl(${profile.accentHsl})`,
            }}
          >
            {profile.icon}
            <span className="font-serif text-[11px] tracking-wide">
              {contextLabel || profile.label}
            </span>
            <span className="text-[9px] opacity-60 font-serif italic hidden sm:inline">
              — {profile.feeling}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
