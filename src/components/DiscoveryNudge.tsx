/**
 * DiscoveryNudge — prompts user to create a new Ancient Friend
 * when they're far from any existing tree in the atlas.
 *
 * Triggers in two contexts:
 * 1. Map "Locate Me" when no trees within 500m
 * 2. Co-witness session start when tree_id is new/far
 *
 * Usage: <DiscoveryNudge lat={...} lng={...} onCreateTree={...} />
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Plus, X, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface DiscoveryNudgeProps {
  lat: number;
  lng: number;
  /** Called when user wants to create a new tree */
  onCreateTree: () => void;
  /** Radius in meters to check for existing trees */
  radiusM?: number;
  /** Optional: suppress nudge */
  disabled?: boolean;
}

const DISMISS_KEY = "s33d_discovery_nudge_dismissed";

export default function DiscoveryNudge({
  lat,
  lng,
  onCreateTree,
  radiusM = 500,
  disabled = false,
}: DiscoveryNudgeProps) {
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (disabled || !lat || !lng) return;
    // Don't show if dismissed in this session
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    let cancelled = false;
    setChecking(true);

    async function check() {
      try {
        // Simple bounding box check (~500m ≈ 0.0045°)
        const delta = radiusM / 111000;
        const { count } = await supabase
          .from("trees")
          .select("id", { count: "exact", head: true })
          .gte("latitude", lat - delta)
          .lte("latitude", lat + delta)
          .gte("longitude", lng - delta)
          .lte("longitude", lng + delta);

        if (!cancelled && (count === 0 || count === null)) {
          setShow(true);
        }
      } catch {
        // Silent
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    check();
    return () => { cancelled = true; };
  }, [lat, lng, radiusM, disabled]);

  const dismiss = useCallback(() => {
    setShow(false);
    sessionStorage.setItem(DISMISS_KEY, "1");
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md overflow-hidden shadow-lg"
        >
          <div className="px-4 py-3.5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Compass className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-serif text-foreground tracking-wide">
                    Uncharted territory
                  </p>
                  <p className="text-[10px] text-muted-foreground font-serif">
                    No Ancient Friends nearby
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground/70 font-serif leading-relaxed">
              You're standing somewhere no tree has been mapped yet.
              Would you like to be the first to discover an Ancient Friend here?
            </p>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  onCreateTree();
                  dismiss();
                }}
                size="sm"
                className="flex-1 gap-2 font-serif text-xs tracking-wider"
              >
                <TreeDeciduous className="w-3.5 h-3.5" />
                Map a New Tree
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismiss}
                className="font-serif text-xs text-muted-foreground"
              >
                Not now
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
