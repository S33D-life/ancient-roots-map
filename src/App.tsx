import { useState, useEffect, lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { useConnectionResilience } from "@/hooks/use-connection-resilience";
import { Navigate } from "react-router-dom";
import RealmTransition from "@/components/RealmTransition";
import type { RealmDirection } from "@/components/RealmTransition";

/** Wrap a page element with a directional tree-zoom transition */
const realm = (element: ReactNode, direction: RealmDirection) => (
  <RealmTransition direction={direction}>{element}</RealmTransition>
);
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { TetolLevelProvider } from "@/contexts/TetolLevelContext";
import { MapFilterProvider } from "@/contexts/MapFilterContext";
import { UIFlowProvider } from "@/contexts/UIFlowContext";
import { TeotagProvider } from "@/contexts/TeotagContext";
import { HiveSeasonProvider } from "@/contexts/HiveSeasonContext";
import { SeasonalLensProvider } from "@/contexts/SeasonalLensContext";
import { CompanionProvider } from "@/contexts/CompanionContext";
import CompanionBridge from "@/components/companion/CompanionBridge";

const GalleryRedirect = () => <Navigate to="/library" replace />;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import HeartbeatNotification from "@/components/HeartbeatNotification";
const StarryNight = lazy(() => import("@/components/StarryNight"));

import DevQAPanel from "@/components/DevQAPanel";
import DevDiagnosticsOverlay from "@/components/DevDiagnosticsOverlay";
const ShowDevPanel = import.meta.env.DEV;

import { supabase } from "@/integrations/supabase/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import BottomNav from "@/components/BottomNav";
import CanopyHeartPulse from "@/components/CanopyHeartPulse";

import FireflyFAB from "@/components/FireflyFAB";
import MissingEnvBanner from "@/components/MissingEnvBanner";
import { attachAutoSync } from "@/utils/syncEngine";
import { useTreeCelebration } from "@/hooks/use-tree-celebration";
import { useContributionCelebration } from "@/hooks/use-contribution-celebration";
const ContributionCelebration = lazy(() => import("@/components/growth/ContributionCelebration"));

// Attach offline auto-sync listener once at app startup
attachAutoSync();

const ProximityNudge = lazy(() => import("@/components/ProximityNudge"));
const FirstWalkTrail = lazy(() => import("@/components/FirstWalkTrail"));
const DailySeedRitual = lazy(() => import("@/components/DailySeedRitual"));

const lazyImportWithRetry = <T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  key: string,
) =>
  lazy(async () => {
    try {
      return await importer();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isDynamicImportError =
        /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(message);

      if (isDynamicImportError && typeof window !== "undefined") {
        const retryKey = `s33d-lazy-retry:${key}`;
        const alreadyRetried = sessionStorage.getItem(retryKey) === "1";

        if (!alreadyRetried) {
          sessionStorage.setItem(retryKey, "1");
          window.location.reload();
        }
      }

      throw error;
    }
  });

