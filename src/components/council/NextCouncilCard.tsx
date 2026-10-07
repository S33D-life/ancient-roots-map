import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CIRCLE_235_DOORWAY as circle } from "@/data/council/circle235Doorway";

interface NextCouncilCardProps {
  onJoinCouncil: () => void;
  refreshKey?: number;
  onEditCouncil?: () => void;
}

const NextCouncilCard = (_props: NextCouncilCardProps) => (
  <Card className="relative bg-card/70 backdrop-blur-sm border-primary/30 overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
    <CardHeader className="p-5 md:p-6 space-y-4">
      <Badge variant="outline" className="w-fit text-[10px] border-primary/40 text-primary">Open Circle</Badge>
      <CardTitle className="text-xl md:text-2xl font-serif tracking-wide">{circle.title}</CardTitle>
      <p className="text-sm font-serif">{circle.openLine}</p>
      <p className="text-lg font-serif italic">{circle.question}</p>
      <p className="text-sm font-serif">This week’s companions, chosen by Leo: {circle.companions.join(" · ")}. People / those who gather hold the open seventh seat.</p>
      <p className="text-xs text-muted-foreground">Fly Agaric: {circle.safety}</p>
      <p className="text-sm font-serif">Enter the Tree, wander through the Canopy, meet a companion, follow its learning and remembered relationships, then return to the Circle and the living world.</p>
      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <Button asChild className="font-serif"><a href={circle.tetolUrl}>Explore Circle 235 in 3D TETOL</a></Button>
        <Button asChild variant="secondary" className="font-serif"><a href={circle.groupUrl} target="_blank" rel="noopener noreferrer">Council group · Fire times</a></Button>
      </div>
      <p className="text-xs text-muted-foreground">Different places. Different moments. One living Council.</p>
    </CardHeader>
  </Card>
);

export default NextCouncilCard;
