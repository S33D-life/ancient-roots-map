/**
 * MapGatewayToggle — A floating perspective pill that switches between
 * Countries, Hives (species clusters), and Bioregions views.
 *
 * This is a *layered interpretation* toggle — it changes how the map
 * emphasises data, not the base map itself.
 */
import { memo, useState, useEffect } from "react";
import { Globe, Hexagon, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export type GatewayMode = "countries" | "hives" | "bioregions";

const MODES: { key: GatewayMode; label: string; icon: typeof Globe; hint: string }[] = [
  { key: "countries", label: "Countries", icon: Globe, hint: "Explore by nation and atlas" },
  { key: "hives", label: "Hives", icon: Hexagon, hint: "Discover species clusters" },
  { key: "bioregions", label: "Bioregions", icon: Leaf, hint: "View ecological regions" },
];

interface MapGatewayToggleProps {
  mode: GatewayMode;
  onChange: (mode: GatewayMode) => void;
  className?: string;
}

const MapGatewayToggle = memo(function MapGatewayToggle({
  mode,
  onChange,
  className,
}: MapGatewayToggleProps) {
  const [showHint, setShowHint] = useState(true);

  // Auto-hide hint after 6 seconds
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  // Show hint briefly when mode changes
  useEffect(() => {
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(t);
  }, [mode]);

  const active = MODES.find((m) => m.key === mode) || MODES[0];

  return (
    <div className={cn("flex flex-col items-center gap-1.5 pointer-events-auto", className)}>
      {/* Toggle pill */}
      <div
        className="flex items-center gap-0.5 rounded-full p-0.5"
        style={{
          background: "hsla(30, 30%, 10%, 0.88)",
          border: "1px solid hsla(42, 40%, 30%, 0.4)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px hsla(0, 0%, 0%, 0.35)",
        }}
      >
        {MODES.map(({ key, label, icon: Icon }) => {
          const isActive = key === mode;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-serif transition-all duration-300 touch-manipulation min-h-[36px]",
                isActive
                  ? "shadow-sm"
                  : "hover:bg-[hsla(42,30%,30%,0.2)]"
              )}
              style={
                isActive
                  ? {
                      background:
                        key === "countries"
                          ? "hsla(42, 50%, 20%, 0.9)"
                          : key === "hives"
                          ? "hsla(30, 45%, 18%, 0.9)"
                          : "hsla(140, 30%, 16%, 0.9)",
                      color:
                        key === "countries"
                          ? "hsl(42, 70%, 65%)"
                          : key === "hives"
                          ? "hsl(30, 65%, 65%)"
                          : "hsl(140, 50%, 65%)",
                      border:
                        key === "countries"
                          ? "1px solid hsla(42, 50%, 45%, 0.4)"
                          : key === "hives"
                          ? "1px solid hsla(30, 50%, 45%, 0.4)"
                          : "1px solid hsla(140, 40%, 40%, 0.4)",
                    }
                  : {
                      color: "hsla(42, 30%, 60%, 0.7)",
                      border: "1px solid transparent",
                    }
              }
              aria-label={`View by ${label}`}
              aria-pressed={isActive}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual hint */}
      <div
        className={cn(
          "px-3 py-1 rounded-full font-serif text-[10px] transition-all duration-500",
          showHint ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1 pointer-events-none"
        )}
        style={{
          background: "hsla(30, 25%, 10%, 0.75)",
          color: "hsla(42, 40%, 65%, 0.8)",
          backdropFilter: "blur(8px)",
        }}
      >
        {active.hint}
      </div>
    </div>
  );
});

export default MapGatewayToggle;
