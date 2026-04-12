import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MoonStar, CalendarDays, Clock, Mic, ChevronDown, ChevronUp, Video, Sparkles, Leaf } from "lucide-react";
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

const NextCouncilCard = ({ onJoinCouncil, refreshKey, onEditCouncil }: NextCouncilCardProps) => {
  const [agendaOpen, setAgendaOpen] = useState(false);
  const navigate = useNavigate();

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
            <div>
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary mb-2">
                Next Gathering
              </Badge>
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

            <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2 font-serif tracking-wide w-full sm:w-auto">
                  {agendaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View Agenda
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          {/* Expandable agenda */}
          <Collapsible open={agendaOpen} onOpenChange={setAgendaOpen}>
            <CollapsibleContent className="pt-2">
              <div className="space-y-4 border-t border-border/30 pt-4">
                {/* Opening Invocation */}
                <div>
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    Opening Invocation
                  </h4>
                  <p className="text-sm font-serif text-foreground/70 leading-relaxed italic">
                    {current.agenda.invocation}
                  </p>
                </div>

                {/* This Moon */}
                <div>
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    🌙 This Moon
                  </h4>
                  <p className="text-sm font-serif text-foreground/70 leading-relaxed">
                    {current.agenda.thisMoon}
                  </p>
                </div>

                {/* Time Tree */}
                <div className="space-y-2">
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    🌳 The Time Tree
                  </h4>
                  <p className="text-sm font-serif text-foreground/80 leading-relaxed">
                    "{current.agenda.timeTreeQuestion}"
                  </p>
                  <p className="text-xs font-serif text-muted-foreground/50 italic">
                    Offer your reflection in the Time Tree
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-serif tracking-wide text-xs"
                    onClick={() => navigate("/time-tree")}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Offer to the Time Tree
                  </Button>
                </div>

                {/* Focus Areas */}
                <div>
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    Focus Areas
                  </h4>
                  <ul className="space-y-1.5">
                    {current.agenda.focusAreas.map((area, i) => (
                      <li key={i} className="text-sm font-serif text-foreground/70 flex items-start gap-2">
                        <span className="text-primary/60 mt-0.5">·</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Highlights — only if present */}
                {current.highlights && (current.highlights.plant || current.highlights.tree || current.highlights.project) && (
                  <div>
                    <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                      <Leaf className="inline h-3 w-3 mr-1" />
                      In Focus This Cycle
                    </h4>
                    <div className="space-y-1">
                      {current.highlights.plant && (
                        <p className="text-xs font-serif text-foreground/60">
                          🌱 <span className="text-foreground/70">{current.highlights.plant}</span>
                        </p>
                      )}
                      {current.highlights.tree && (
                        <p className="text-xs font-serif text-foreground/60">
                          🌳 <span className="text-foreground/70">{current.highlights.tree}</span>
                        </p>
                      )}
                      {current.highlights.project && (
                        <p className="text-xs font-serif text-foreground/60">
                          🛠 <span className="text-foreground/70">{current.highlights.project}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

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
