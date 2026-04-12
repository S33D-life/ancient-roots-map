import { useParams, useNavigate } from "react-router-dom";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { COUNCIL_CYCLES, moonEmoji, moonLabel, formatGatheringDate, formatMarkerDate } from "@/data/council/councilCycles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Leaf, FolderTree, Lightbulb } from "lucide-react";

export default function CouncilSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = COUNCIL_CYCLES.find((c) => c.id === id);

  useDocumentTitle(session ? session.title : "Council Session");

  if (!session) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="pt-28 pb-12 px-4 text-center">
          <p className="text-muted-foreground font-serif">Session not found.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate("/council/records")}>
            ← Back to Records
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/council/records")}
            className="text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Council Records
          </Button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">{moonEmoji(session.moonPhase)}</span>
            <h1 className="text-2xl md:text-3xl font-serif tracking-wider">{session.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-1">
            {formatGatheringDate(session.gatheringDate)} · {session.time}
          </p>
          <p className="text-xs text-muted-foreground/50 mb-6">
            {moonLabel(session.moonPhase)} · {formatMarkerDate(session.markerDate)} · Curated by {session.curator}
          </p>

          {/* Invocation */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/30 mb-4">
            <CardContent className="p-5">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
                Invocation
              </h2>
              <p className="text-sm font-serif italic text-muted-foreground leading-relaxed">
                "{session.agenda.invocation}"
              </p>
            </CardContent>
          </Card>

          {/* This Moon */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/30 mb-4">
            <CardContent className="p-5">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-2">
                This Moon
              </h2>
              <p className="text-sm font-serif text-foreground/80 leading-relaxed">
                {session.agenda.thisMoon}
              </p>
            </CardContent>
          </Card>

          {/* Time Tree Question */}
          <Card className="bg-card/60 backdrop-blur-sm border-primary/20 mb-4">
            <CardContent className="p-5">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-primary" /> The Time Tree
              </h2>
              <p className="text-sm font-serif italic text-foreground/80 leading-relaxed mb-3">
                "{session.agenda.timeTreeQuestion}"
              </p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif"
                onClick={() => navigate("/time-tree")}
              >
                <Sparkles className="h-3 w-3 mr-1" /> Visit the Time Tree
              </Button>
            </CardContent>
          </Card>

          {/* Focus Areas */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/30 mb-4">
            <CardContent className="p-5">
              <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
                Focus Areas
              </h2>
              <ul className="space-y-2">
                {session.agenda.focusAreas.map((area, i) => (
                  <li key={i} className="text-sm text-foreground/80 font-serif flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5">·</span>
                    {area}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Highlights */}
          {session.highlights && Object.values(session.highlights).some(Boolean) && (
            <Card className="bg-card/60 backdrop-blur-sm border-border/30 mb-4">
              <CardContent className="p-5">
                <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
                  In Focus This Cycle
                </h2>
                <div className="space-y-2">
                  {session.highlights.plant && (
                    <div className="flex items-center gap-2 text-sm font-serif text-foreground/80">
                      <Leaf className="h-3.5 w-3.5 text-primary/60" />
                      <span>{session.highlights.plant}</span>
                    </div>
                  )}
                  {session.highlights.tree && (
                    <div className="flex items-center gap-2 text-sm font-serif text-foreground/80">
                      <FolderTree className="h-3.5 w-3.5 text-primary/60" />
                      <span>{session.highlights.tree}</span>
                    </div>
                  )}
                  {session.highlights.project && (
                    <div className="flex items-center gap-2 text-sm font-serif text-foreground/80">
                      <Lightbulb className="h-3.5 w-3.5 text-primary/60" />
                      <span>{session.highlights.project}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
