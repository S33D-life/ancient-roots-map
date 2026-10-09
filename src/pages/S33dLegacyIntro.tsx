import { Link } from "react-router-dom";
import { TeotagMarginNote } from "@/components/parchment/ParchmentGround";
import { useCallback, useEffect, lazy, Suspense } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import S33dEntrance from "@/components/S33dEntrance";
import BetaGardenBanner from "@/components/BetaGardenBanner";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { useVineFade } from "@/hooks/use-vine-fade";
import { DiscoveryRow } from "@/components/HomeSections";
import { useTreeScroll } from "@/hooks/use-tree-scroll";
import { useTreeDepthChannel } from "@/hooks/use-tree-depth-channel";
import TreeScrollIndicator from "@/components/TreeScrollIndicator";
import CrownSection from "@/components/tree-sections/CrownSection";
import { useTimeOfDay } from "@/hooks/use-time-of-day";
import { useSeasonalTheme } from "@/hooks/use-seasonal-theme";
import { useNetworkPulse } from "@/hooks/use-network-pulse";
import { useTreeVitality } from "@/hooks/use-tree-vitality";
import { PageSkeleton } from "@/components/ui/page-skeleton";

// Lazy-load below-the-fold sections to reduce initial bundle
const NetworkPulseOverlay = lazy(() => import("@/components/tree-sections/NetworkPulseOverlay"));
const CanopySection = lazy(() => import("@/components/tree-sections/CanopySection"));
const TrunkSection = lazy(() => import("@/components/tree-sections/TrunkSection"));
const GroundSection = lazy(() => import("@/components/tree-sections/GroundSection"));
const SectionAtmosphere = lazy(() => import("@/components/tree-sections/SectionAtmosphere"));
const AnatomicalSeam = lazy(() => import("@/components/tree-sections/AnatomicalSeam"));
const TreeSpine = lazy(() => import("@/components/tree-sections/TreeSpine"));
const AmbientZoneBadge = lazy(() => import("@/components/tree-sections/AmbientZoneBadge"));
const HabitatAtmosphere = lazy(() => import("@/components/tree-sections/HabitatAtmosphere"));
const ParallaxTextures = lazy(() => import("@/components/tree-sections/ParallaxTextures"));
const EcosystemOverview = lazy(() => import("@/components/EcosystemOverview"));
const RootPulse = lazy(() => import("@/components/RootPulse"));
const WhisperEchoesFeed = lazy(() => import("@/components/WhisperEchoesFeed"));
const WisdomOfTheGrove = lazy(() => import("@/components/WisdomOfTheGrove").then(m => ({ default: m.WisdomOfTheGrove })));
const TetolBridge = lazy(() => import("@/components/TetolBridge"));
const ContextualWhisper = lazy(() => import("@/components/ContextualWhisper"));

const BreathingChamber = lazy(() => import("@/components/BreathingChamber"));

const ParticipationSection = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.ParticipationSection })));
const SupportDiscoveryRow = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.SupportDiscoveryRow })));
const TetolNavSection = lazy(() => import("@/components/HomeSections").then(m => ({ default: m.TetolNavSection })));
const ForestInteractionLayers = lazy(() => import("@/components/ForestInteractionLayers"));
const TreeDepthBackground = lazy(() => import("@/components/TreeDepthBackground"));
const MobileSectionWhisper = lazy(() => import("@/components/MobileSectionWhisper"));

/** Minimal loading shimmer for lazy sections */
const SectionShimmer = () => (
  <div className="py-16 flex justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary/60 animate-spin" />
  </div>
);

