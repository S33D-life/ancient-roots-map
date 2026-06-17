import { useState, useCallback, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/lib/routes";
import { useMapFocus } from "@/hooks/use-map-focus";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import TetolBridge from "@/components/TetolBridge";
import { ScrollText, Users, Podcast, BarChart3, TreePine, MapPin, Sparkles, Flame, Archive } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LevelEntrance from "@/components/LevelEntrance";
import { useEntranceOnce } from "@/hooks/use-entrance-once";
import { HostAPodModal } from "@/components/HostAPodModal";
import DigitalFireVote from "@/components/DigitalFireVote";
import NextCouncilCard from "@/components/council/NextCouncilCard";
import CuratorEditor from "@/components/council/CuratorEditor";
import CouncilQuickView from "@/components/council/CouncilQuickView";
import CouncilCalendar from "@/components/council/CouncilCalendar";
import { HeartwoodChamber } from "@/components/library/HeartwoodChamber";
import { useCouncilInvitation } from "@/hooks/use-council-invitation";
import { getCurrentCouncilWithOverrides } from "@/data/council/curatorOverrides";

import councilHomeBg from "@/assets/council-home-bg.jpeg";
import CouncilRoom from "@/components/CouncilRoom";

const CouncilOfLifePage = () => {
  useDocumentTitle("Council of Life");
  const navigate = useNavigate();
  const { focusMap } = useMapFocus();
  
  const { showEntrance, dismissEntrance } = useEntranceOnce("council");
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [podModalOpen, setPodModalOpen] = useState(false);
  const [linkedTrees, setLinkedTrees] = useState<Array<{ id: string; name: string; species: string }>>([]);
  const [linkedRegions, setLinkedRegions] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [curatorOpen, setCuratorOpen] = useState(false);
  const [curatorRefreshKey, setCuratorRefreshKey] = useState(0);
  const invitation = useCouncilInvitation(curatorRefreshKey);

  useEffect(() => {
    supabase
      .from("council_trees")
      .select("tree_id, trees:tree_id(id, name, species)")
      .limit(12)
      .then(({ data }) => {
        if (data) setLinkedTrees(data.map((d: any) => d.trees).filter(Boolean));
      });
    supabase
      .from("council_bio_regions")
      .select("bio_region_id, bio_regions:bio_region_id(id, name, type)")
      .limit(8)
      .then(({ data }) => {
        if (data) setLinkedRegions(data.map((d: any) => d.bio_regions).filter(Boolean));
      });
  }, []);

  const handleEntranceComplete = useCallback(() => dismissEntrance(), [dismissEntrance]);

  if (showEntrance) {
    return <LevelEntrance phases={[{ src: councilHomeBg, alt: "The Canopy" }]} phaseDuration={1200} fadeDuration={600} onComplete={handleEntranceComplete} />;
  }

  // Council Chamber view
  if (activeRoom === "chamber" || activeRoom === "chamber-live") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-28 pb-8 px-4">
          <div className="max-w-5xl mx-auto">
            <Button variant="ghost" size="sm" onClick={() => setActiveRoom(null)} className="text-muted-foreground hover:text-foreground mb-4">
              ← Back to Council
            </Button>
            <CouncilRoom />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Header />
      <main className="relative pt-20 pb-8 px-safe">
        <TetolBreadcrumb />
        <div className="absolute inset-0 z-0">
          <img src={councilHomeBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/90" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-16 pb-12">
          {/* Hero */}
          <h1 className="text-4xl md:text-5xl font-serif text-center mb-3 tracking-wider drop-shadow-lg">
            Council of Life
          </h1>
          <p className="text-center text-muted-foreground mb-10 text-lg font-serif italic">
            Gather Around The Ancient Fire
          </p>

          {/* ── 1. Next Gathering — primary entry ── */}
          <section aria-labelledby="next-gathering" className="mb-14">
            <h2 id="next-gathering" className="font-serif text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-4 text-center">
              Next Gathering
            </h2>
            <NextCouncilCard
              onJoinCouncil={() => setActiveRoom("chamber")}
              refreshKey={curatorRefreshKey}
              onEditCouncil={() => setCuratorOpen(true)}
            />
          </section>

          {/* ── 2. Reflection — heart of the Council experience ── */}
          <section aria-labelledby="reflection" className="mb-16">
            <h2 id="reflection" className="font-serif text-[11px] tracking-[0.2em] uppercase text-muted-foreground/60 mb-4 text-center">
              Reflection
            </h2>
            <Card className="relative bg-card/70 backdrop-blur-sm border-primary/30 overflow-hidden shadow-[0_0_32px_-14px_hsl(var(--primary)/0.55)]">
              <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/15" />
              <CardContent className="p-7 md:p-10 text-center">
                <h3 className="font-serif text-[11px] tracking-[0.2em] uppercase text-primary/70 mb-4 flex items-center justify-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> The Time Tree
                </h3>
                <p className="text-lg md:text-2xl font-serif italic text-foreground/90 leading-[1.55] mb-7 max-w-xl mx-auto">
                  "{invitation.timeTreeQuestion}"
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs font-serif tracking-wide gap-1.5 border-primary/40"
                  onClick={() => navigate("/time-tree")}
                >
                  <Sparkles className="h-3 w-3" /> Reflect — Offer to the Time Tree
                </Button>
              </CardContent>
            </Card>
          </section>

          {/* ── 3. Everything Else — collapsed by default ── */}
          <div className="space-y-4">
            {/* Council Scroll */}
            <HeartwoodChamber
              title="Council Scroll"
              caption="The full invitation, focus areas, and context for this cycle."
              icon={<ScrollText className="w-4 h-4 text-primary" />}
              collapsible
              defaultOpen={false}
              tone="warm"
            >
              <CouncilQuickView invitation={invitation} />
            </HeartwoodChamber>

            {/* Council Archive — calendar + linked trees & bio-regions */}
            <HeartwoodChamber
              title="Council Archive"
              caption="Upcoming gatherings, council trees, and bio-regions."
              icon={<Archive className="w-4 h-4 text-primary" />}
              collapsible
              defaultOpen={false}
              tone="cool"
            >
              <div className="space-y-6">
                <CouncilCalendar />
                {linkedTrees.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                      <TreePine className="h-3 w-3" /> Council Trees
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {linkedTrees.map((t) => (
                        <button key={t.id} onClick={() => focusMap({ type: "tree", id: t.id, source: "tree" })} className="text-xs font-serif px-3 py-1.5 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card/40">
                          {t.name} <span className="text-muted-foreground/50">· {t.species}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {linkedRegions.length > 0 && (
                  <div>
                    <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3 flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" /> Bio-Regions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {linkedRegions.map((r) => (
                        <button key={r.id} onClick={() => navigate(`/atlas/bio-regions/${r.id}`)} className="text-xs font-serif px-3 py-1.5 rounded-lg border border-border/30 hover:border-primary/30 transition-colors bg-card/40">
                          {r.name} <span className="text-muted-foreground/50">· {r.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </HeartwoodChamber>

            {/* Stewardship Tools */}
            <HeartwoodChamber
              title="Stewardship Tools"
              caption="Host a local circle or shape the rhythm of future gatherings."
              icon={<Users className="w-4 h-4 text-primary" />}
              collapsible
              defaultOpen={false}
              tone="muted"
            >
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setPodModalOpen(true)}
                  className="relative text-left rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-colors p-4"
                >
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[9px] px-1.5 py-0">Soon</Badge>
                  <Podcast className="h-5 w-5 text-muted-foreground mb-2" />
                  <div className="font-serif text-sm tracking-wide">Host a Pod</div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5">Grow a local circle</div>
                </button>
                <button
                  onClick={() => navigate("/library/rhythms")}
                  className="text-left rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-colors p-4"
                >
                  <BarChart3 className="h-5 w-5 text-primary/70 mb-2" />
                  <div className="font-serif text-sm tracking-wide">City Markets</div>
                  <div className="text-[11px] text-muted-foreground/70 mt-0.5">Shape the rhythm of gatherings</div>
                </button>
              </div>
            </HeartwoodChamber>

            {/* Emerging Practices */}
            <HeartwoodChamber
              title="Emerging Practices"
              caption="Digital Fire and Lunar Vote — shape what the Council attends to next."
              icon={<Flame className="w-4 h-4 text-primary" />}
              collapsible
              defaultOpen={false}
              tone="warm"
            >
              <DigitalFireVote />
            </HeartwoodChamber>

            {/* Past Gatherings */}
            <HeartwoodChamber
              title="Past Gatherings"
              caption="Walk the archives of past circles."
              icon={<ScrollText className="w-4 h-4 text-primary" />}
              collapsible
              defaultOpen={false}
              tone="muted"
            >
              <button
                onClick={() => navigate("/council/records")}
                className="w-full text-left rounded-lg border border-border/30 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-colors p-4"
              >
                <div className="font-serif text-sm tracking-wide">Council Records →</div>
                <div className="text-[11px] text-muted-foreground/70 mt-0.5">Open the full archive of past gatherings</div>
              </button>
            </HeartwoodChamber>
          </div>

          {/* Loop-closure: cross-links */}
          <div className="mt-12 rounded-xl border border-border/20 bg-card/30 p-4 space-y-3">
            <h3 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50">
              Continue the cycle
            </h3>
            <p className="text-[10px] text-muted-foreground/40 font-serif">
              Council → Reflection → Harvest → Exchange → New Encounters
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => navigate("/time-tree")} className="loop-card font-serif">
                <span className="text-primary">🌳 Time Tree</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Offer to the Time Tree</p>
              </button>
              <button onClick={() => navigate(ROUTES.VALUE_TREE)} className="loop-card font-serif">
                <span className="text-primary">❤️ Value Tree</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">See how Hearts flow</p>
              </button>
              <button onClick={() => navigate(ROUTES.MAP)} className="loop-card font-serif">
                <span className="text-primary">🗺️ Atlas</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Map an Ancient Friend</p>
              </button>
              <button onClick={() => navigate(ROUTES.LIBRARY)} className="loop-card font-serif">
                <span className="text-primary">📚 Heartwood</span>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">Wishing Tree & offerings</p>
              </button>
            </div>
          </div>
        </div>

        <TetolBridge />
      </main>
      <Footer />
      <HostAPodModal open={podModalOpen} onOpenChange={setPodModalOpen} />
      <CuratorEditor
        open={curatorOpen}
        onOpenChange={setCuratorOpen}
        council={getCurrentCouncilWithOverrides()}
        onSaved={() => setCuratorRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default CouncilOfLifePage;
