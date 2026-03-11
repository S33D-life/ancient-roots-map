/**
 * TeotagContext — captures application state for context-aware TEOTAG intelligence.
 * Provides current route, map state, selected features, and library section
 * so TEOTAG can tailor its guidance to where the user is in the S33D world.
 */
import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useSeasonalLens } from "@/contexts/SeasonalLensContext";

export type TeotagMode = "guide" | "librarian" | "scribe" | "oracle";

export interface MapContext {
  center?: { lat: number; lng: number };
  zoom?: number;
  selectedTreeId?: string;
  selectedTreeName?: string;
  selectedTreeSpecies?: string;
  activeFilters?: string[];
  activeLayers?: string[];
  visibleTreeCount?: number;
}

export interface LibraryContext {
  section?: string; // e.g. "gallery", "music-room", "staff-room", "ledger"
  selectedBookTitle?: string;
  selectedBookAuthor?: string;
  selectedTreeId?: string;
}

export interface CouncilContext {
  activeCouncilSlug?: string;
  activeCouncilName?: string;
}

export interface TeotagContextValue {
  /** Auto-detected mode based on current route */
  activeMode: TeotagMode;
  /** Current route pathname */
  currentRoute: string;
  /** Map-specific context */
  mapContext: MapContext;
  setMapContext: (ctx: Partial<MapContext>) => void;
  /** Library-specific context */
  libraryContext: LibraryContext;
  setLibraryContext: (ctx: Partial<LibraryContext>) => void;
  /** Council-specific context */
  councilContext: CouncilContext;
  setCouncilContext: (ctx: Partial<CouncilContext>) => void;
  /** Build the context summary string for the AI prompt */
  buildContextSummary: () => string;
  /** Suggested quick actions based on current context */
  quickActions: QuickAction[];
}

export interface QuickAction {
  label: string;
  prompt: string;
  emoji: string;
}

const TeotagContext = createContext<TeotagContextValue | null>(null);

function detectMode(pathname: string): TeotagMode {
  if (pathname.startsWith("/map") || pathname.startsWith("/atlas") || pathname.startsWith("/hive")) return "guide";
  if (pathname.startsWith("/harvest")) return "guide"; // Harvest is place+season oriented
  if (pathname.startsWith("/cosmic")) return "guide"; // Calendar is rhythm-oriented
  if (pathname.startsWith("/library") || pathname.startsWith("/vault") || pathname.startsWith("/heartwood") || pathname.startsWith("/dashboard")) return "librarian";
  if (pathname.startsWith("/council")) return "scribe";
  return "guide";
}

function getQuickActions(mode: TeotagMode, mapCtx: MapContext, libraryCtx: LibraryContext, route: string, seasonalLens?: string | null): QuickAction[] {
  // Spring Lens overrides — prioritise spring-themed prompts
  if (seasonalLens === "spring") {
    return [
      { label: "What's blooming?", prompt: "What trees are flowering or blooming near me right now in spring?", emoji: "🌸" },
      { label: "Spring harvests", prompt: "What early spring harvests and produce are available nearby?", emoji: "🌱" },
      { label: "Planting season", prompt: "What should be planted this spring? Show me planting windows.", emoji: "🪴" },
      { label: "Blossom walks", prompt: "Suggest blossom walks and spring exploration routes near me.", emoji: "🥾" },
    ];
  }

  // Harvest-specific quick actions
  if (route.startsWith("/harvest")) {
    return [
      { label: "Harvests near me", prompt: "What harvests are happening near me this month?", emoji: "🍎" },
      { label: "Seasonal produce", prompt: "What tree produce is in season right now?", emoji: "🌿" },
      { label: "Find on map", prompt: "Show me harvest locations on the map.", emoji: "🗺️" },
      { label: "Blooming now", prompt: "What trees are flowering or fruiting this month?", emoji: "🌸" },
    ];
  }

  // Calendar-specific quick actions
  if (route.startsWith("/cosmic")) {
    return [
      { label: "What's happening now", prompt: "What seasonal events and harvests are happening this month?", emoji: "📅" },
      { label: "Upcoming harvests", prompt: "What harvests are coming up in the next few months?", emoji: "🍎" },
      { label: "Blooming cycles", prompt: "What is blooming or fruiting right now across the atlas?", emoji: "🌸" },
      { label: "Next gathering", prompt: "When is the next Council of Life gathering?", emoji: "🍃" },
    ];
  }

  if (mode === "guide") {
    const actions: QuickAction[] = [
      { label: "Nearby features", prompt: "What interesting features are near the current map view?", emoji: "🗺️" },
      { label: "Walking routes", prompt: "Suggest walking routes connecting trees and landmarks nearby.", emoji: "🥾" },
      { label: "Seasonal harvests", prompt: "What harvests are available near me this month?", emoji: "🍎" },
    ];
    if (mapCtx.selectedTreeName) {
      actions.unshift({
        label: `About ${mapCtx.selectedTreeName}`,
        prompt: `Tell me about ${mapCtx.selectedTreeName}${mapCtx.selectedTreeSpecies ? ` (${mapCtx.selectedTreeSpecies})` : ""}.`,
        emoji: "🌳",
      });
      actions.push({
        label: "Rivers & paths nearby",
        prompt: `What rivers, footpaths, or heritage sites are near ${mapCtx.selectedTreeName}?`,
        emoji: "🌊",
      });
    }
    return actions.slice(0, 4);
  }

  if (mode === "librarian") {
    const actions: QuickAction[] = [
      { label: "Explore Heartwood", prompt: "What can I discover in the Heartwood Library?", emoji: "📚" },
      { label: "Find related records", prompt: "Show me connections between trees, books, and council discussions.", emoji: "🔗" },
    ];
    if (libraryCtx.selectedBookTitle) {
      actions.unshift({
        label: `About this book`,
        prompt: `Tell me about "${libraryCtx.selectedBookTitle}" by ${libraryCtx.selectedBookAuthor || "unknown"}.`,
        emoji: "📖",
      });
    }
    return actions.slice(0, 4);
  }

  if (mode === "scribe") {
    return [
      { label: "Council overview", prompt: "Give me an overview of the Council of Life and its purpose.", emoji: "🍃" },
      { label: "Meeting themes", prompt: "What key themes have emerged from recent council gatherings?", emoji: "📋" },
      { label: "Plant of the week", prompt: "What is the current plant of the week from the council?", emoji: "🌿" },
    ];
  }

  return [
    { label: "Guide me", prompt: "Where should I begin my journey in S33D?", emoji: "✨" },
    { label: "What is S33D?", prompt: "Explain the S33D ecosystem and how it works.", emoji: "🌱" },
  ];
}

