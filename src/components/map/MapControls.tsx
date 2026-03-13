/**
 * MapControls — bottom control bar extracted from LeafletFallbackMap.
 * Contains: Atlas Filter toggle, GroveView toggle, Mycelial toggle,
 * Atlas portal, Locate, Add Tree, Compass Reset, Clear View.
 */
import { memo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Eye,
  EyeOff,
  TreePine,
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
  setClearView: (fn: (v: boolean) => boolean) => void;
  atlasFilterOpen: boolean;
  setAtlasFilterOpen: (v: boolean) => void;
  groveViewActive: boolean;
  setGroveViewActive: (fn: (v: boolean) => boolean) => void;
  showMycelialNetwork: boolean;
  setShowMycelialNetwork: (fn: (v: boolean) => boolean) => void;
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
  setClearView,
  atlasFilterOpen,
  setAtlasFilterOpen,
  groveViewActive,
  setGroveViewActive,
  showMycelialNetwork,
  setShowMycelialNetwork,
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
      {/* Clear View toggle — always visible, right side */}
      <div
        className="absolute right-3 z-[1000]"
        style={{
          bottom:
            "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
        }}
      >
        <button
          onClick={() => setClearView((v) => !v)}
          className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 active:scale-90 glow-button`}
          style={{
            ...btnBase,
            color: clearView
              ? "hsl(200, 60%, 70%)"
              : "hsl(var(--muted-foreground) / 0.6)",
            background: clearView
              ? "hsla(200, 40%, 15%, 0.95)"
              : (btnBase.background as string),
            border: clearView
              ? "1px solid hsla(200, 50%, 50%, 0.4)"
              : (btnBase.border as string),
          }}
          title={clearView ? "Show controls" : "Clear view"}
          aria-label={
            clearView
              ? "Show map controls"
              : "Hide map controls for clear view"
          }
        >
          {clearView ? (
            <Eye className="w-[18px] h-[18px]" />
          ) : (
            <EyeOff className="w-[18px] h-[18px]" />
          )}
        </button>
      </div>

      {/* Left column — hidden in clear view */}
      {!clearView && (
        <div
          className="absolute left-3 z-[1000] flex flex-col-reverse gap-2"
          style={{
            bottom:
              "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
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
          {/* Secondary controls — hidden when atlas filter is open */}
          {!atlasFilterOpen && (
            <>
              <button
                onClick={() => setGroveViewActive((v) => !v)}
                className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-200 active:scale-90 ${
                  groveViewActive ? "glow-button--emerald" : ""
                } glow-button`}
                style={{
                  ...btnBase,
                  color: groveViewActive
                    ? "hsl(120, 55%, 65%)"
                    : "hsl(42, 60%, 60%)",
                  background: groveViewActive
                    ? "hsla(120, 30%, 12%, 0.95)"
                    : (btnBase.background as string),
                  border: groveViewActive
                    ? "1px solid hsla(120, 40%, 40%, 0.5)"
                    : (btnBase.border as string),
                }}
                title="Living Earth Mode"
              >
                <Eye className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                {groveViewActive && (
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
              <button
                onClick={() => setShowMycelialNetwork((v) => !v)}
                className={`relative flex items-center justify-center w-9 h-9 md:w-11 md:h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
                style={{
                  ...btnBase,
                  color: showMycelialNetwork
                    ? "hsl(178, 72%, 68%)"
                    : "hsl(42, 60%, 60%)",
                  border: showMycelialNetwork
                    ? "1px solid hsla(178, 65%, 55%, 0.5)"
                    : (btnBase.border as string),
                }}
                title="Toggle Mycelial Network"
                aria-label="Toggle Mycelial Network"
              >
                <TreePine className="w-4 h-4 md:w-[16px] md:h-[16px]" />
                {showMycelialNetwork && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{
                      background: "hsl(178, 72%, 62%)",
                      boxShadow: "0 0 6px hsla(178, 72%, 62%, 0.6)",
                    }}
                  />
                )}
              </button>
              <AtlasNavButton />
            </>
          )}
        </div>
      )}

      {/* Bottom center — hidden in clear view */}
      {!clearView && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1000] flex gap-2"
          style={{
            bottom:
              "calc(3.5rem + max(env(safe-area-inset-bottom, 0px), 8px) + 12px)",
          }}
        >
          <button
            onClick={onFindMe}
            disabled={locating}
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
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
            title={
              geoError ? `Location: ${geoError.message}` : "Locate me"
            }
          >
            {locating ? (
              <Loader2 className="w-[18px] h-[18px] animate-spin" />
            ) : (
              <Crosshair className="w-[18px] h-[18px]" />
            )}
          </button>
          {/* Add tree button — desktop only */}
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
            className={`flex items-center justify-center w-11 h-11 rounded-full transition-all duration-200 active:scale-90 glow-button`}
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
