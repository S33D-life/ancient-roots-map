/**
 * TeotagContext — captures application state for context-aware TEOTAG intelligence.
 * Provides current route, map state, page-level context (tree, harvest, staff, etc.)
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
  section?: string;
  selectedBookTitle?: string;
  selectedBookAuthor?: string;
  selectedTreeId?: string;
}

export interface CouncilContext {
  activeCouncilSlug?: string;
  activeCouncilName?: string;
}

/* ── Page-level context signals ─────────────────── */

export interface TreePageContext {
  id: string;
  name: string;
  species?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  hasHarvestListings?: boolean;
  bloomStatus?: string;
  offeringCount?: number;
}

export interface HarvestPageContext {
  id?: string;
  produceName?: string;
  category?: string;
  availabilityType?: string;
  treeId?: string;
  treeName?: string;
  locationName?: string;
  seasonStart?: number;
  seasonEnd?: number;
}

export interface StaffPageContext {
  code?: string;
  staffName?: string;
  species?: string;
  tokenId?: number;
  isOriginSpiral?: boolean;
  heartBalance?: number;
  treesMapped?: number;
  influenceEarned?: number;
}

export interface VaultPageContext {
  section?: string;
  assetCount?: number;
  heartBalance?: number;
  speciesHeartsBalance?: number;
  influenceBalance?: number;
  staffCode?: string;
  hiveParticipation?: string[];
  councilParticipation?: number;
}

export interface PageContext {
  tree?: TreePageContext;
  harvest?: HarvestPageContext;
  staff?: StaffPageContext;
  vault?: VaultPageContext;
}

/* ── Quick actions ──────────────────────────────── */

export interface QuickAction {
  label: string;
  prompt: string;
  emoji: string;
}

/* ── Context value ──────────────────────────────── */

export interface TeotagContextValue {
  activeMode: TeotagMode;
  currentRoute: string;
  mapContext: MapContext;
  setMapContext: (ctx: Partial<MapContext>) => void;
  libraryContext: LibraryContext;
  setLibraryContext: (ctx: Partial<LibraryContext>) => void;
  councilContext: CouncilContext;
  setCouncilContext: (ctx: Partial<CouncilContext>) => void;
  pageContext: PageContext;
  setPageContext: (ctx: Partial<PageContext>) => void;
  clearPageContext: () => void;
  buildContextSummary: () => string;
  quickActions: QuickAction[];
}

const TeotagContext = createContext<TeotagContextValue | null>(null);

/* ── Mode detection ─────────────────────────────── */

function detectMode(pathname: string): TeotagMode {
  if (pathname.startsWith("/map") || pathname.startsWith("/atlas") || pathname.startsWith("/hive")) return "guide";
  if (pathname.startsWith("/tree/")) return "guide";
  if (pathname.startsWith("/harvest")) return "guide";
  if (pathname.startsWith("/cosmic")) return "guide";
  if (pathname.startsWith("/staff/")) return "guide";
  if (pathname.startsWith("/library") || pathname.startsWith("/vault") || pathname.startsWith("/heartwood") || pathname.startsWith("/dashboard")) return "librarian";
  if (pathname.startsWith("/council")) return "scribe";
  return "guide";
}

/* ── Quick actions builder ──────────────────────── */

