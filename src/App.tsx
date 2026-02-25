import { useState, useEffect, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { TetolLevelProvider } from "@/contexts/TetolLevelContext";

const GalleryRedirect = () => <Navigate to="/library" replace />;
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import StarryNight from "@/components/StarryNight";
import ChatPanel from "@/components/ChatPanel";
import DevQAPanel from "@/components/DevQAPanel";

import { supabase } from "@/integrations/supabase/client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import CanopyHeartPulse from "@/components/CanopyHeartPulse";

// Lazy-load all route pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const MapPage = lazy(() => import("./pages/MapPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const GrovesPage = lazy(() => import("./pages/GrovesPage"));
const GalleryPage = lazy(() => import("./pages/GalleryPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const TreeDetailPage = lazy(() => import("./pages/TreeDetailPage"));
const GoldenDreamPage = lazy(() => import("./pages/GoldenDreamPage"));
const CouncilOfLifePage = lazy(() => import("./pages/CouncilOfLifePage"));
const AssetsPage = lazy(() => import("./pages/AssetsPage"));
const VaultPage = lazy(() => import("./pages/VaultPage"));
const RadioPage = lazy(() => import("./pages/RadioPage"));
const VisitsPage = lazy(() => import("./pages/VisitsPage"));
const ReferralsPage = lazy(() => import("./pages/ReferralsPage"));
const InstallPage = lazy(() => import("./pages/InstallPage"));
const ShareSimulatorPage = lazy(() => import("./pages/ShareSimulatorPage"));
const IncomingSharePage = lazy(() => import("./pages/IncomingSharePage"));
const TestLabPage = lazy(() => import("./pages/TestLabPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const StaffDetailPage = lazy(() => import("./pages/StaffDetailPage"));
const CuratorPage = lazy(() => import("./pages/CuratorPage"));
const SyncDashboardPage = lazy(() => import("./pages/SyncDashboardPage"));
const EditReviewPage = lazy(() => import("./pages/EditReviewPage"));
const HivePage = lazy(() => import("./pages/HivePage"));
const HivesIndexPage = lazy(() => import("./pages/HivesIndexPage"));
const ValueTreePage = lazy(() => import("./pages/ValueTreePage"));
const HiveTreasuryPage = lazy(() => import("./pages/HiveTreasuryPage"));
const LivingArchivePage = lazy(() => import("./pages/LivingArchivePage"));
const DiscoveryPage = lazy(() => import("./pages/DiscoveryPage"));
const CountryPortalPage = lazy(() => import("./pages/CountryPortalPage"));
const WorldAtlasPage = lazy(() => import("./pages/WorldAtlasPage"));
const PilgrimagePathwaysPage = lazy(() => import("./pages/PilgrimagePathwaysPage"));
const CycleMarketsPage = lazy(() => import("./pages/CycleMarketsPage"));
const UKCountryPage = lazy(() => import("./pages/UKCountryPage"));
const MarketDetailPage = lazy(() => import("./pages/MarketDetailPage"));

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

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-serif text-sm text-muted-foreground tracking-widest">Loading…</p>
    </div>
  </div>
);

const App = () => {
  const [supabaseAuthed, setSupabaseAuthed] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSupabaseAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <StarryNight />
        <DevQAPanel />
        {/* <ChatPanel /> */}
        
        <CanopyHeartPulse />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <TetolLevelProvider>
            <BottomNav />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/atlas" element={<WorldAtlasPage />} />
                <Route path="/tree/:id" element={<TreeDetailPage />} />
                <Route path="/staff/:code" element={<StaffDetailPage />} />
                <Route path="/groves" element={<GrovesPage />} />
                <Route path="/library" element={<GalleryPage />} />
                <Route path="/library/:room" element={<GalleryPage />} />
                <Route path="/gallery" element={<GalleryRedirect />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/golden-dream" element={<GoldenDreamPage />} />
                <Route path="/council-of-life" element={<CouncilOfLifePage />} />
                <Route path="/assets" element={<AssetsPage />} />
                <Route path="/vault" element={<VaultPage />} />
                <Route path="/heartwood/vault" element={<VaultPage />} />
                <Route path="/radio" element={<RadioPage />} />
                <Route path="/visits" element={<VisitsPage />} />
                <Route path="/referrals" element={<ReferralsPage />} />
                <Route path="/install" element={<InstallPage />} />
                <Route path="/share-simulator" element={<ShareSimulatorPage />} />
                <Route path="/incoming-share" element={<IncomingSharePage />} />
                <Route path="/test-lab" element={<TestLabPage />} />
                <Route path="/docs" element={<DocsPage />} />
                <Route path="/curator" element={<CuratorPage />} />
                <Route path="/sync" element={<SyncDashboardPage />} />
                <Route path="/edit-review" element={<EditReviewPage />} />
                <Route path="/hives" element={<HivesIndexPage />} />
                <Route path="/hive/:family" element={<HivePage />} />
                <Route path="/hive/:family/treasury" element={<HiveTreasuryPage />} />
                <Route path="/value-tree" element={<ValueTreePage />} />
                <Route path="/living-archive" element={<LivingArchivePage />} />
                <Route path="/discovery" element={<DiscoveryPage />} />
                <Route path="/markets" element={<CycleMarketsPage />} />
                <Route path="/markets/:id" element={<MarketDetailPage />} />
                <Route path="/atlas/pathways/:pathwaySlug" element={<PilgrimagePathwaysPage />} />
                <Route path="/atlas/united-kingdom" element={<UKCountryPage />} />
                <Route path="/atlas/:countrySlug" element={<CountryPortalPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </TetolLevelProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
