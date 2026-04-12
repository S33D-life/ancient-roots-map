import { useDocumentTitle } from "@/hooks/use-document-title";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TetolBreadcrumb from "@/components/TetolBreadcrumb";
import { COUNCIL_CYCLES, type CouncilSession, getCurrentCouncil, moonEmoji, moonLabel, formatGatheringDate, formatMarkerDate } from "@/data/council/councilCycles";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Leaf, FolderTree, Lightbulb } from "lucide-react";
import { useState } from "react";

type Filter = "all" | "new" | "full";

function groupCycles() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = getCurrentCouncil();

  const past: CouncilSession[] = [];
  const upcoming: CouncilSession[] = [];

  for (const c of COUNCIL_CYCLES) {
    if (c.id === current.id) continue;
    if (new Date(c.gatheringDate) < today) {
      past.push(c);
    } else {
      upcoming.push(c);
    }
  }

  return { current, upcoming, past: past.reverse() };
}

function RecordCard({ session, badge }: { session: CouncilSession; badge?: string }) {
  const navigate = useNavigate();
  return (
    <Card
      className="bg-card/60 backdrop-blur-sm border-border/50 cursor-pointer hover:bg-card/80 hover:border-primary/40 transition-all duration-300"
      onClick={() => navigate(`/council/records/${session.id}`)}
    >
      <CardHeader className="p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-lg" aria-label={moonLabel(session.moonPhase)}>
            {moonEmoji(session.moonPhase)}
          </span>
          {badge && (
            <Badge
              variant={badge === "Current" ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0.5"
            >
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="text-base font-serif tracking-wide">{session.title}</CardTitle>
        <CardDescription className="text-xs space-y-0.5">
          <span className="block">{formatGatheringDate(session.gatheringDate)}</span>
          <span className="block text-muted-foreground/50">
            {moonLabel(session.moonPhase)} · {formatMarkerDate(session.markerDate)}
          </span>
        </CardDescription>
        <p className="text-xs text-muted-foreground/70 line-clamp-2 font-serif italic mt-1">
          {session.agenda.thisMoon}
        </p>
        {session.highlights && (
          <div className="flex flex-wrap gap-2 mt-1.5">
            {session.highlights.plant && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Leaf className="h-2.5 w-2.5" /> {session.highlights.plant}
              </span>
            )}
            {session.highlights.tree && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <FolderTree className="h-2.5 w-2.5" /> {session.highlights.tree}
              </span>
            )}
            {session.highlights.project && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground/50">
                <Lightbulb className="h-2.5 w-2.5" /> {session.highlights.project}
              </span>
            )}
          </div>
        )}
      </CardHeader>
    </Card>
  );
}

export default function CouncilRecordsPage() {
  useDocumentTitle("Council Records");
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");

  const { current, upcoming, past } = groupCycles();

  const matchesFilter = (s: CouncilSession) =>
    filter === "all" || s.moonPhase === filter;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-12 px-4">
        <TetolBreadcrumb />
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/council-of-life")}
            className="text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Council of Life
          </Button>

          <h1 className="text-3xl md:text-4xl font-serif tracking-wider mb-2">Council Records</h1>
          <p className="text-muted-foreground font-serif italic text-sm mb-1">
            Walk the memory of past circles
          </p>
          <p className="text-muted-foreground/50 text-xs font-serif mb-8 max-w-md">
            Each moon-marked gathering becomes part of the living archive — a growing record of shared stewardship.
          </p>

          {/* Moon filter */}
          <div className="flex gap-2 mb-8">
            {(["all", "new", "full"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs font-serif px-3 py-1.5 rounded-full border transition-colors ${
                  filter === f
                    ? "border-primary/60 bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {f === "all" ? "All" : f === "new" ? "🌑 New Moon" : "🌕 Full Moon"}
              </button>
            ))}
          </div>

          {/* Current */}
          {matchesFilter(current) && (
            <section className="mb-8">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
                Current
              </h2>
              <RecordCard session={current} badge="Current" />
            </section>
          )}

          {/* Upcoming */}
          {upcoming.filter(matchesFilter).length > 0 && (
            <section className="mb-8">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
                Upcoming
              </h2>
              <div className="space-y-3">
                {upcoming.filter(matchesFilter).map((s) => (
                  <RecordCard key={s.id} session={s} badge="Next" />
                ))}
              </div>
            </section>
          )}

          {/* Past */}
          {past.filter(matchesFilter).length > 0 && (
            <section>
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
                Past Gatherings
              </h2>
              <div className="space-y-3">
                {past.filter(matchesFilter).map((s) => (
                  <RecordCard key={s.id} session={s} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