function getQuickActions(
  mode: TeotagMode,
  mapCtx: MapContext,
  libraryCtx: LibraryContext,
  pageCtx: PageContext,
  route: string,
  seasonalLens?: string | null,
): QuickAction[] {
  // Seasonal Lens — blend one seasonal action into page-specific context
  // instead of fully overriding, so page context remains visible
  const SEASONAL_LEAD: Record<string, QuickAction> = {
    spring: { label: "What's blooming?", prompt: "What trees are flowering or blooming near me right now in spring?", emoji: "🌸" },
    summer: { label: "What's fruiting?", prompt: "What trees are fruiting or ripening near me this summer?", emoji: "☀️" },
    autumn: { label: "Autumn harvests", prompt: "What nuts, fruits, and produce are ready for harvest this autumn?", emoji: "🍂" },
    winter: { label: "Evergreen walks", prompt: "What evergreen Ancient Friends are near me for winter walks?", emoji: "🌲" },
  };
  const seasonalLead = seasonalLens ? SEASONAL_LEAD[seasonalLens] : null;

  /** Prepend one seasonal action into a page-specific action list */
  const withSeason = (actions: QuickAction[], max = 4): QuickAction[] => {
    if (!seasonalLead) return actions.slice(0, max);
    // Avoid duplicate if label already present
    if (actions.some(a => a.label === seasonalLead.label)) return actions.slice(0, max);
    return [seasonalLead, ...actions].slice(0, max);
  };

  // ── Tree detail page ──────────────────────────
  if (pageCtx.tree) {
    const t = pageCtx.tree;
    const actions: QuickAction[] = [
      { label: `About ${t.name}`, prompt: `Tell me about ${t.name}${t.species ? ` (${t.species})` : ""}. What makes this tree special?`, emoji: "🌳" },
      { label: "Seasonal rhythm", prompt: `What is the seasonal cycle for ${t.species || t.name}? When does it bloom, fruit, and rest?`, emoji: "🌸" },
    ];
    if (t.hasHarvestListings) {
      actions.push({ label: "View produce", prompt: `What harvests or produce are available from ${t.name}?`, emoji: "🍎" });
    }
    actions.push({ label: "Nearby trees", prompt: `What other ancient trees are near ${t.name}? Show me walking routes.`, emoji: "🥾" });
    if (t.bloomStatus) {
      actions.push({ label: "Bloom status", prompt: `${t.name} is currently ${t.bloomStatus}. Tell me more about this phase.`, emoji: "🌿" });
    }
    // Species Hearts hint
    if (t.species) {
      actions.push({ label: "Earn Hearts", prompt: `How can I earn Species Hearts by mapping or making offerings to ${t.species} trees?`, emoji: "💚" });
    }
    return withSeason(actions);
  }

  // ── Harvest detail / listing page ─────────────
  if (pageCtx.harvest?.id) {
    const h = pageCtx.harvest;
    const actions: QuickAction[] = [
      { label: `About ${h.produceName || "this harvest"}`, prompt: `Tell me about ${h.produceName || "this harvest listing"}. What can I learn about this produce?`, emoji: "🍎" },
    ];
    if (h.treeId) {
      actions.push({ label: "View source tree", prompt: `Tell me about the tree that produces this ${h.produceName || "harvest"}.`, emoji: "🌳" });
    }
    actions.push(
      { label: "Season guide", prompt: `When is the best time to harvest ${h.produceName || "this produce"}? Show me the seasonal window.`, emoji: "📅" },
      { label: "Similar harvests", prompt: `What other ${h.category || "produce"} harvests are available nearby?`, emoji: "🌿" },
    );
    return withSeason(actions);
  }

  // ── Harvest index page ────────────────────────
  if (route.startsWith("/harvest")) {
    return withSeason([
      { label: "Harvests near me", prompt: "What harvests are happening near me this month?", emoji: "🍎" },
      { label: "Seasonal produce", prompt: "What tree produce is in season right now?", emoji: "🌿" },
      { label: "Find on map", prompt: "Show me harvest locations on the map.", emoji: "🗺️" },
      { label: "Blooming now", prompt: "What trees are flowering or fruiting this month?", emoji: "🌸" },
    ]);
  }

  // ── Staff page ────────────────────────────────
  if (pageCtx.staff?.code) {
    const s = pageCtx.staff;
    return [
      { label: `About this staff`, prompt: `Tell me about the Walking Staff "${s.staffName || s.code}"${s.species ? ` crafted from ${s.species}` : ""}.`, emoji: "🪵" },
      { label: "Staff ceremonies", prompt: "What ceremonies and rituals are connected to Walking Staffs in S33D?", emoji: "✨" },
      { label: "Species lore", prompt: `What is the significance of ${s.species || "this wood species"} in the grove?`, emoji: "🌿" },
    ];
  }

  // ── Calendar page ─────────────────────────────
  if (route.startsWith("/cosmic")) {
    return withSeason([
      { label: "What's happening now", prompt: "What seasonal events and harvests are happening this month?", emoji: "📅" },
      { label: "Upcoming harvests", prompt: "What harvests are coming up in the next few months?", emoji: "🍎" },
      { label: "Blooming cycles", prompt: "What is blooming or fruiting right now across the atlas?", emoji: "🌸" },
      { label: "Next gathering", prompt: "When is the next Council of Life gathering?", emoji: "🍃" },
    ]);
  }

  // ── Hive page ──────────────────────────────────
  if (route.startsWith("/hive/")) {
    const hiveSlug = route.split("/")[2];
    return withSeason([
      { label: "Earn Hearts", prompt: `How do I earn Species Hearts in this hive? What actions award hearts?`, emoji: "💚" },
      { label: "Hive ecology", prompt: `Tell me about the ecology and distribution of this species family.`, emoji: "🌿" },
      { label: "Top trees", prompt: `Which trees in this hive have the most offerings and hearts?`, emoji: "🌳" },
      { label: "Governance", prompt: `How does influence and governance work within this species hive?`, emoji: "🛡️" },
    ]);
  }

  // ── Dashboard / Hearth page ────────────────────
  if (route.startsWith("/dashboard")) {
    return withSeason([
      { label: "My journey", prompt: "Show me a summary of my journey — trees mapped, hearts earned, and milestones reached.", emoji: "🔥" },
      { label: "Earn today", prompt: "What actions can I take today to earn hearts and advance my journey?", emoji: "💚" },
      { label: "My streak", prompt: "How is my mapping streak going? What tier am I? How do I level up?", emoji: "🔥" },
      { label: "Seasonal quests", prompt: "What seasonal quests are available right now? How do I complete them?", emoji: "🌸" },
      { label: "My grove", prompt: "Tell me about my grove of Ancient Friends — species, locations, and health.", emoji: "🌳" },
      { label: "Seed trail", prompt: "How does the seed trail work? How do I plant and collect seeds?", emoji: "🌱" },
    ]);
  }

  // ── Council of Life page ──────────────────────
  if (route.startsWith("/council")) {
    return [
      { label: "Join a gathering", prompt: "How do I join the Council of Life gathering? When is the next one?", emoji: "🏛️" },
      { label: "Digital fire", prompt: "What is the Digital Fire? How do lunar cycles determine gathering times?", emoji: "🔥" },
      { label: "Host a council", prompt: "How can I host a local council gathering in my bioregion?", emoji: "🌍" },
    ];
  }

  // ── Wanderer profile page ─────────────────────
  if (route.startsWith("/wanderer/")) {
    return [
      { label: "About this wanderer", prompt: "Tell me about this wanderer's contributions to the grove.", emoji: "👤" },
      { label: "Their trees", prompt: "What trees has this wanderer mapped?", emoji: "🌳" },
    ];
  }

  // ── Vault page ────────────────────────────────
  if (pageCtx.vault || route.startsWith("/vault")) {
    return [
      { label: "My vault", prompt: "What assets and anchored records do I have in my vault?", emoji: "🔐" },
      { label: "My hearts", prompt: "How many S33D Hearts, Species Hearts, and Influence do I have? Show me a breakdown.", emoji: "❤️" },
      { label: "Earn more", prompt: "What actions can I take right now to earn more hearts? Show me the Value Tree.", emoji: "💚" },
      { label: "My staff", prompt: "Do I hold a Staff Room patron staff? What activity has it generated?", emoji: "🪄" },
    ];
  }

  // ── Value Tree page ──────────────────────────
  if (route.startsWith("/value-tree")) {
    return withSeason([
      { label: "How Hearts work", prompt: "Explain the S33D Hearts economy — how do I earn and use Hearts?", emoji: "❤️" },
      { label: "Earning actions", prompt: "What specific actions earn hearts today? Show me the rewards table.", emoji: "💚" },
      { label: "Species Hearts", prompt: "How do Species Hearts differ from S33D Hearts? How are they earned?", emoji: "🐝" },
      { label: "Influence tokens", prompt: "What are influence tokens and how do they affect governance?", emoji: "🛡️" },
      { label: "Distribution Compass", prompt: "How are the 777 million S33D Hearts distributed across the four channels?", emoji: "🧭" },
      { label: "Proof of Flow", prompt: "Explain Proof of Flow — how does the emission curve work?", emoji: "🌊" },
    ]);
  }

  // ── Patron Offering page ──────────────────────
  if (route.startsWith("/patron-offering")) {
    return [
      { label: "Staff Patron role", prompt: "What does it mean to be a founding patron of the Ancient Friends Staff Room?", emoji: "👑" },
      { label: "What do I receive?", prompt: "What do I receive when I claim a staff for £3,300? List the benefits.", emoji: "🪄" },
      { label: "How it seeds", prompt: "How does my donation flow through the S33D economy?", emoji: "🌱" },
      { label: "Founding circle", prompt: "Tell me about the 36 founding staffs and the Origin Spiral.", emoji: "🌀" },
    ];
  }

  // ── Staff Room page (library/staff-room) ──────
  if (route.includes("/staff-room") || route.includes("/library/staff-room")) {
    return [
      { label: "Staff Room guide", prompt: "Guide me through the Ancient Friends Staff Room — what am I seeing?", emoji: "🪄" },
      { label: "Origin Spiral", prompt: "What is the Origin Spiral and why are there 36 founding staffs?", emoji: "🌀" },
      { label: "Species Circles", prompt: "Explain the 9 species circles and the 108 expansion staffs.", emoji: "🔵" },
      { label: "Claim a staff", prompt: "How do I become a founding patron and claim a staff?", emoji: "👑" },
    ];
  }

  // ── Roadmap page ─────────────────────────────
  if (route.startsWith("/roadmap")) {
    return withSeason([
      { label: "What's next", prompt: "What features are coming next to S33D?", emoji: "🗺️" },
      { label: "Contribute", prompt: "How can I help shape the future of S33D?", emoji: "🤝" },
    ]);
  }

  // ── Support page ─────────────────────────────
  if (route.startsWith("/support")) {
    return [
      { label: "Get help", prompt: "I need help with S33D. What are common questions?", emoji: "❓" },
      { label: "Report a bug", prompt: "How do I report a bug in the Bug Garden?", emoji: "🐛" },
    ];
  }

  // ── Bio-region page ──────────────────────────
  if (route.startsWith("/atlas/bio-regions")) {
    return withSeason([
      { label: "About this bioregion", prompt: "Tell me about this bioregion — its ecology, climate, and key species.", emoji: "🌍" },
      { label: "Seasonal calendar", prompt: "What is the seasonal rhythm in this bioregion?", emoji: "📅" },
      { label: "Find trees", prompt: "What ancient trees have been mapped in this bioregion?", emoji: "🌳" },
    ]);
  }

  // ── Map mode (default guide) ──────────────────
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
    return withSeason(actions);
  }

  if (mode === "librarian") {
    const actions: QuickAction[] = [
      { label: "Explore Heartwood", prompt: "What can I discover in the Heartwood Library?", emoji: "📚" },
      { label: "Find related records", prompt: "Show me connections between trees, books, and council discussions.", emoji: "🔗" },
    ];
    if (libraryCtx.selectedBookTitle) {
      actions.unshift({
        label: "About this book",
        prompt: `Tell me about "${libraryCtx.selectedBookTitle}" by ${libraryCtx.selectedBookAuthor || "unknown"}.`,
        emoji: "📖",
      });
    }
    return withSeason(actions);
  }

  if (mode === "scribe") {
    return withSeason([
      { label: "Council overview", prompt: "Give me an overview of the Council of Life and its purpose.", emoji: "🍃" },
      { label: "Meeting themes", prompt: "What key themes have emerged from recent council gatherings?", emoji: "📋" },
      { label: "Plant of the week", prompt: "What is the current plant of the week from the council?", emoji: "🌿" },
    ]);
  }

  return withSeason([
    { label: "Guide me", prompt: "Where should I begin my journey in S33D?", emoji: "✨" },
    { label: "What is S33D?", prompt: "Explain the S33D ecosystem and how it works.", emoji: "🌱" },
  ]);
}

