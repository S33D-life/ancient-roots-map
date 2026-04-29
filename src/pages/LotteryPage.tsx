/**
 * LotteryPage — /lottery — twin-moon lottery surface.
 *
 * Sections (top to bottom on mobile):
 *   A. Next-draw countdown hero
 *   B. Your position (stake / tickets / lifetime)
 *   C. Past Moons — recent completed draws
 *   D. How it works
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageShell from "@/components/PageShell";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { supabase } from "@/integrations/supabase/client";
import { useLotteryStats } from "@/hooks/use-lottery";
import LotteryNextDrawHero from "@/components/lottery/LotteryNextDrawHero";
import LotteryPositionCards from "@/components/lottery/LotteryPositionCards";
import LotteryRecentDraws from "@/components/lottery/LotteryRecentDraws";
import LotteryHowItWorks from "@/components/lottery/LotteryHowItWorks";

const LotteryPage = () => {
  useDocumentTitle("Twin Moons & Four Suns — Lottery & Yield");
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
      setAuthReady(true);
      if (!session) navigate("/auth");
    });
  }, [navigate]);

  const { data: stats, isLoading } = useLotteryStats();

  if (!authReady || !hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-background">
      <Header />
      <main
        className="container mx-auto px-4 pb-24 relative z-10"
        style={{ paddingTop: "var(--content-top)" }}
      >
        <PageShell>
          <div className="max-w-3xl mx-auto space-y-8">
            <TetolBreadcrumb />

            {/* Page intro */}
            <header className="space-y-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/70 font-serif">
                Twin Moons
              </p>
              <h1 className="text-3xl sm:text-4xl font-serif text-foreground tracking-wide">
                The Lottery of the Moons
              </h1>
              <p className="text-sm font-serif text-muted-foreground italic max-w-lg mx-auto leading-relaxed">
                Stake hearts at trees to earn yield. Earn hearts to gather tickets.
                The forest shares what has gathered at every new and full moon.
              </p>
            </header>

            {/* A. Next draw countdown */}
            <section aria-labelledby="next-draw-heading">
              <h2 id="next-draw-heading" className="sr-only">Next draw</h2>
              <LotteryNextDrawHero draw={stats?.nextDraw ?? null} />
            </section>

            {/* B. Your position */}
            <section aria-labelledby="your-position-heading" className="space-y-3">
              <h2
                id="your-position-heading"
                className="text-xs font-serif uppercase tracking-[0.18em] text-muted-foreground px-1"
              >
                Your Position
              </h2>
              {isLoading || !stats ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-40 rounded-2xl bg-card/20 animate-pulse" />
                  ))}
                </div>
              ) : (
                <LotteryPositionCards stats={stats} />
              )}
            </section>

            {/* C. Past Moons */}
            <section aria-labelledby="past-moons-heading" className="space-y-3">
              <h2
                id="past-moons-heading"
                className="text-xs font-serif uppercase tracking-[0.18em] text-muted-foreground px-1"
              >
                Past Moons
              </h2>
              <LotteryRecentDraws />
            </section>

            {/* D. How it works */}
            <section aria-labelledby="how-it-works-heading">
              <h2 id="how-it-works-heading" className="sr-only">How it works</h2>
              <LotteryHowItWorks />
            </section>
          </div>
        </PageShell>
      </main>
      <Footer />
    </div>
  );
};

export default LotteryPage;
