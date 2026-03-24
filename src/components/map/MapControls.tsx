/**
 * MapControls — bottom control bar extracted from LeafletFallbackMap.
 * Single Eye toggle as master visibility control.
 * Contains: Atlas Filter toggle, Atlas portal, Locate, Add Tree, Compass Reset.
 */
import { memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Eye,
  EyeOff,
  Globe,
  Plus,
  Loader2,
  Crosshair,
} from "lucide-react";
import type { VisualLayerSection } from "@/components/AtlasFilter";

const btnBase: React.CSSProperties = {
  background: "hsla(30, 30%, 12%, 0.92)",
  border: "1px solid hsla(42, 40%, 30%, 0.5)",
  backdropFilter: "blur(6px)",
};
const BTN_GLOW_CLASS = "glow-button";

/* ── Globe‐on‐Book SVG ── */
const GlobeOnBookIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="9" r="6" />
    <ellipse cx="12" cy="9" rx="2.4" ry="6" />
    <line x1="6" y1="9" x2="18" y2="9" />
    <path d="M4 20 C4 18, 8 17.5, 12 18.5 C16 17.5, 20 18, 20 20" />
    <line x1="12" y1="18.5" x2="12" y2="21" />
    <path d="M4 20 C4 21, 8 21.5, 12 21" />
    <path d="M20 20 C20 21, 16 21.5, 12 21" />
  </svg>
);