/* ── Context summary builder ────────────────────── */

function buildSummary(
  pathname: string,
  mode: TeotagMode,
  mapCtx: MapContext,
  libraryCtx: LibraryContext,
  councilCtx: CouncilContext,
  pageCtx: PageContext,
  activeLens: string | null,
  lensConfig: { label: string; emoji: string; months: number[]; keywords: string[] } | null,
): string {
  const parts: string[] = [];
  parts.push(`Route: ${pathname}`);
  parts.push(`Mode: ${mode}`);

  // Page-level context (highest specificity)
  if (pageCtx.tree) {
    const t = pageCtx.tree;
    parts.push(`Viewing tree: ${t.name} (ID: ${t.id})`);
    if (t.species) parts.push(`Species: ${t.species}`);
    if (t.country) parts.push(`Country: ${t.country}`);
    if (t.latitude && t.longitude) parts.push(`Location: ${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}`);
    if (t.bloomStatus) parts.push(`Current bloom status: ${t.bloomStatus}`);
    if (t.hasHarvestListings) parts.push(`This tree has active harvest listings`);
    if (t.offeringCount) parts.push(`Offerings: ${t.offeringCount}`);
  }

  if (pageCtx.harvest) {
    const h = pageCtx.harvest;
    if (h.id) {
      parts.push(`Viewing harvest listing: ${h.produceName || "unknown"}`);
      if (h.category) parts.push(`Category: ${h.category}`);
      if (h.availabilityType) parts.push(`Availability: ${h.availabilityType}`);
      if (h.locationName) parts.push(`Location: ${h.locationName}`);
      if (h.seasonStart && h.seasonEnd) {
        const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        parts.push(`Season: ${months[h.seasonStart - 1] || "?"} – ${months[h.seasonEnd - 1] || "?"}`);
      }
      if (h.treeName) parts.push(`Source tree: ${h.treeName}`);
    }
  }

  if (pageCtx.staff) {
    const s = pageCtx.staff;
    parts.push(`Viewing Walking Staff: ${s.staffName || s.code}`);
    if (s.species) parts.push(`Wood species: ${s.species}`);
    if (s.tokenId) parts.push(`Token ID: #${s.tokenId}`);
    if (s.isOriginSpiral) parts.push(`This is an Origin Spiral staff (one of the 36 founding staffs)`);
    if (s.heartBalance) parts.push(`Hearts generated by this staff holder: ${s.heartBalance}`);
    if (s.treesMapped) parts.push(`Trees mapped: ${s.treesMapped}`);
    if (s.influenceEarned) parts.push(`Influence earned: ${s.influenceEarned}`);
  }

  if (pageCtx.vault) {
    parts.push(`Viewing vault${pageCtx.vault.section ? `: ${pageCtx.vault.section}` : ""}`);
    if (pageCtx.vault.assetCount) parts.push(`Assets: ${pageCtx.vault.assetCount}`);
    if (pageCtx.vault.heartBalance) parts.push(`S33D Heart balance: ${pageCtx.vault.heartBalance}`);
    if (pageCtx.vault.speciesHeartsBalance) parts.push(`Species Hearts balance: ${pageCtx.vault.speciesHeartsBalance}`);
    if (pageCtx.vault.influenceBalance) parts.push(`Influence balance: ${pageCtx.vault.influenceBalance}`);
    if (pageCtx.vault.staffCode) parts.push(`Staff patron: ${pageCtx.vault.staffCode}`);
    if (pageCtx.vault.hiveParticipation?.length) parts.push(`Active in hives: ${pageCtx.vault.hiveParticipation.join(", ")}`);
    if (pageCtx.vault.councilParticipation) parts.push(`Council sessions attended: ${pageCtx.vault.councilParticipation}`);
  }

  // Map context
  if (mode === "guide" && mapCtx.center && !pageCtx.tree) {
    parts.push(`Map center: ${mapCtx.center.lat.toFixed(4)}, ${mapCtx.center.lng.toFixed(4)}`);
    if (mapCtx.zoom) parts.push(`Zoom: ${mapCtx.zoom}`);
    if (mapCtx.selectedTreeName) parts.push(`Selected tree: ${mapCtx.selectedTreeName} (${mapCtx.selectedTreeSpecies || "unknown species"})`);
    if (mapCtx.visibleTreeCount !== undefined) parts.push(`Visible trees: ${mapCtx.visibleTreeCount}`);
    if (mapCtx.activeFilters?.length) parts.push(`Active filters: ${mapCtx.activeFilters.join(", ")}`);
    if (mapCtx.activeLayers?.length) parts.push(`Active layers: ${mapCtx.activeLayers.join(", ")}`);
  }

  if (mode === "librarian") {
    if (libraryCtx.section) parts.push(`Library section: ${libraryCtx.section}`);
    if (libraryCtx.selectedBookTitle) parts.push(`Viewing book: "${libraryCtx.selectedBookTitle}" by ${libraryCtx.selectedBookAuthor || "unknown"}`);
  }

  if (mode === "scribe" && councilCtx.activeCouncilName) {
    parts.push(`Council: ${councilCtx.activeCouncilName}`);
  }

  // Seasonal lens
  if (activeLens && lensConfig) {
    parts.push(`Seasonal lens: ${lensConfig.label} (${lensConfig.emoji})`);
    parts.push(`Lens emphasis months: ${lensConfig.months.join(", ")}`);
    parts.push(`Lens keywords: ${lensConfig.keywords.slice(0, 5).join(", ")}`);
  }

  return parts.join("\n");
}

