import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import StarryNight from "@/components/StarryNight";
import PasswordGate, { isAuthenticated } from "@/components/PasswordGate";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import MapPage from "./pages/MapPage";
import AuthPage from "./pages/AuthPage";
import GrovesPage from "./pages/GrovesPage";
import GalleryPage from "./pages/GalleryPage";
import DashboardPage from "./pages/DashboardPage";
import TreeDetailPage from "./pages/TreeDetailPage";
import GoldenDreamPage from "./pages/GoldenDreamPage";
import CouncilOfLifePage from "./pages/CouncilOfLifePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [authed, setAuthed] = useState(isAuthenticated());

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <StarryNight />
        
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/tree/:id" element={<TreeDetailPage />} />
            <Route path="/groves" element={<GrovesPage />} />
            <Route path="/gallery" element={<GalleryPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/golden-dream" element={<GoldenDreamPage />} />
            <Route path="/council-of-life" element={<CouncilOfLifePage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
