import { createContext, useContext, useMemo } from "react";
import { useLocation } from "react-router-dom";

export type TetolLevel = "s33d" | "roots" | "heartwood" | "canopy" | "crown" | "hearth";

interface TetolLevelInfo {
  level: TetolLevel;
  label: string;
  subtitle: string;
  /** CSS class applied to the page wrapper for level-themed accents */
  className: string;
}

const LEVEL_MAP: Record<TetolLevel, Omit<TetolLevelInfo, "level" | "className">> = {
  s33d: { label: "S33D", subtitle: "The seed of all journeys" },
  roots: { label: "The Roots", subtitle: "Ancient Friends Atlas" },
  heartwood: { label: "The Heartwood", subtitle: "HeARTwood Library" },
  canopy: { label: "The Canopy", subtitle: "Council of Life" },
  crown: { label: "The Crown", subtitle: "yOur Golden Dream" },
  hearth: { label: "The Hearth", subtitle: "Your personal fire" },
};

function routeToLevel(pathname: string): TetolLevel {
  if (pathname.startsWith("/map") || pathname.startsWith("/tree") || pathname.startsWith("/groves")) return "roots";
  if (pathname.startsWith("/library") || pathname.startsWith("/gallery")) return "heartwood";
  if (pathname.startsWith("/council")) return "canopy";
  if (pathname.startsWith("/golden-dream")) return "crown";
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return "hearth";
  return "s33d";
}

const TetolLevelContext = createContext<TetolLevelInfo>({
  level: "s33d",
  label: "S33D",
  subtitle: "The seed of all journeys",
  className: "tetol-s33d",
});

export const useTetolLevel = () => useContext(TetolLevelContext);

export const TetolLevelProvider = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation();

  const info = useMemo<TetolLevelInfo>(() => {
    const level = routeToLevel(pathname);
    const meta = LEVEL_MAP[level];
    return { level, ...meta, className: `tetol-${level}` };
  }, [pathname]);

  return (
    <TetolLevelContext.Provider value={info}>
      <div className={info.className}>
        {children}
      </div>
    </TetolLevelContext.Provider>
  );
};