export const TeotagProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const activeMode = detectMode(pathname);
  const { activeLens, lensConfig } = useSeasonalLens();

  const [mapContext, setMapContextState] = useState<MapContext>({});
  const [libraryContext, setLibraryContextState] = useState<LibraryContext>({});
  const [councilContext, setCouncilContextState] = useState<CouncilContext>({});

  // Listen for map context events from LeafletFallbackMap
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.center) {
        setMapContextState(prev => ({ ...prev, center: detail.center, zoom: detail.zoom }));
      }
    };
    window.addEventListener("teotag-map-context", handler);
    return () => window.removeEventListener("teotag-map-context", handler);
  }, []);

  const setMapContext = useCallback((ctx: Partial<MapContext>) => {
    setMapContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const setLibraryContext = useCallback((ctx: Partial<LibraryContext>) => {
    setLibraryContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const setCouncilContext = useCallback((ctx: Partial<CouncilContext>) => {
    setCouncilContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const buildContextSummary = useCallback((): string => {
    const parts: string[] = [];
    parts.push(`Route: ${pathname}`);
    parts.push(`Mode: ${activeMode}`);

    if (activeMode === "guide" && mapContext.center) {
      parts.push(`Map center: ${mapContext.center.lat.toFixed(4)}, ${mapContext.center.lng.toFixed(4)}`);
      if (mapContext.zoom) parts.push(`Zoom: ${mapContext.zoom}`);
      if (mapContext.selectedTreeName) parts.push(`Selected tree: ${mapContext.selectedTreeName} (${mapContext.selectedTreeSpecies || "unknown species"})`);
      if (mapContext.visibleTreeCount !== undefined) parts.push(`Visible trees: ${mapContext.visibleTreeCount}`);
      if (mapContext.activeFilters?.length) parts.push(`Active filters: ${mapContext.activeFilters.join(", ")}`);
      if (mapContext.activeLayers?.length) parts.push(`Active layers: ${mapContext.activeLayers.join(", ")}`);
    }

    if (activeMode === "librarian") {
      if (libraryContext.section) parts.push(`Library section: ${libraryContext.section}`);
      if (libraryContext.selectedBookTitle) parts.push(`Viewing book: "${libraryContext.selectedBookTitle}" by ${libraryContext.selectedBookAuthor || "unknown"}`);
    }

    if (activeMode === "scribe" && councilContext.activeCouncilName) {
      parts.push(`Council: ${councilContext.activeCouncilName}`);
    }

    // Seasonal lens context
    if (activeLens && lensConfig) {
      parts.push(`Seasonal lens: ${lensConfig.label} (${lensConfig.emoji})`);
      parts.push(`Lens emphasis months: ${lensConfig.months.join(", ")}`);
      parts.push(`Lens keywords: ${lensConfig.keywords.slice(0, 5).join(", ")}`);
    }

    return parts.join("\n");
  }, [pathname, activeMode, mapContext, libraryContext, councilContext, activeLens, lensConfig]);

  const quickActions = useMemo(
    () => getQuickActions(activeMode, mapContext, libraryContext, pathname, activeLens),
    [activeMode, mapContext, libraryContext, pathname, activeLens]
  );

  const value = useMemo<TeotagContextValue>(() => ({
    activeMode,
    currentRoute: pathname,
    mapContext,
    setMapContext,
    libraryContext,
    setLibraryContext,
    councilContext,
    setCouncilContext,
    buildContextSummary,
    quickActions,
  }), [activeMode, pathname, mapContext, setMapContext, libraryContext, setLibraryContext, councilContext, setCouncilContext, buildContextSummary, quickActions]);

  return (
    <TeotagContext.Provider value={value}>
      {children}
    </TeotagContext.Provider>
  );
};

export const useTeotagContext = () => {
  const ctx = useContext(TeotagContext);
  if (!ctx) throw new Error("useTeotagContext must be used within TeotagProvider");
  return ctx;
};