// Lazy-load all route pages for code splitting
const TetolHomePage = lazyImportWithRetry(() => import("./pages/TetolHomePage"), "tetol-home");
const S33dGatewayPage = lazyImportWithRetry(() => import("./pages/Index"), "s33d-gateway");
const MapPage = lazyImportWithRetry(() => import("./pages/MapPage"), "map-page");
const AuthPage = lazyImportWithRetry(() => import("./pages/AuthPage"), "auth");
const GrovesPage = lazyImportWithRetry(() => import("./pages/GrovesPage"), "groves");
const PulseExplorerPage = lazyImportWithRetry(() => import("./pages/PulseExplorerPage"), "pulse-explorer");
const PathwaysPage = lazyImportWithRetry(() => import("./pages/PathwaysPage"), "pathways");
const GalleryPage = lazyImportWithRetry(() => import("./pages/GalleryPage"), "gallery");
const HeartwoodRoomPage = lazyImportWithRetry(() => import("./pages/library/HeartwoodRoomPage"), "heartwood-room");
const DashboardPage = lazyImportWithRetry(() => import("./pages/DashboardPage"), "dashboard");
const TreeDetailPage = lazyImportWithRetry(() => import("./pages/TreeDetailPage"), "tree-detail");
const GoldenDreamPage = lazyImportWithRetry(() => import("./pages/GoldenDreamPage"), "golden-dream");
const CouncilOfLifePage = lazyImportWithRetry(() => import("./pages/CouncilOfLifePage"), "council");
const AssetsPage = lazyImportWithRetry(() => import("./pages/AssetsPage"), "assets");
const VaultPage = lazyImportWithRetry(() => import("./pages/VaultPage"), "vault");
const RadioPage = lazyImportWithRetry(() => import("./pages/RadioPage"), "radio");
const VisitsPage = lazyImportWithRetry(() => import("./pages/VisitsPage"), "visits");
const ReferralsPage = lazyImportWithRetry(() => import("./pages/ReferralsPage"), "referrals");
const InstallPage = lazyImportWithRetry(() => import("./pages/InstallPage"), "install");
const ShareSimulatorPage = lazyImportWithRetry(() => import("./pages/ShareSimulatorPage"), "share-sim");
const IncomingSharePage = lazyImportWithRetry(() => import("./pages/IncomingSharePage"), "incoming-share");
const TestLabPage = lazyImportWithRetry(() => import("./pages/TestLabPage"), "test-lab");
const DocsPage = lazyImportWithRetry(() => import("./pages/DocsPage"), "docs");
const NotFound = lazyImportWithRetry(() => import("./pages/NotFound"), "not-found");
const StaffDetailPage = lazyImportWithRetry(() => import("./pages/StaffDetailPage"), "staff-detail");
const CuratorPage = lazyImportWithRetry(() => import("./pages/CuratorPage"), "curator");
const SyncDashboardPage = lazyImportWithRetry(() => import("./pages/SyncDashboardPage"), "sync-dash");
const EditReviewPage = lazyImportWithRetry(() => import("./pages/EditReviewPage"), "edit-review");
const HivePage = lazyImportWithRetry(() => import("./pages/HivePage"), "hive");
const HivesIndexPage = lazyImportWithRetry(() => import("./pages/HivesIndexPage"), "hives-index");
const ValueTreePage = lazyImportWithRetry(() => import("./pages/ValueTreePage"), "value-tree");
const HiveTreasuryPage = lazyImportWithRetry(() => import("./pages/HiveTreasuryPage"), "hive-treasury");
const LivingArchivePage = lazyImportWithRetry(() => import("./pages/LivingArchivePage"), "living-archive");
const DiscoveryPage = lazyImportWithRetry(() => import("./pages/DiscoveryPage"), "discovery");
const CountryPortalPage = lazyImportWithRetry(() => import("./pages/CountryPortalPage"), "country-portal");
const WorldAtlasPage = lazyImportWithRetry(() => import("./pages/WorldAtlasPage"), "world-atlas");
const PilgrimagePathwaysPage = lazyImportWithRetry(() => import("./pages/PilgrimagePathwaysPage"), "pathways");
const AtlasCountryWallPage = lazyImportWithRetry(() => import("./pages/AtlasCountryWallPage"), "atlas-country-wall");
// ValaisPortalPage removed — served by CountryPortalPage with canton filter
const MarketDetailPage = lazyImportWithRetry(() => import("./pages/MarketDetailPage"), "market-detail");
const AddTreePage = lazyImportWithRetry(() => import("./pages/AddTreePage"), "add-tree");
const CityTemplatePage = lazyImportWithRetry(() => import("./pages/CityTemplatePage"), "city-template");
const AtlasSubResolver = lazyImportWithRetry(() => import("./pages/AtlasSubResolver"), "atlas-sub");
const WhispersPage = lazyImportWithRetry(() => import("./pages/WhispersPage"), "whispers");
const ApiDocsPage = lazyImportWithRetry(() => import("./pages/ApiDocsPage"), "api-docs");
const TimeTreePage = lazyImportWithRetry(() => import("./pages/TimeTreePage"), "time-tree");
const BugGardenPage = lazyImportWithRetry(() => import("./pages/BugGardenPage"), "bug-garden");
const AdminEvolutionPage = lazyImportWithRetry(() => import("./pages/AdminEvolutionPage"), "admin-evolution");
// KingOfBavleuxPage removed — route redirects to /atlas/switzerland
// DolomitiAmpezzoPage removed — served by BioRegionPage /atlas/bio-regions/dolomites-ampezzo-cadore
const BioRegionsIndexPage = lazyImportWithRetry(() => import("./pages/BioRegionsIndexPage"), "bio-regions-index");
const BioRegionPage = lazyImportWithRetry(() => import("./pages/BioRegionPage"), "bio-region");
const BioregionCalendarPage = lazyImportWithRetry(() => import("./pages/BioregionCalendarPage"), "bio-calendar");
const PressPage = lazyImportWithRetry(() => import("./pages/PressPage"), "press");
const HongKongAtlasPage = lazyImportWithRetry(() => import("./pages/HongKongAtlasPage"), "hong-kong-atlas");
const SingaporeAtlasPage = lazyImportWithRetry(() => import("./pages/SingaporeAtlasPage"), "singapore-atlas");
const JapanAtlasPage = lazyImportWithRetry(() => import("./pages/JapanAtlasPage"), "japan-atlas");
const ItalyAtlasPage = lazyImportWithRetry(() => import("./pages/ItalyAtlasPage"), "italy-atlas");
const UnitedStatesAtlasPage = lazyImportWithRetry(() => import("./pages/UnitedStatesAtlasPage"), "us-atlas");
const SouthAfricaAtlasPage = lazyImportWithRetry(() => import("./pages/SouthAfricaAtlasPage"), "south-africa-atlas");
const IndiaAtlasPage = lazyImportWithRetry(() => import("./pages/IndiaAtlasPage"), "india-atlas");
const TaiwanAtlasPage = lazyImportWithRetry(() => import("./pages/TaiwanAtlasPage"), "taiwan-atlas");
const SpainAtlasPage = lazyImportWithRetry(() => import("./pages/SpainAtlasPage"), "spain-atlas");
const MexicoAtlasPage = lazyImportWithRetry(() => import("./pages/MexicoAtlasPage"), "mexico-atlas");
const SupportPage = lazyImportWithRetry(() => import("./pages/SupportPage"), "support");
const ResearchTreeDetailPage = lazyImportWithRetry(() => import("./pages/ResearchTreeDetailPage"), "research-tree-detail");
const HarvestPage = lazyImportWithRetry(() => import("./pages/HarvestPage"), "harvest");
const HarvestDetailPage = lazyImportWithRetry(() => import("./pages/HarvestDetailPage"), "harvest-detail");
const HowHeartsWorkPage = lazyImportWithRetry(() => import("./pages/HowHeartsWorkPage"), "how-hearts");
const CosmicCalendarPage = lazyImportWithRetry(() => import("./pages/CosmicCalendarPage"), "cosmic-calendar");
const TreeLedgerPage = lazyImportWithRetry(() => import("./pages/TreeLedgerPage"), "tree-ledger");
const CalendarSettingsPage = lazyImportWithRetry(() => import("./pages/CalendarSettingsPage"), "calendar-settings");
const RootstoneImporterPage = lazyImportWithRetry(() => import("./pages/RootstoneImporterPage"), "rootstone-importer");
const WandererProfilePage = lazyImportWithRetry(() => import("./pages/WandererProfilePage"), "wanderer-profile");
const LivingForestRoadmapPage = lazyImportWithRetry(() => import("./pages/LivingForestRoadmapPage"), "roadmap");
const PatronOfferingPage = lazyImportWithRetry(() => import("./pages/PatronOfferingPage"), "patron-offering");
const CompanionPage = lazyImportWithRetry(() => import("./pages/CompanionPage"), "companion");
const TreeDataCommonsPage = lazyImportWithRetry(() => import("./pages/TreeDataCommonsPage"), "tree-data-commons");
const AgentGardenPage = lazyImportWithRetry(() => import("./pages/AgentGardenPage"), "agent-garden");
const EcosystemMapPage = lazyImportWithRetry(() => import("./pages/EcosystemMapPage"), "ecosystem-map");
const DatasetDiscoveryAgentPage = lazyImportWithRetry(() => import("./pages/DatasetDiscoveryAgentPage"), "discovery-agent");
const DatasetWatcherPage = lazyImportWithRetry(() => import("./pages/DatasetWatcherPage"), "dataset-watcher");
const TreeAtlasExpansionMapPage = lazyImportWithRetry(() => import("./pages/TreeAtlasExpansionMapPage"), "atlas-expansion");
const SeedPlanGeneratorPage = lazyImportWithRetry(() => import("./pages/SeedPlanGeneratorPage"), "seed-plan-generator");
const CanopyProjectionPage = lazyImportWithRetry(() => import("./pages/CanopyProjectionPage"), "canopy-projection");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 5 min — avoid refetching on every navigation
      gcTime: 10 * 60 * 1000,     // 10 min garbage collection
      refetchOnWindowFocus: false, // prevent aggressive refetch on tab switch
      retry: 1,
    },
  },
});

