import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MoonStar, CalendarDays, Clock, Mic, ChevronDown, ChevronUp, Video } from "lucide-react";
import CouncilScrollEmbed from "./CouncilScrollEmbed";
import {
  getCurrentCouncilWithOverrides,
  getNextCouncilWithOverrides,
  hasCuratorOverride,
} from "@/data/council/curatorOverrides";
import {
  formatGatheringDate,
  formatMarkerDate,
  moonEmoji,
  moonLabel,
} from "@/data/council/councilCycles";

interface NextCouncilCardProps {
  onJoinCouncil: () => void;
  /** Increment to force re-read after curator save */
  refreshKey?: number;
  onEditCouncil?: () => void;
}

const AGENDA_OPEN_KEY = "council_agenda_open";

const NextCouncilCard = ({ onJoinCouncil, refreshKey, onEditCouncil }: NextCouncilCardProps) => {
  const [agendaOpen, setAgendaOpen] = useState(() => {
    try {
      const stored = localStorage.getItem(AGENDA_OPEN_KEY);
      if (stored !== null) return stored === "true";
      // First visit: open by default, mirroring previous behavior.
      return !localStorage.getItem("council_agenda_seen");
    } catch {
      return false;
    }
  });
  const prefersReducedMotion = (() => {
    try {
      return typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  })();
  const navigate = useNavigate();

  const handleAgendaChange = (open: boolean) => {
    setAgendaOpen(open);
    try {
      localStorage.setItem(AGENDA_OPEN_KEY, open ? "true" : "false");
      if (open) localStorage.setItem("council_agenda_seen", "true");
    } catch {}
  };

  // Re-read when refreshKey changes (after curator save)
  const current = getCurrentCouncilWithOverrides();
  const next = getNextCouncilWithOverrides();
  const isDraft = hasCuratorOverride(current.id);

  return (
    <div className="space-y-4">
      {/* Main invitation card */}
      <Card className="relative bg-card/70 backdrop-blur-sm border-primary/30 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
        <CardHeader className="p-5 md:p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                Next Gathering
              </Badge>
              {isDraft && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Curator Draft
                </Badge>
              )}
              {onEditCouncil && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEditCouncil(); }}
                  className="text-[10px] font-serif text-muted-foreground/40 hover:text-primary/60 transition-colors underline underline-offset-2"
                >
                  Edit
                </button>
              )}
              <CardTitle className="text-xl md:text-2xl font-serif tracking-wide">
                Next Council of Life
              </CardTitle>
              <CardDescription className="text-sm font-serif italic mt-1">
                Invitation &amp; Agenda
              </CardDescription>
            </div>
            <MoonStar className="h-8 w-8 text-primary/70 mt-1 shrink-0" />
          </div>

          {/* Session details */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-foreground/80">
              <span className="text-base">{moonEmoji(current.moonPhase)}</span>
              <span className="font-serif">{current.title}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{formatGatheringDate(current.gatheringDate)}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{current.time}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{current.curator}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 font-serif italic">
            "The circle is open. Step in when you are ready."
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button onClick={onJoinCouncil} className="gap-2 font-serif tracking-wide">
              <Video className="h-4 w-4" />
              Join Council
            </Button>
            <Button
              variant="secondary"
              className="gap-2 font-serif tracking-wide text-sm"
              onClick={() => navigate("/time-tree")}
            >
              🌳 Reflect in the Time Tree
            </Button>

            <Collapsible open={agendaOpen} onOpenChange={handleAgendaChange}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2 font-serif tracking-wide w-full sm:w-auto">
                  {agendaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View Agenda
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardHeader>
      </Card>

      {/* ── Council Scroll reveal — the living invitation ── */}
      <Collapsible open={agendaOpen} onOpenChange={handleAgendaChange}>
        <CollapsibleContent
          className={
            prefersReducedMotion
              ? "overflow-hidden"
              : "overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up"
          }
          onAnimationEnd={(e) => {
            if (agendaOpen && e.currentTarget) {
              e.currentTarget.scrollIntoView({
                behavior: prefersReducedMotion ? "auto" : "smooth",
                block: "nearest",
              });
            }
          }}
        >
          {agendaOpen && <CouncilScrollEmbed />}
        </CollapsibleContent>
      </Collapsible>

      {/* Moon cycle indicator — dynamic */}
      <div className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-4">
        <h4 className="font-serif text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
          Bi-weekly Moon Rhythm
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Current cycle */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-serif text-muted-foreground/40 uppercase tracking-wider">Current</p>
            <div className="text-xs font-serif text-foreground/70">
              <span>{moonEmoji(current.moonPhase)} {moonLabel(current.moonPhase)}</span>
              <span className="text-muted-foreground/40"> — {formatMarkerDate(current.markerDate)}</span>
            </div>
            <div className="text-xs font-serif text-foreground/70">
              <span>🌿 Council</span>
              <span className="text-muted-foreground/40"> — {formatMarkerDate(current.gatheringDate)}</span>
            </div>
          </div>
          {/* Next cycle */}
          {next ? (
            <div className="space-y-1.5">
              <p className="text-[10px] font-serif text-muted-foreground/40 uppercase tracking-wider">Next</p>
              <div className="text-xs font-serif text-foreground/70">
                <span>{moonEmoji(next.moonPhase)} {moonLabel(next.moonPhase)}</span>
                <span className="text-muted-foreground/40"> — {formatMarkerDate(next.markerDate)}</span>
              </div>
              <div className="text-xs font-serif text-foreground/70">
                <span>🌿 Council</span>
                <span className="text-muted-foreground/40"> — {formatMarkerDate(next.gatheringDate)}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] font-serif text-muted-foreground/40 uppercase tracking-wider">Next</p>
              <p className="text-xs font-serif text-muted-foreground/40 italic">To be announced</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NextCouncilCard;
