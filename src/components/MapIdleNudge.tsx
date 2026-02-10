import { useState, useEffect, useRef, useCallback } from "react";
import { Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NearbyTree {
  id: string;
  name: string;
  species: string;
  latitude: number;
  longitude: number;
  bearing: number;
  distKm: number;
}

interface MapIdleNudgeProps {
  trees: { id: string; name: string; species: string; latitude: number; longitude: number; description?: string }[];
  offeringCounts: Record<string, number>;
  mapCenter: { lat: number; lng: number } | null;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x = Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

const IDLE_MS = 15000;

const MapIdleNudge = ({ trees, offeringCounts, mapCenter }: MapIdleNudgeProps) => {
  const [nearest, setNearest] = useState<NearbyTree | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
    if (dismissed) return;
    timerRef.current = setTimeout(() => setVisible(true), IDLE_MS);
  }, [dismissed]);

  // Listen for user interaction to reset idle
  useEffect(() => {
    const events = ["mousemove", "touchstart", "wheel", "keydown", "click"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetTimer]);

  // Find nearest storied tree when visible
  useEffect(() => {
    if (!visible || !mapCenter) return;

    const storied = trees.filter(t =>
      (offeringCounts[t.id] && offeringCounts[t.id] > 0) || (t.description && t.description.length > 20)
    );

    if (storied.length === 0) {
      setNearest(null);
      return;
    }

    let best: NearbyTree | null = null;
    for (const t of storied) {
      const dist = haversineKm(mapCenter.lat, mapCenter.lng, t.latitude, t.longitude);
      if (!best || dist < best.distKm) {
        best = {
          id: t.id,
          name: t.name,
          species: t.species,
          latitude: t.latitude,
          longitude: t.longitude,
          bearing: bearing(mapCenter.lat, mapCenter.lng, t.latitude, t.longitude),
          distKm: dist,
        };
      }
    }
    setNearest(best);
  }, [visible, mapCenter, trees, offeringCounts]);

  const handleClick = () => {
    if (nearest) navigate(`/tree/${encodeURIComponent(nearest.id)}`);
    setDismissed(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || !nearest) return null;

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer group"
      style={{
        background: 'linear-gradient(135deg, hsla(30, 35%, 12%, 0.92), hsla(25, 30%, 8%, 0.95))',
        border: '1px solid hsla(42, 55%, 40%, 0.35)',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 4px 24px hsla(0, 0%, 0%, 0.4), 0 0 12px hsla(42, 70%, 45%, 0.1)',
        animation: 'nudgeFadeIn 0.8s ease-out, nudgeFloat 4s ease-in-out 0.8s infinite',
      }}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-full shrink-0"
        style={{
          background: 'radial-gradient(circle, hsla(42, 80%, 50%, 0.2), hsla(120, 40%, 20%, 0.3))',
          border: '1.5px solid hsla(42, 70%, 50%, 0.4)',
        }}
      >
        <Compass
          className="w-4 h-4"
          style={{
            color: 'hsl(42, 80%, 60%)',
            transform: `rotate(${nearest.bearing}deg)`,
            transition: 'transform 0.5s ease',
          }}
        />
      </div>

      <div className="text-left">
        <p className="font-serif text-xs" style={{ color: 'hsla(42, 60%, 65%, 0.9)' }}>
          An ancient friend waits nearby…
        </p>
        <p className="font-serif text-[10px] mt-0.5" style={{ color: 'hsla(42, 40%, 55%, 0.6)' }}>
          {nearest.name} · {nearest.distKm < 1 ? `${Math.round(nearest.distKm * 1000)}m` : `${nearest.distKm.toFixed(1)}km`} {getCardinal(nearest.bearing)}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="ml-1 text-xs opacity-40 hover:opacity-80 transition-opacity"
        style={{ color: 'hsl(42, 40%, 55%)' }}
        aria-label="Dismiss"
      >
        ✕
      </button>

      <style>{`
        @keyframes nudgeFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(12px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes nudgeFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </button>
  );
};

function getCardinal(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return dirs[Math.round(deg / 45) % 8];
}

export default MapIdleNudge;
