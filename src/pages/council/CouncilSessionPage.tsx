import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { COUNCIL_CYCLES, getCurrentCouncil, moonEmoji, moonLabel, formatGatheringDate, formatMarkerDate } from "@/data/council/councilCycles";
import { hasParticipatedInCouncil, markCouncilParticipation, getCouncilParticipation, COUNCIL_HEARTS_REWARD } from "@/data/council/councilParticipation";
import EarlyCouncilRecognition from "@/components/council/EarlyCouncilRecognition";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Leaf, FolderTree, Lightbulb, Heart, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

type SessionTiming = "current" | "future" | "past";

function getSessionTiming(sessionId: string): SessionTiming {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const current = getCurrentCouncil();
  if (sessionId === current.id) return "current";
  const session = COUNCIL_CYCLES.find((c) => c.id === sessionId);
  if (!session) return "past";
  return new Date(session.gatheringDate) >= today ? "future" : "past";
}

export default function CouncilSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const session = COUNCIL_CYCLES.find((c) => c.id === id);
  const [participated, setParticipated] = useState(() =>
    id ? hasParticipatedInCouncil(id) : false,
  );

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

  const timing = getSessionTiming(session.id);
  const participation = getCouncilParticipation(session.id);

  const handleMarkParticipation = () => {
    markCouncilParticipation(session.id, COUNCIL_HEARTS_REWARD);
    setParticipated(true);
    toast.success("Presence received 🌱", {
      description: `+${COUNCIL_HEARTS_REWARD} S33D Hearts will flow to you`,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="pt-28 pb-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/council/records")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Council Records
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/council-of-life")}
              className="text-muted-foreground/60 hover:text-foreground text-xs"
            >
              🌑 Current Council
            </Button>
          </div>
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

          {/* ── Participation Reward Section ── */}
          {timing === "current" && (
            <Card className={`mb-4 backdrop-blur-sm ${participated ? "bg-primary/5 border-primary/30" : "bg-card/60 border-primary/20"}`}>
              <CardContent className="p-5">
                <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-2 flex items-center gap-1.5">
                  <Heart className="h-3 w-3 text-primary" /> Council Participation
                </h2>
                {participated ? (
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-serif text-foreground/80">Presence received 🌱</p>
                      <p className="text-xs text-muted-foreground/60 leading-relaxed mt-0.5">
                        You are part of this gathering<br />
                        +{participation?.heartsAmount ?? COUNCIL_HEARTS_REWARD} S33D Hearts will flow to you
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-serif text-muted-foreground mb-3">
                      Step into this circle and receive S33D Hearts.
                    </p>
                    <Button
                      size="sm"
                      className="text-xs font-serif gap-1.5"
                      onClick={handleMarkParticipation}
                    >
                      <Heart className="h-3 w-3" /> I'm here for this council
                      <span className="text-primary-foreground/70 ml-1">+{COUNCIL_HEARTS_REWARD} ❤️</span>
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {timing === "future" && (
            <Card className="bg-card/40 backdrop-blur-sm border-border/20 mb-4">
              <CardContent className="p-5">
                <h2 className="font-serif text-xs tracking-[0.15em] uppercase text-muted-foreground/50 mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/50" /> Council Participation
                </h2>
                <p className="text-xs font-serif text-muted-foreground/60">
                  Rewards open when this gathering becomes active.
                </p>
              </CardContent>
            </Card>
          )}

          {timing === "past" && (
            <EarlyCouncilRecognition sessionId={session.id} />
          )}

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
