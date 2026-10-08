import { useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { BookOpen, Cherry, Archive, Map, Leaf } from "lucide-react";
import { Button } from "@/components/ui/button";
import CrownGrowths from "@/components/crown/CrownGrowths";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ParchmentGround, TreePlate, TeotagMarginNote } from "@/components/parchment/ParchmentGround";
import { ROUTES } from "@/lib/routes";

import { useFullscreen } from "@/hooks/use-fullscreen";
import FullscreenShell from "@/components/FullscreenShell";
import FullscreenToggle from "@/components/FullscreenToggle";
import goldenDreamNight from "@/assets/golden-dream-night.jpeg";


const EncounterEconomyManifesto = lazy(() => import("@/components/economy/EncounterEconomyManifesto"));

interface GoldenDreamRoom {
  id: string;
  title: string;
  description: string;
  icon: typeof Map;
  internal?: boolean;
  notionUrl?: string;
  externalUrl?: string;
}

const goldenDreamRooms: GoldenDreamRoom[] = [
  {
    id: "encounter-economy",
    title: "Encounter Economy",
    description: "The deeper philosophy of S33D",
    icon: Leaf,
    internal: true,
  },
  {
    id: "roadmap",
    title: "Living Roadmap",
    description: "The evolving S33D ecosystem",
    icon: Map,
    internal: true,
  },
  {
    id: "current",
    title: "Current Version",
    description: "The Current S33D Blue Print",
    icon: BookOpen,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd/21615b58480d802187b2cff864277413",
  },
  {
    id: "fruit",
    title: "Popular Fruit",
    description: "Next S33D likely to Sprout",
    icon: Cherry,
    notionUrl: "https://clammy-viscount-ddb.notion.site/ebd/21615b58480d802187b2cff864277413",
  },
  {
    id: "archives",
    title: "Archives",
    description: "Past versions of the Golden Dream",
    icon: Archive,
    externalUrl: "https://www.icloud.com/iclouddrive/0a8LpBMrWx1WVlDW9HOdNI0-Q#Golden_Dream_V2.0",
  },
];

const GoldenDreamPage = () => {
  useDocumentTitle("yOur Golden Dream");
  const navigate = useNavigate();
  const { isFullscreen, enterFullscreen, exitFullscreen } = useFullscreen();
  const [coverDismissed, setCoverDismissed] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const isDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

  // Fullscreen Notion view
  if (isFullscreen && activeRoom && activeRoom !== "roadmap") {
    const room = goldenDreamRooms.find((r) => r.id === activeRoom);
    return (
      <FullscreenShell active tone="page">
        <FullscreenToggle isFullscreen onToggle={exitFullscreen} />
        <iframe
          src={room?.notionUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          title={room?.title}
        />
      </FullscreenShell>
    );
  }

  // Encounter Economy room
  if (activeRoom === "encounter-economy") {
    return (
      <ParchmentGround realm="crown">
        <Header />
        <main className="pt-28 pb-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveRoom(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Golden Dream
              </Button>
            </div>
            <Suspense fallback={<div className="py-12 text-center text-muted-foreground text-sm">Breathing…</div>}>
              <EncounterEconomyManifesto />
            </Suspense>
          </div>
        </main>
        <Footer />
      </ParchmentGround>
    );
  }


  // Notion room
  if (activeRoom) {
    const room = goldenDreamRooms.find((r) => r.id === activeRoom);
    return (
      <ParchmentGround realm="crown">
        <Header />
        <main className="pt-28 pb-8 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveRoom(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Back to Golden Dream
              </Button>
              <FullscreenToggle
                isFullscreen={false}
                onToggle={enterFullscreen}
                position="top-right"
                className="relative top-auto right-auto"
              />
            </div>

            <div className="relative rounded-xl border border-border/40 overflow-hidden">
              <iframe
                src={room?.notionUrl}
                width="100%"
                height="800"
                style={{ border: 0 }}
                allowFullScreen
                title={room?.title}
              />
              {isDark && !coverDismissed && (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-700"
                  onClick={() => setCoverDismissed(true)}
                >
                  <img
                    src={goldenDreamNight}
                    alt="yOur Golden Dream"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-xs font-serif tracking-[0.3em] uppercase animate-pulse" style={{ color: 'hsl(40 60% 65%)' }}>
                      Tap to enter
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </ParchmentGround>
    );
  }

  return (
    <ParchmentGround realm="crown">
      <Header />
      <main className="parchment-main">
        <div className="parchment-hero">
          <div>
            <CrownGrowths headingLevel={1} />
            <TeotagMarginNote>Everything you will meet up here began in something lived.</TeotagMarginNote>
          </div>
          <TreePlate />
        </div>
        <section className="parchment-section" aria-labelledby="dream-reading">
          <h2 id="dream-reading">Read the Golden Dream</h2>
          <p>The philosophy, possibilities and remembered versions of S33D.</p>
          <div className="parchment-doors">
            {goldenDreamRooms.map(room => room.externalUrl ? (
              <a key={room.id} href={room.externalUrl} target="_blank" rel="noopener noreferrer" className="parchment-door">
                <span><strong>{room.title}</strong><em>{room.description} · opens in a new tab</em></span><ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <button key={room.id} type="button" className="parchment-door" onClick={() => room.id === "roadmap" ? navigate("/roadmap") : setActiveRoom(room.id)}>
                <span><strong>{room.title}</strong><em>{room.description}</em></span><ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </section>
        <div className="parchment-journey"><span>Follow the Tree down into the gathering.</span><Link to={ROUTES.COUNCIL} state={{ from: ROUTES.GOLDEN_DREAM }}>Descend to the Council of Life <ArrowRight aria-hidden="true" size={18} /></Link></div>
      </main>
      <Footer />
    </ParchmentGround>
  );
};

export default GoldenDreamPage;