const Index = ({ parchment = false }: { parchment?: boolean }) => {
  useDocumentTitle("Ancient Friends — A Living Atlas of the World's Oldest Trees");
  const { showEntrance, dismissEntrance } = useEntranceOnce("index", !parchment);
  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);
  const { activeSection, scrollToSection } = useTreeScroll();
  useEffect(() => {
    if (!parchment || window.location.hash) return;
    const main = document.querySelector(".s33d-living-scroll main");
    if (!main) return;
    let active = true;
    const alignSeed = () => {
      if (!active) return;
      const seed = document.getElementById("ground");
      if (!seed) return;
      const header = document.querySelector("header")?.getBoundingClientRect().height || 60;
      window.scrollTo({ top: seed.getBoundingClientRect().top + window.scrollY - header - 8, behavior: "instant" });
    };
    const resize = new ResizeObserver(alignSeed);
    const mutation = new MutationObserver(alignSeed);
    resize.observe(main);
    mutation.observe(main, { childList: true, subtree: true });
    const stop = () => { active = false; resize.disconnect(); mutation.disconnect(); };
    window.addEventListener("wheel", stop, { once: true, passive: true });
    window.addEventListener("touchstart", stop, { once: true, passive: true });
    window.addEventListener("keydown", stop, { once: true });
    window.addEventListener("pointerdown", stop, { once: true });
    alignSeed();
    const timer = window.setTimeout(stop, 3000);
    return () => { stop(); clearTimeout(timer); window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop); window.removeEventListener("keydown", stop); window.removeEventListener("pointerdown", stop); };
  }, [parchment]);
  useVineFade();
  useTreeDepthChannel();
  useTimeOfDay();
  useSeasonalTheme();
  const { latestEvent } = useNetworkPulse();
  const { data: vitality } = useTreeVitality();

  if (showEntrance) {
    return <S33dEntrance onComplete={handleEntranceComplete} />;
  }

  return (
    <div className={`min-h-screen flex flex-col relative ${parchment ? "s33d-living-scroll" : ""}`} style={{
      background: "linear-gradient(to bottom, hsl(45 30% 92% / 0.04) 0%, transparent 20%, transparent 70%, hsl(25 30% 12% / 0.06) 100%)",
    }}>
      {/* Scroll-driven tree depth background */}
      <Suspense fallback={null}>
        {!parchment && <TreeDepthBackground />}
        {!parchment && <HabitatAtmosphere />}
        {!parchment && <ParallaxTextures />}
        {!parchment && <MobileSectionWhisper />}
      </Suspense>

      {/* Continuous tree spine running the full page height —
          quietly orients the visitor (roots ↔ trunk ↔ branches ↔ crown). */}
      <Suspense fallback={null}>
        {!parchment && <TreeSpine />}
        {!parchment && <AmbientZoneBadge />}
      </Suspense>

      {/* Network Pulse — the tree's nervous system */}
      <Suspense fallback={null}>
        {!parchment && <NetworkPulseOverlay latestEvent={latestEvent} vitality={vitality} />}
      </Suspense>
      <Header />

      {/* Tree Scroll Indicator — desktop only */}
      <TreeScrollIndicator
        activeSection={activeSection}
        onNavigate={scrollToSection}
      />

      <main className="relative z-[1] flex-1" style={{ paddingTop: 'var(--content-top)' }}>
        {/* Beta garden tone-setter */}
        <BetaGardenBanner />

        {/* ── Below-fold sections lazy-loaded for faster FCP ── */}
        <Suspense fallback={<SectionShimmer />}>
          {/* ── CROWN — yOur Golden Dream ── */}
          <CrownSection />

          {/* seam — sunlight bleeding into the canopy */}
          <AnatomicalSeam variant="crown-canopy" />

          {/* breath — seed beneath earth */}
          <BreathingChamber whisper="Every root begins in silence." tone="soil" drift={-4} />

          {/* ── CANOPY — Council of Life ── */}
          <CanopySection />

          {/* seam — branches tapering into bark */}
          <AnatomicalSeam variant="canopy-trunk" />

          {/* ── TRUNK — HeARTwood Library ── */}
          <TrunkSection />

          {/* seam — heartwood flaring into soil */}
          <AnatomicalSeam variant="trunk-ground" />

          {/* breath — heartwood remembers */}
          <BreathingChamber whisper="The forest remembers slowly." tone="wood" drift={6} />
        </Suspense>

        {/* ── SEED — S33D Gateway Hero (the central seed layer) ── */}
        <Suspense fallback={<SectionShimmer />}>
          <GroundSection threshold={parchment ? <div className="seed-threshold"><span className="parchment-kicker">The Seed · the middle of the living Tree</span><h2>One Tree. Many ways to begin.</h2><p>S33D connects ancient trees, the people who care for them and the stories they carry. You are at the Seed: the Crown, Canopy and Heartwood are above; the Ancient Friends and their roots are below.</p><nav aria-label="Wander up or down the Tree"><button onClick={() => scrollToSection("heartwood")}>↑ Climb into Heartwood</button><button onClick={() => scrollToSection("atlas-content")}>Descend to the Roots ↓</button></nav><TeotagMarginNote>Begin where you are. Let curiosity show you the next door.</TeotagMarginNote><Link className="seed-real-friend" to="/tree/2e4ef3b8-01b7-4f8c-925f-924b259a0df5">Meet a real Ancient Friend · Fortingall Yew →</Link></div> : undefined} />
        </Suspense>

        {/* seam — soil dissolving into mycelium */}
        <Suspense fallback={null}>
          <AnatomicalSeam variant="ground-roots" />
        </Suspense>
        {/* ── Interaction Layers — Offerings, Whispers, Tree Radio ── */}
        <Suspense fallback={<SectionShimmer />}>
          <ForestInteractionLayers />
        </Suspense>

        {/* breath — light gathers */}
        <Suspense fallback={null}>
          <BreathingChamber whisper="Light gathers patiently in the canopy." tone="light" drift={-3} />
        </Suspense>

        {/* ── Discovery shortcuts — Countries & Hives ── */}
        <DiscoveryRow />

        {/* ── ROOTS — Atlas Content (Ancient Friends Network) ── */}
        <Suspense fallback={<SectionShimmer />}>
          <div id="atlas-content" className="relative overflow-hidden">
            <SectionAtmosphere theme="roots" />
            {/* Organic root-tendril divider */}
            <div className="relative max-w-md mx-auto my-8" aria-hidden>
              <svg viewBox="0 0 400 24" className="w-full h-6 opacity-[0.18]" preserveAspectRatio="none">
                <path d="M0 12 Q40 4, 80 12 T160 12 T240 12 T320 12 T400 12" fill="none" stroke="hsl(25 40% 35%)" strokeWidth="0.8" />
                <path d="M60 12 Q90 18, 120 12 T180 14 T240 10 T300 12 T360 12" fill="none" stroke="hsl(25 35% 30%)" strokeWidth="0.5" />
                <circle cx="200" cy="12" r="2" fill="hsl(25 40% 35% / 0.3)" />
                <circle cx="120" cy="13" r="1.2" fill="hsl(25 40% 35% / 0.2)" />
                <circle cx="280" cy="11" r="1.2" fill="hsl(25 40% 35% / 0.2)" />
              </svg>
            </div>

            {/* Ancient Friends anchor moved up into GroundSection (above the Living Atlas explanation). */}

            <EcosystemOverview />
            <div className="section-divider max-w-xl mx-auto" />
            {parchment && <section className="seed-pathways"><span className="parchment-kicker">Follow a living thread</span><h2>An encounter can travel through the Tree.</h2><p>Meet a tree. Leave an offering. Carry its memory into Heartwood. Bring a question to the Council. Follow what grows in the Crown.</p><nav className="s33d-paths" aria-label="Choose your starting path"><Link to="/map"><strong>I’m here to discover</strong><span>Meet Ancient Friends in the Atlas.</span></Link><Link to="/library"><strong>I’m here to share</strong><span>Find a room for music, stories and memory.</span></Link><Link to="/support"><strong>I’m here to help</strong><span>Find ways to care for the growing grove.</span></Link></nav></section>}
            <ParticipationSection />
            <SupportDiscoveryRow />
            <RootPulse />
            <WisdomOfTheGrove />
          </div>
        </Suspense>

      </main>

      <Suspense fallback={null}>
        <TetolBridge />
        {!parchment && <ContextualWhisper
          id="home-explore"
          message="Every ancient tree has a story. Tap the Atlas to discover one near you."
          cta={{ label: "Open Atlas", to: "/map" }}
          delay={8000}
          position="bottom-center"
        />}
      </Suspense>

      <Footer />
      {/* Bottom safe area spacer for standalone PWA mode */}
      <div className="shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }} />
    </div>
  );
};

export default Index;
