import { useState, lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { TetolLevelProvider } from "@/contexts/TetolLevelContext";

const GalleryRedirect = () => <Navigate to="/library" replace />;
const AtlasRedirect = () => {
  const search = window.location.search;
  return <Navigate to={`/map${search}`} replace />;
};
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import StarryNight from "@/components/StarryNight";
import ChatPanel from "@/components/ChatPanel";
import DevQAPanel from "@/components/DevQAPanel";
import PasswordGate, { isAuthenticated } from "@/components/PasswordGate";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";

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

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="font-serif text-sm text-muted-foreground tracking-widest">Loading…</p>
    </div>
  </div>
);

const App = () => {
  const [authed, setAuthed] = useState(isAuthenticated());

  // /map and /atlas bypass the password gate for public discovery
  const isPublicRoute = typeof window !== 'undefined' && (
    window.location.pathname === '/map' || window.location.pathname === '/atlas' || window.location.pathname === '/install' || window.location.pathname === '/library' || window.location.pathname.startsWith('/library/') || window.location.pathname.startsWith('/map?') || window.location.pathname.startsWith('/atlas?') || window.location.pathname === '/auth' || window.location.pathname === '/hives' || window.location.pathname.startsWith('/hive/')
  );

  if (!authed && !isPublicRoute) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {!isPublicRoute && <StarryNight />}
        <DevQAPanel />
        {/* <ChatPanel /> */}
        
        <BrowserRouter>
          <TetolLevelProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/atlas" element={<AtlasRedirect />} />
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
                <Route path="/value-tree" element={<ValueTreePage />} />
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
