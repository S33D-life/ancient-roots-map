import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MoonStar, CalendarDays, Clock, Mic, ChevronDown, ChevronUp, Video, Sparkles } from "lucide-react";

/** Hardcoded for now — structured for future DB mapping */
const CURRENT_COUNCIL = {
  title: "New Moon Gathering",
  moonPhase: "new" as const,
  date: "Monday 20th April 2026",
  time: "7:30 – 8:30 PM (UK)",
  curator: "Edward James Thurlow",
  agenda: {
    invocation:
      "We gather at the turn of the Moon, beneath the canopy that connects all things. Each voice here is a leaf on the same tree. Let us listen as the forest listens — with patience, with presence.",
    thisMoon:
      "This Moon we tend the roots of our shared practice. As S33D grows from prototype into living rhythm, we ask: what does stewardship look like when the tools are digital but the intention is ancient?",
    timeTreeQuestion:
      "What does your local ecology need most right now — and how could S33D help you respond to it?",
    focusAreas: [
      "Council in S33D — refining the gathering flow",
      "Curation roles — who tends what",
      "S33D Hearts distribution — how contribution becomes harvest",
    ],
  },
};

const MOON_CYCLE = {
  current: {
    marker: { emoji: "🌑", label: "New Moon", date: "April 17" },
    gathering: { emoji: "🌿", label: "Council", date: "April 20" },
  },
  next: {
    marker: { emoji: "🌕", label: "Full Moon", date: "May 2" },
    gathering: { emoji: "🌿", label: "Council", date: "May 4 (est.)" },
  },
};

interface NextCouncilCardProps {
  onJoinCouncil: () => void;
}

const NextCouncilCard = ({ onJoinCouncil }: NextCouncilCardProps) => {
  const [agendaOpen, setAgendaOpen] = useState(false);
  const navigate = useNavigate();

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
              <span className="text-base">🌑</span>
              <span className="font-serif">{CURRENT_COUNCIL.title}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{CURRENT_COUNCIL.date}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{CURRENT_COUNCIL.time}</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/80">
              <Mic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-serif">{CURRENT_COUNCIL.curator}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/60 font-serif italic">
            "The circle is open. Step in when you are ready."
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <Button
              onClick={onJoinCouncil}
              className="gap-2 font-serif tracking-wide"
            >
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
                    {CURRENT_COUNCIL.agenda.invocation}
                  </p>
                </div>

                {/* This Moon */}
                <div>
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    🌙 This Moon
                  </h4>
                  <p className="text-sm font-serif text-foreground/70 leading-relaxed">
                    {CURRENT_COUNCIL.agenda.thisMoon}
                  </p>
                </div>

                {/* Time Tree */}
                <div className="space-y-2">
                  <h4 className="font-serif text-xs tracking-[0.12em] uppercase text-muted-foreground/60 mb-1.5">
                    🌳 The Time Tree
                  </h4>
                  <p className="text-sm font-serif text-foreground/80 leading-relaxed">
                    "{CURRENT_COUNCIL.agenda.timeTreeQuestion}"
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
                    {CURRENT_COUNCIL.agenda.focusAreas.map((area, i) => (
                      <li key={i} className="text-sm font-serif text-foreground/70 flex items-start gap-2">
                        <span className="text-primary/60 mt-0.5">·</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardHeader>
      </Card>

      {/* Moon cycle indicator */}
      <div className="rounded-xl border border-border/20 bg-card/30 backdrop-blur-sm p-4">
        <h4 className="font-serif text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50 mb-3">
          Bi-weekly Moon Rhythm
        </h4>
        <div className="grid grid-cols-2 gap-4">
          {/* Current cycle */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-serif text-muted-foreground/40 uppercase tracking-wider">Current</p>
            <div className="text-xs font-serif text-foreground/70">
              <span>{MOON_CYCLE.current.marker.emoji} {MOON_CYCLE.current.marker.label}</span>
              <span className="text-muted-foreground/40"> — {MOON_CYCLE.current.marker.date}</span>
            </div>
            <div className="text-xs font-serif text-foreground/70">
              <span>{MOON_CYCLE.current.gathering.emoji} {MOON_CYCLE.current.gathering.label}</span>
              <span className="text-muted-foreground/40"> — {MOON_CYCLE.current.gathering.date}</span>
            </div>
          </div>
          {/* Next cycle */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-serif text-muted-foreground/40 uppercase tracking-wider">Next</p>
            <div className="text-xs font-serif text-foreground/70">
              <span>{MOON_CYCLE.next.marker.emoji} {MOON_CYCLE.next.marker.label}</span>
              <span className="text-muted-foreground/40"> — {MOON_CYCLE.next.marker.date}</span>
            </div>
            <div className="text-xs font-serif text-foreground/70">
              <span>{MOON_CYCLE.next.gathering.emoji} {MOON_CYCLE.next.gathering.label}</span>
              <span className="text-muted-foreground/40"> — {MOON_CYCLE.next.gathering.date}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NextCouncilCard;