const PageLoader = () => <PageSkeleton variant="default" />;

const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [authInitError, setAuthInitError] = useState<string | null>(null);

  // Global connection resilience — shows reconnection toasts
  useConnectionResilience();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Listener kept active so auth SDK can process token refresh/sign-out updates.
    });

    supabase.auth
      .getSession()
      .then(() => {
        setAuthReady(true);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Failed to restore your session";
        setAuthInitError(message);
        setAuthReady(true);
      });

    return () => subscription.unsubscribe();
  }, []);

  // Arterial pulse: pause animations when tab hidden
  useEffect(() => {
    const onVis = () => {
      document.documentElement.classList.toggle("tab-hidden", document.hidden);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  if (authInitError) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 bg-background text-foreground">
        <section className="w-full max-w-lg rounded-xl border border-border bg-card p-6 space-y-3">
          <h1 className="text-xl font-semibold">Authentication unavailable</h1>
          <p className="text-sm text-muted-foreground">
            We couldn’t restore your session. Refresh the page. If this continues, verify backend URL/key settings and Google redirect URLs.
          </p>
          <p className="text-xs text-destructive break-words" role="alert">{authInitError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-md border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground"
          >
            Reload
          </button>
        </section>
      </main>
    );
  }

  const CelebrationOverlay = () => {
    const { celebration, dismiss: dismissTree } = useTreeCelebration();
    const { event: contribEvent, dismiss: dismissContrib } = useContributionCelebration();

    // Tree creation events (legacy)
    if (celebration) {
      return (
        <Suspense fallback={null}>
          <ContributionCelebration event={{ type: "tree", name: celebration.treeName, species: celebration.species }} onComplete={dismissTree} />
        </Suspense>
      );
    }
    // Offering / harvest events
    if (contribEvent) {
      return (
        <Suspense fallback={null}>
          <ContributionCelebration event={contribEvent} onComplete={dismissContrib} />
        </Suspense>
      );
    }
    return null;
  };

  // Show loading skeleton while auth state resolves
  if (!authReady) {
    return <PageSkeleton variant="default" />;
  }

  return (
    <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="botanical-page">
        <Toaster />
        <Sonner />
        <Suspense fallback={null}><StarryNight /></Suspense>
        <HeartbeatNotification />
        <MissingEnvBanner />
        {ShowDevPanel && <DevQAPanel />}
        {ShowDevPanel && <DevDiagnosticsOverlay />}
        
        <CanopyHeartPulse />
        
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <TetolLevelProvider>
          <HiveSeasonProvider>
          <MapFilterProvider>
          <UIFlowProvider>
          <SeasonalLensProvider>
          <CompanionProvider>
          <TeotagProvider>
            <CompanionBridge />
            <BottomNav />
            <FireflyFAB />
            <CelebrationOverlay />
            <Suspense fallback={null}>
              <ProximityNudge />
              <FirstWalkTrail />
              <DailySeedRitual />
            </Suspense>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={realm(<TetolHomePage />, "tetol-out")} />
                <Route path="/s33d" element={realm(<S33dGatewayPage />, "seed")} />
                <Route path="/ancient-friends" element={<Navigate to="/map" replace />} />
                <Route path="/heartwood" element={<Navigate to="/library" replace />} />
                <Route path="/your-golden-dream" element={<Navigate to="/golden-dream" replace />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/add-tree" element={realm(<AddTreePage />, "roots")} />
                <Route path="/atlas" element={realm(<WorldAtlasPage />, "roots")} />
                <Route path="/tree/research/:id" element={realm(<ResearchTreeDetailPage />, "roots")} />
                <Route path="/tree/:id" element={realm(<TreeDetailPage />, "roots")} />
                <Route path="/staff/:code" element={<StaffDetailPage />} />
                <Route path="/groves" element={realm(<GrovesPage />, "roots")} />
                <Route path="/pulse" element={realm(<PulseExplorerPage />, "roots")} />
                <Route path="/pathways" element={realm(<PathwaysPage />, "roots")} />
                <Route path="/library" element={realm(<GalleryPage />, "trunk")} />
                <Route path="/library/:room" element={realm(<HeartwoodRoomPage />, "trunk")} />
                <Route path="/ledger" element={realm(<TreeLedgerPage />, "trunk")} />
                <Route path="/gallery" element={<GalleryRedirect />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/golden-dream" element={realm(<GoldenDreamPage />, "crown")} />
                <Route path="/council-of-life" element={realm(<CouncilOfLifePage />, "canopy")} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/vault" element={<VaultPage />} />
                {/* /heartwood/vault removed — consolidated to /vault */}
                <Route path="/radio" element={<RadioPage />} />
                <Route path="/visits" element={<VisitsPage />} />
                <Route path="/referrals" element={<ReferralsPage />} />
                <Route path="/install" element={<InstallPage />} />
                {ShowDevPanel && <Route path="/share-simulator" element={<ShareSimulatorPage />} />}
                <Route path="/incoming-share" element={<IncomingSharePage />} />
                {ShowDevPanel && <Route path="/test-lab" element={<TestLabPage />} />}
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/curator" element={<CuratorPage />} />
                <Route path="/curator/rootstones-import" element={<RootstoneImporterPage />} />
                {ShowDevPanel && <Route path="/sync" element={<SyncDashboardPage />} />}
                {ShowDevPanel && <Route path="/edit-review" element={<EditReviewPage />} />}
                <Route path="/hives" element={<HivesIndexPage />} />
                <Route path="/hive/:family" element={<HivePage />} />
                <Route path="/hive/:family/treasury" element={<HiveTreasuryPage />} />
                <Route path="/value-tree" element={<ValueTreePage />} />
                <Route path="/living-archive" element={<LivingArchivePage />} />
                <Route path="/discovery" element={<DiscoveryPage />} />
                <Route path="/markets" element={<Navigate to="/library/rhythms" replace />} />
                <Route path="/markets/:id" element={<MarketDetailPage />} />
                <Route path="/atlas/pathways/:pathwaySlug" element={<PilgrimagePathwaysPage />} />
                <Route path="/atlas/hong-kong" element={<HongKongAtlasPage />} />
                <Route path="/atlas/singapore" element={<SingaporeAtlasPage />} />
                <Route path="/atlas/japan" element={<JapanAtlasPage />} />
                <Route path="/atlas/italy" element={<ItalyAtlasPage />} />
                <Route path="/atlas/united-states" element={<UnitedStatesAtlasPage />} />
                <Route path="/atlas/south-africa" element={<SouthAfricaAtlasPage />} />
                <Route path="/atlas/india" element={<IndiaAtlasPage />} />
                <Route path="/atlas/taiwan" element={<TaiwanAtlasPage />} />
                <Route path="/atlas/spain" element={<SpainAtlasPage />} />
                <Route path="/atlas/mexico" element={<MexicoAtlasPage />} />
                {/* Sub-portal redirects */}
                <Route path="/atlas/switzerland/valais/king-of-bavleux" element={<Navigate to="/atlas/switzerland" replace />} />
                <Route path="/atlas/italy/dolomiti-ampezzo" element={<Navigate to="/atlas/bio-regions/dolomites-ampezzo-cadore" replace />} />
                <Route path="/atlas/bio-regions" element={<BioRegionsIndexPage />} />
                <Route path="/atlas/bio-regions/:slug" element={<BioRegionPage />} />
                <Route path="/atlas/bio-regions/:slug/calendar" element={<BioregionCalendarPage />} />
                <Route path="/country/:countrySlug/:citySlug" element={<CityTemplatePage />} />
                <Route path="/atlas/:countrySlug/:subSlug" element={<AtlasSubResolver />} />
                <Route path="/atlas/:countrySlug" element={<CountryPortalPage />} />
                <Route path="/whispers" element={<WhispersPage />} />
                <Route path="/time-tree" element={<TimeTreePage />} />
                {ShowDevPanel && <Route path="/api/docs" element={<ApiDocsPage />} />}
                <Route path="/bug-garden" element={<BugGardenPage />} />
                <Route path="/evolution" element={<AdminEvolutionPage />} />
                <Route path="/press" element={<PressPage />} />
                <Route path="/support" element={<SupportPage />} />
                <Route path="/harvest" element={<HarvestPage />} />
                <Route path="/harvest/:id" element={<HarvestDetailPage />} />
                <Route path="/how-hearts-work" element={<HowHeartsWorkPage />} />
                <Route path="/cosmic" element={<CosmicCalendarPage />} />
                <Route path="/cosmic/settings" element={<CalendarSettingsPage />} />
                <Route path="/wanderer/:id" element={<WandererProfilePage />} />
                <Route path="/roadmap" element={<LivingForestRoadmapPage />} />
                <Route path="/patron-offering" element={<PatronOfferingPage />} />
                <Route path="/companion" element={<CompanionPage />} />
                <Route path="/tree-data-commons" element={<TreeDataCommonsPage />} />
                <Route path="/agent-garden" element={<AgentGardenPage />} />
                <Route path="/discovery-agent" element={<DatasetDiscoveryAgentPage />} />
                <Route path="/dataset-watcher" element={<DatasetWatcherPage />} />
                <Route path="/atlas-expansion" element={<TreeAtlasExpansionMapPage />} />
                <Route path="/seed-plan-generator" element={<SeedPlanGeneratorPage />} />
                <Route path="/canopy-projection" element={<CanopyProjectionPage />} />
                <Route path="/ecosystem" element={<EcosystemMapPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TeotagProvider>
          </CompanionProvider>
          </SeasonalLensProvider>
          </UIFlowProvider>
          </MapFilterProvider>
          </HiveSeasonProvider>
          </TetolLevelProvider>
        </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
    </GlobalErrorBoundary>
  );
};

export default App;
