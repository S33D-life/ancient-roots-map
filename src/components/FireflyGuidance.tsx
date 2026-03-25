/**
 * FireflyGuidance — Contextual whispers from TEOTAG's guiding orb.
 * Shows route-aware, gentle guidance messages near the Firefly FAB.
 * Messages fade in/out and respond to current page context.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSeedEconomy } from "@/hooks/use-seed-economy";
import { useSeasonalSummary } from "@/hooks/use-seasonal-summary";
import { Leaf } from "lucide-react";
import { useQuietMode } from "@/contexts/QuietModeContext";

interface GuidanceMessage {
  text: string;
  icon?: string;
}

const ROUTE_GUIDANCE: Record<string, GuidanceMessage[]> = {
  "/": [
    { text: "The grove stirs with life today…", icon: "🌿" },
    { text: "Every wanderer begins with a single step.", icon: "🦶" },
    { text: "Ancient Friends are waiting to be discovered.", icon: "🌳" },
  ],
  "/map": [
    { text: "An Ancient Friend may stand nearby.", icon: "🗺️" },
    { text: "The forest reveals itself to those who wander.", icon: "🌲" },
    { text: "Tap a tree to hear its story.", icon: "🍃" },
  ],
  "/add-tree": [
    { text: "Every tree mapped strengthens the grove.", icon: "📍" },
    { text: "Take your time — the forest is patient.", icon: "🌱" },
  ],
  "/whispers": [
    { text: "Whispers travel through roots and wind.", icon: "🌬️" },
    { text: "Words left for trees become part of the grove.", icon: "💌" },
  ],
  "/library": [
    { text: "The library holds the grove's shared memory.", icon: "📖" },
    { text: "Every offering becomes part of the living record.", icon: "🕯️" },
  ],
  "/hive": [
    { text: "Species families form the heartwood of TETOL.", icon: "🐝" },
    { text: "Explore the hive to find kindred trees.", icon: "🍯" },
  ],
  "/value-tree": [
    { text: "Hearts flow through the ecosystem like sap.", icon: "❤️" },
    { text: "Every contribution strengthens the canopy.", icon: "🌿" },
  ],
};

const SEED_GUIDANCE: GuidanceMessage[] = [
  { text: "Seeds planted today bloom into tomorrow's hearts.", icon: "🌱" },
  { text: "Plant seeds near the trees you love.", icon: "🫘" },
];

const LOW_SEED_GUIDANCE: GuidanceMessage[] = [
  { text: "A few seeds remain — choose wisely.", icon: "🌾" },
];

const NO_SEED_GUIDANCE: GuidanceMessage[] = [
  { text: "Your seeds rest until dawn. Return tomorrow.", icon: "🌙" },
];

const SEASONAL_GUIDANCE: Record<string, GuidanceMessage[]> = {
  spring: [
    { text: "Apple blossom season has begun…", icon: "🌸" },
    { text: "Early harvests are stirring in the grove.", icon: "🌱" },
  ],
  summer: [
    { text: "The canopy is full and alive.", icon: "☀️" },
    { text: "Fruits are ripening across the grove.", icon: "🍎" },
  ],
  autumn: [
    { text: "Seeds are falling — time to gather.", icon: "🍂" },
    { text: "The harvest is at its peak.", icon: "🌰" },
  ],
  winter: [
    { text: "The grove rests beneath frost.", icon: "❄️" },
    { text: "Evergreen friends hold the quiet watch.", icon: "🌲" },
  ],
};

interface FireflyGuidanceProps {
  fabPosition: { x: number; y: number };
  visible: boolean;
}

const FireflyGuidance = ({ fabPosition, visible }: FireflyGuidanceProps) => {
  const location = useLocation();
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<GuidanceMessage | null>(null);
  const [showing, setShowing] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { seedsRemaining } = useSeedEconomy(userId);
  const seasonal = useSeasonalSummary();

  const pickMessage = useCallback((): GuidanceMessage | null => {
    // Seed-aware guidance
    if (userId && seedsRemaining === 0) {
      return NO_SEED_GUIDANCE[Math.floor(Math.random() * NO_SEED_GUIDANCE.length)];
    }
    if (userId && seedsRemaining <= 5 && Math.random() < 0.4) {
      return LOW_SEED_GUIDANCE[Math.floor(Math.random() * LOW_SEED_GUIDANCE.length)];
    }
    if (userId && Math.random() < 0.25) {
      return SEED_GUIDANCE[Math.floor(Math.random() * SEED_GUIDANCE.length)];
    }

    // Seasonal lens whispers — 30% chance when active
    if (seasonal.active && seasonal.season && Math.random() < 0.3) {
      const pool = SEASONAL_GUIDANCE[seasonal.season];
      if (pool?.length) return pool[Math.floor(Math.random() * pool.length)];
    }

    // Route-based
    const path = location.pathname;
    const routeKey = Object.keys(ROUTE_GUIDANCE).find(k =>
      k === "/" ? path === "/" : path.startsWith(k)
    );
    const pool = routeKey ? ROUTE_GUIDANCE[routeKey] : ROUTE_GUIDANCE["/"];
    return pool[Math.floor(Math.random() * pool.length)];
  }, [location.pathname, userId, seedsRemaining, seasonal]);

  // Show a guidance whisper periodically
  useEffect(() => {
    if (!visible) {
      setShowing(false);
      return;
    }

    const showGuidance = () => {
      const msg = pickMessage();
      if (!msg) return;
      setMessage(msg);
      setFading(false);
      setShowing(true);

      // Auto-dismiss after 5s
      setTimeout(() => {
        setFading(true);
        setTimeout(() => setShowing(false), 400);
      }, 5000);
    };

    // Initial delay
    const initialTimer = setTimeout(showGuidance, 8000);

    // Repeat every 45-60s
    const interval = setInterval(showGuidance, 45000 + Math.random() * 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [visible, pickMessage]);

  // Reset on route change
  useEffect(() => {
    setShowing(false);
  }, [location.pathname]);

  const { showTeotagWhispers } = useQuietMode();

  if (!showing || !message || !showTeotagWhispers) return null;

  // Position whisper bubble near the FAB
  const isRight = fabPosition.x > window.innerWidth / 2;
  const bubbleStyle: React.CSSProperties = {
    position: "fixed",
    top: fabPosition.y - 8,
    ...(isRight
      ? { right: window.innerWidth - fabPosition.x + 8 }
      : { left: fabPosition.x + 52 }),
    zIndex: 64,
    maxWidth: 220,
    transform: "translateY(-100%)",
  };

  return (
    <div
      style={bubbleStyle}
      className={`transition-all duration-400 ${fading ? "opacity-0 translate-y-2" : "opacity-100 animate-fade-in"}`}
    >
      <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-2xl px-3.5 py-2.5 shadow-lg">
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0">{message.icon || "✦"}</span>
          <p className="text-[11px] font-serif text-foreground/75 leading-relaxed italic">
            {message.text}
          </p>
        </div>
        <p className="text-[8px] text-muted-foreground/30 font-serif mt-1 text-right">
          — TEOTAG's orb
        </p>
      </div>
      {/* Speech tail pointing to FAB */}
      <div
        className="absolute bottom-[-5px] w-2.5 h-2.5 rotate-45 bg-card/95 border-r border-b border-primary/20"
        style={isRight ? { right: 8 } : { left: 8 }}
      />
    </div>
  );
};

export default FireflyGuidance;
