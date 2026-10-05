import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, Video } from "lucide-react";
import { CIRCLE_235_DOORWAY, circle235IsUpcoming } from "@/data/council/circle235Doorway";

interface NextCouncilCardProps {
  onJoinCouncil: () => void;
  refreshKey?: number;
  onEditCouncil?: () => void;
}

const NextCouncilCard = (_props: NextCouncilCardProps) => {
  // The confirmed Circle invitation takes precedence over the expired lunar
  // fallback. Keep historical sessions and curator drafts untouched.
  const upcoming = circle235IsUpcoming();
  return (
    <Card className="relative bg-card/70 backdrop-blur-sm border-primary/30 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
      <CardHeader className="p-5 md:p-6 space-y-4">
        <Badge variant="outline" className="w-fit text-[10px] border-primary/40 text-primary">
          {upcoming ? "Next Gathering" : "Most recently announced gathering"}
        </Badge>
        <CardTitle className="text-xl md:text-2xl font-serif tracking-wide">
          {CIRCLE_235_DOORWAY.title}
        </CardTitle>
        <CardDescription className="text-sm font-serif">
          <span className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 shrink-0" />{CIRCLE_235_DOORWAY.date}</span>
          <span className="flex items-center gap-2 mt-2"><Clock className="h-3.5 w-3.5 shrink-0" />{CIRCLE_235_DOORWAY.time}</span>
        </CardDescription>
        {!upcoming && <p className="text-sm font-serif text-muted-foreground">The announced time has passed. The next gathering is to be confirmed.</p>}
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          {upcoming && <Button asChild className="gap-2 font-serif tracking-wide"><a href={CIRCLE_235_DOORWAY.joinUrl} target="_blank" rel="noopener noreferrer"><Video className="h-4 w-4" />Join the Fire</a></Button>}
          <Button asChild variant="secondary" className="font-serif tracking-wide"><a href={CIRCLE_235_DOORWAY.tetolUrl} target="_blank" rel="noopener noreferrer">Explore Circle 235 in TETOL</a></Button>
        </div>
      </CardHeader>
    </Card>
  );

};

export default NextCouncilCard;