/* ── Provider ───────────────────────────────────── */

export const TeotagProvider = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const activeMode = detectMode(pathname);
  const { activeLens, lensConfig } = useSeasonalLens();

  const [mapContext, setMapContextState] = useState<MapContext>({});
  const [libraryContext, setLibraryContextState] = useState<LibraryContext>({});
  const [councilContext, setCouncilContextState] = useState<CouncilContext>({});
  const [pageContext, setPageContextState] = useState<PageContext>({});

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

  // Clear page context on route change
  useEffect(() => {
    setPageContextState({});
  }, [pathname]);

  const setMapContext = useCallback((ctx: Partial<MapContext>) => {
    setMapContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const setLibraryContext = useCallback((ctx: Partial<LibraryContext>) => {
    setLibraryContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const setCouncilContext = useCallback((ctx: Partial<CouncilContext>) => {
    setCouncilContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const setPageContext = useCallback((ctx: Partial<PageContext>) => {
    setPageContextState(prev => ({ ...prev, ...ctx }));
  }, []);

  const clearPageContext = useCallback(() => {
    setPageContextState({});
  }, []);

  const buildContextSummary = useCallback(
    () => buildSummary(pathname, activeMode, mapContext, libraryContext, councilContext, pageContext, activeLens, lensConfig),
    [pathname, activeMode, mapContext, libraryContext, councilContext, pageContext, activeLens, lensConfig],
  );

  const quickActions = useMemo(
    () => getQuickActions(activeMode, mapContext, libraryContext, pageContext, pathname, activeLens),
    [activeMode, mapContext, libraryContext, pageContext, pathname, activeLens],
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
    pageContext,
    setPageContext,
    clearPageContext,
    buildContextSummary,
    quickActions,
  }), [activeMode, pathname, mapContext, setMapContext, libraryContext, setLibraryContext, councilContext, setCouncilContext, pageContext, setPageContext, clearPageContext, buildContextSummary, quickActions]);

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
