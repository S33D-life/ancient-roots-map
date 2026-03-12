/**
 * HeartwoodLanding — the atmospheric entrance to the Heartwood Library.
 * Now navigates to standalone room routes instead of setting internal tab state.
 */
import { lazy, Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Smartphone, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import HeartwoodBackground from "@/components/HeartwoodBackground";
import LibraryRoomGrid, { EmberDrift } from "@/components/LibraryRoomGrid";
import LibraryVaultPreview from "@/components/LibraryVaultPreview";
import Footer from "@/components/Footer";
import TetolBridge from "@/components/TetolBridge";
import CompanionPairDialog from "@/components/companion/CompanionPairDialog";
import { useIsMobile } from "@/hooks/use-mobile";

const MantleClock = lazy(() => import("@/components/MantleClock"));

const HeartwoodLanding = () => {
  const navigate = useNavigate();

  const handleRoomSelect = (key: string) => {
    // Map room grid keys to routes
    const routeMap: Record<string, string> = {
      "staff-room": "/library/staff-room",
      "gallery": "/library/gallery",
      "music-room": "/library/music-room",
      "greenhouse": "/library/greenhouse",
      "wishlist": "/library/wishlist",
      "seed-cellar": "/library/seed-cellar",
      "creators-path": "/library/creators-path",
      "ledger": "/library/scrolls",
      "scrolls": "/library/scrolls",
      "rhythms": "/library/rhythms",
      "vault": "/library/vault",
      "bookshelf": "/library/bookshelf",
      "press": "/press",
      "tree-resources": "/ledger",
    };
    navigate(routeMap[key] || `/library/${key}`);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <Header />
      <HeartwoodBackground />

      <div className="relative z-10 flex flex-col items-center min-h-screen pt-24 pb-12 px-4">
        {/* ── The Hearth — Opening Section ────────────── */}
        <div className="relative flex flex-col items-center mb-10 max-w-xl text-center">
          <div
            className="absolute inset-0 -inset-x-16 -inset-y-8 pointer-events-none motion-safe:animate-[titleBreathe_6s_ease-in-out_infinite]"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 50% 45%, hsl(38 70% 40% / 0.18), hsl(30 60% 25% / 0.06) 55%, transparent 80%)',
              filter: 'blur(24px)',
            }}
          />
          <h1
            className="relative text-5xl md:text-7xl font-serif tracking-wider mb-3"
            style={{
              color: 'hsl(38 75% 65%)',
              textShadow: '0 0 50px hsl(38 80% 35% / 0.5), 0 2px 20px hsl(25 60% 20% / 0.6), 0 0 2px hsl(20 20% 8% / 0.9)',
            }}
          >
            HEARTWOOD
          </h1>
          <p
            className="relative font-serif text-base md:text-lg mb-6"
            style={{ color: 'hsl(38 50% 75% / 0.7)', textShadow: '0 1px 8px hsl(20 20% 8% / 0.8)' }}
          >
            The living centre. All rooms branch from the Heart.
          </p>
          <p
            className="relative font-serif text-sm leading-relaxed max-w-md mb-8"
            style={{ color: 'hsl(38 35% 65% / 0.55)' }}
          >
            This is where the fire burns quietly — where your journey is remembered,
            your offerings are kept, and the grove grows from every heart that visits.
          </p>
        </div>

        <style>{`
          @keyframes titleBreathe {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.06); }
          }
        `}</style>

        {/* ── Hearth Mantle ── */}
        <div className="relative w-full max-w-md mx-auto mb-8">
          <div
            className="relative flex flex-col items-center pt-4 pb-6 rounded-2xl"
            style={{
              background: 'linear-gradient(180deg, hsl(25 18% 10% / 0.6), hsl(20 15% 8% / 0.3))',
              borderBottom: '1px solid hsl(42 35% 25% / 0.2)',
              boxShadow: '0 8px 32px hsl(20 30% 5% / 0.4), inset 0 1px 0 hsl(42 30% 30% / 0.06)',
            }}
          >
            <EmberDrift />
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, hsl(30 60% 30% / 0.12), transparent 70%)' }}
            />
            <Suspense fallback={
              <div className="w-[120px] h-[120px] rounded-full" style={{ background: 'hsl(42 30% 15% / 0.3)' }} />
            }>
              <MantleClock />
            </Suspense>
            <p
              className="font-serif text-[10px] tracking-[0.3em] uppercase mt-3 select-none"
              style={{ color: 'hsl(42 30% 45% / 0.3)' }}
            >
              seasonal time
            </p>
          </div>
        </div>

        {/* First-time Companion hint — desktop only */}
        <CompanionHint />

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => navigate("/map")}
            className="px-5 py-2.5 rounded-lg font-serif text-sm tracking-wide transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, hsl(38 60% 35%), hsl(30 50% 25%))',
              color: 'hsl(38 80% 85%)',
              border: '1px solid hsl(38 50% 40% / 0.5)',
            }}
          >
            Enter the Map
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 rounded-lg font-serif text-sm tracking-wide transition-all duration-300 hover:scale-105"
            style={{
              background: 'hsl(25 20% 12% / 0.8)',
              color: 'hsl(38 50% 70%)',
              border: '1px solid hsl(38 40% 30% / 0.4)',
            }}
          >
            Your Hearth
          </button>
          <CompanionPairDialog
            className="px-5 py-2.5 rounded-lg font-serif text-sm tracking-wide transition-all duration-300 hover:scale-105"
          />
          <button
            onClick={() => navigate("/value-tree?tab=earn")}
            className="px-5 py-2.5 rounded-lg font-serif text-sm tracking-wide transition-all duration-300 hover:scale-105"
            style={{
              background: 'hsl(25 20% 12% / 0.8)',
              color: 'hsl(38 50% 70%)',
              border: '1px solid hsl(38 40% 30% / 0.4)',
            }}
          >
            Active Opportunities
          </button>
          <button
            onClick={() => navigate("/vault?from=hearth")}
            className="px-5 py-2.5 rounded-lg font-serif text-sm tracking-wide transition-all duration-300 hover:scale-105"
            style={{
              background: 'hsl(25 20% 12% / 0.8)',
              color: 'hsl(38 50% 70%)',
              border: '1px solid hsl(38 40% 30% / 0.4)',
            }}
          >
            Your Vault
          </button>
        </div>

        {/* Vault Preview */}
        <div className="w-full max-w-2xl mb-10">
          <LibraryVaultPreview />
        </div>

        {/* Room Grid */}
        <LibraryRoomGrid onRoomSelect={handleRoomSelect} />
      </div>

      <TetolBridge />
      <Footer />
    </div>
  );
};

/** Dismissible first-time companion hint — desktop only */
function CompanionHint() {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("s33d_companion_hint_dismissed") === "1"; } catch { return false; }
  });

  if (isMobile || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try { localStorage.setItem("s33d_companion_hint_dismissed", "1"); } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex items-center gap-3 px-4 py-2.5 rounded-xl border mb-6 max-w-md"
        style={{
          background: 'hsl(var(--primary) / 0.06)',
          borderColor: 'hsl(var(--primary) / 0.2)',
        }}
      >
        <Smartphone className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--primary))' }} />
        <p className="text-xs font-serif" style={{ color: 'hsl(var(--foreground) / 0.7)' }}>
          Try connecting your phone as a <span style={{ color: 'hsl(var(--primary))' }}>Companion</span> — use it to explore S33D hands-free.
        </p>
        <button
          onClick={dismiss}
          className="p-1 rounded-full shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
          aria-label="Dismiss hint"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export default HeartwoodLanding;