/* ── Atlas nav button ── */
function AtlasNavButton() {
  const navigate = useNavigate();
  const guardRef = useRef(false);
  const handleClick = useCallback(() => {
    if (guardRef.current) return;
    guardRef.current = true;
    try {
      navigate("/atlas");
    } catch {
      /* silent */
    }
    setTimeout(() => {
      guardRef.current = false;
    }, 400);
  }, [navigate]);
  return (
    <button
      onClick={handleClick}
      className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${BTN_GLOW_CLASS}`}
      style={{ ...btnBase, color: "hsl(42, 60%, 60%)" }}
      title="World Atlas"
      aria-label="Open World Atlas"
    >
      <GlobeOnBookIcon className="w-[18px] h-[18px]" />
    </button>
  );
}

export interface MapControlsProps {
  perspective: string;
  clearView: boolean;
  onEyeToggle: () => void;
  atlasFilterOpen: boolean;
  setAtlasFilterOpen: (v: boolean) => void;
  locating: boolean;
  located: boolean;
  geoError: GeolocationPositionError | null;
  onFindMe: () => void;
  onCompassReset: () => void;
  onAddTree: () => void;
  visualSections: VisualLayerSection[];
  species: string[];
  ageBand: string;
  girthBand: string;
  lineageFilter: string;
  projectFilter: string;
}

const MapControls = memo(function MapControls({
  perspective,
  clearView,
  onEyeToggle,
  atlasFilterOpen,
  setAtlasFilterOpen,
  locating,
  located,
  geoError,
  onFindMe,
  onCompassReset,
  onAddTree,
  visualSections,
  species,
  ageBand,
  girthBand,
  lineageFilter,
  projectFilter,
}: MapControlsProps) {
  const modeAccent =
    perspective === "personal"
      ? "120, 50%, 45%"
      : perspective === "tribe"
      ? "200, 55%, 50%"
      : "42, 90%, 55%";
  const addEmphasis = perspective === "personal";
  const globeEmphasis = perspective === "collective";
  const overlaysOn = !clearView;

  const activeLayers = visualSections.reduce(
    (s, sec) => s + sec.layers.filter((l) => l.active).length,
    0
  );
  const totalActive =
    activeLayers +
    (species.length > 0 ? 1 : 0) +
    (ageBand !== "all" ? 1 : 0) +
    (girthBand !== "all" ? 1 : 0) +
    (lineageFilter !== "all" ? 1 : 0) +
    (projectFilter !== "all" ? 1 : 0);

  return (
    <>
      {/* Master Eye toggle — always visible, bottom-right */}
      <div
        className="absolute right-3 z-[1000]"
        style={{
          bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
        }}
      >
        <button
          onClick={onEyeToggle}
          className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 active:scale-90 glow-button"
          style={{
            ...btnBase,
            color: overlaysOn
              ? "hsl(120, 55%, 65%)"
              : "hsl(var(--muted-foreground) / 0.6)",
            background: overlaysOn
              ? "hsla(120, 30%, 12%, 0.95)"
              : (btnBase.background as string),
            border: overlaysOn
              ? "1px solid hsla(120, 40%, 40%, 0.5)"
              : (btnBase.border as string),
          }}
          title={overlaysOn ? "Hide overlays" : "Show overlays"}
          aria-label={overlaysOn ? "Hide map overlays" : "Show map overlays"}
        >
          {overlaysOn ? (
            <Eye className="w-[18px] h-[18px]" />
          ) : (
            <EyeOff className="w-[18px] h-[18px]" />
          )}
          {overlaysOn && (
            <span
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{
                background: "hsl(120, 55%, 50%)",
                boxShadow: "0 0 6px hsla(120, 55%, 50%, 0.6)",
                animation: "ancientGlow 3s ease-in-out infinite",
              }}
            />
          )}
        </button>
      </div>

      {/* Left column — hidden in clear view */}
      {!clearView && (
        <div
          className="absolute left-3 z-[1000] flex flex-col-reverse gap-2"
          style={{
            bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
          }}
        >
          <button
            onClick={() => setAtlasFilterOpen(!atlasFilterOpen)}
            className={`relative flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${
              atlasFilterOpen ? "glow-button--emerald" : ""
            } glow-button`}
            style={{
              ...btnBase,
              color: atlasFilterOpen
                ? `hsl(${modeAccent})`
                : "hsl(42, 60%, 60%)",
              background: atlasFilterOpen
                ? `hsla(${modeAccent.split(",")[0]}, 50%, 20%, 0.95)`
                : (btnBase.background as string),
            }}
            title="Filters & Layers"
          >
            <Layers className="w-[18px] h-[18px]" />
            {totalActive > 0 && (
              <span
                className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[9px] font-bold"
                style={{
                  background: `hsl(${modeAccent})`,
                  color: "hsl(30, 20%, 10%)",
                  boxShadow: `0 0 6px hsla(${modeAccent}, 0.4)`,
                }}
              >
                {totalActive}
              </span>
            )}
          </button>
          {!atlasFilterOpen && <AtlasNavButton />}
        </div>
      )}

      {/* Bottom center — hidden in clear view */}
      {!clearView && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1000] flex gap-2"
          style={{
            bottom: "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
          }}
        >
          <button
            onClick={onFindMe}
            disabled={locating}
            className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button"
            style={{
              ...btnBase,
              color: locating
                ? "hsl(42, 40%, 45%)"
                : geoError
                ? "hsl(0, 50%, 55%)"
                : located
                ? `hsl(${modeAccent})`
                : "hsl(42, 60%, 60%)",
            }}
            title={geoError ? `Location: ${geoError.message}` : "Locate me"}
          >
            {locating ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Crosshair className="w-[18px] h-[18px]" />
            )}
          </button>
          <button
            onClick={onAddTree}
            className={`hidden md:flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 ${
              addEmphasis ? "glow-button--emerald" : ""
            } glow-button`}
            style={{
              ...btnBase,
              color: addEmphasis
                ? `hsl(${modeAccent})`
                : "hsl(120, 50%, 55%)",
            }}
            title="Add tree"
          >
            <Plus className="w-[18px] h-[18px]" />
          </button>
          <button
            onClick={onCompassReset}
            className="flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button"
            style={{
              ...btnBase,
              color: globeEmphasis
                ? `hsl(${modeAccent})`
                : "hsl(42, 60%, 60%)",
            }}
            title="Reset view"
          >
            <Globe className="w-[18px] h-[18px]" />
          </button>
        </div>
      )}
    </>
  );
});

export default MapControls;
