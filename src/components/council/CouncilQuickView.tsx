/**
 * CouncilQuickView — lightweight preview of the current invitation.
 *
 * Reads from the unified CouncilInvitation object. The full scroll lives
 * in <CouncilScrollEmbed />, rendered after the quick view as the natural
 * next step.
 */
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Leaf, FolderTree, Lightbulb } from "lucide-react";
import CouncilScrollEmbed from "./CouncilScrollEmbed";
import type { CouncilInvitation } from "@/lib/council/CouncilInvitation";

interface Props {
  invitation: CouncilInvitation;
  /** Whether to render the Council Scroll embed below. Default true. */
  showScroll?: boolean;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h2 className="font-serif text-[11px] tracking-[0.18em] uppercase text-muted-foreground/50 mb-3">
    {children}
  </h2>
);

const CouncilQuickView = ({ invitation, showScroll = true }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Opening Invocation */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/30">
        <CardContent className="p-5 md:p-6">
          <SectionLabel>Opening Invocation</SectionLabel>
          <p className="text-[15px] font-serif italic text-muted-foreground leading-[1.7]">
            "{invitation.openingInvocation}"
          </p>
        </CardContent>
      </Card>

      {/* This Moon */}
      <Card className="bg-card/60 backdrop-blur-sm border-border/30">
        <CardContent className="p-5 md:p-6">
          <SectionLabel>This Moon</SectionLabel>
          <p className="text-[15px] font-serif text-foreground/80 leading-[1.7] line-clamp-3">
            {invitation.thisMoon}
          </p>
        </CardContent>
      </Card>

      {/* Time Tree Question — emphasised */}
      <Card className="relative bg-card/70 backdrop-blur-sm border-primary/30 overflow-hidden shadow-[0_0_28px_-14px_hsl(var(--primary)/0.55)]">
        <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-primary/15" />
        <CardContent className="p-6 md:p-7">
          <h2 className="font-serif text-[11px] tracking-[0.18em] uppercase text-primary/70 mb-3 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> The Time Tree
          </h2>
          <p className="text-lg md:text-xl font-serif italic text-foreground/90 leading-[1.55] mb-5">
            "{invitation.timeTreeQuestion}"
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-serif tracking-wide gap-1.5 border-primary/40"
            onClick={() => navigate("/time-tree")}
          >
            <Sparkles className="h-3 w-3" /> Offer to the Time Tree
          </Button>
        </CardContent>
      </Card>

      {/* Focus Areas — short glance items */}
      {invitation.focusAreas.length > 0 && (
        <Card className="bg-card/60 backdrop-blur-sm border-border/30">
          <CardContent className="p-5 md:p-6">
            <SectionLabel>Focus Areas</SectionLabel>
            <ul className="space-y-3.5">
              {invitation.focusAreas.map((area, i) => (
                <li
                  key={i}
                  className="text-[15px] md:text-base font-serif text-foreground/85 leading-snug"
                >
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* In Focus This Cycle */}
      {(invitation.inFocus.plant ||
        invitation.inFocus.tree ||
        invitation.inFocus.project) && (
        <Card className="bg-card/60 backdrop-blur-sm border-border/30">
          <CardContent className="p-5 md:p-6">
            <SectionLabel>In Focus This Cycle</SectionLabel>
            <div className="space-y-3">
              {invitation.inFocus.plant && (
                <div className="flex items-center gap-2.5 text-[15px] font-serif text-foreground/85">
                  <Leaf className="h-4 w-4 text-primary/60 shrink-0" />
                  <span>{invitation.inFocus.plant}</span>
                </div>
              )}
              {invitation.inFocus.tree && (
                <div className="flex items-center gap-2.5 text-[15px] font-serif text-foreground/85">
                  <FolderTree className="h-4 w-4 text-primary/60 shrink-0" />
                  <span>{invitation.inFocus.tree}</span>
                </div>
              )}
              {invitation.inFocus.project && (
                <div className="flex items-center gap-2.5 text-[15px] font-serif text-foreground/85">
                  <Lightbulb className="h-4 w-4 text-primary/60 shrink-0" />
                  <span>{invitation.inFocus.project}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transition into the full scroll */}
      {showScroll && (
        <>
          <p className="text-center text-sm font-serif italic text-muted-foreground/70 leading-relaxed mt-2 px-2">
            For the full invitation, stories, and deeper context — continue into the Council Scroll.
          </p>
          <CouncilScrollEmbed />
        </>
      )}
    </div>
  );
};

export default CouncilQuickView;
