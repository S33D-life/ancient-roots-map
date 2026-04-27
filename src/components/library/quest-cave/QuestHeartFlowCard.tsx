/**
 * QuestHeartFlowCard — gentle Heart Flow / Value Tree connection.
 * v0.2: shows shape of bonus heart-flow without awarding hearts.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Lock } from "lucide-react";
import { ROUTES } from "@/lib/routes";

interface Props {
  baseHearts: number;
  bonusAvailable: number;
  speciesFlow: number;
  hearthFlow: number;
  valueTreeContribution: number;
  /** "Locked" | "Claimable" | "Earned" */
  rewardStatus: "Locked" | "Claimable" | "Earned";
}

const STATUS_TONE: Record<Props["rewardStatus"], string> = {
  Locked:    "border-border/40 text-muted-foreground bg-muted/30",
  Claimable: "border-amber-600/30 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  Earned:    "border-primary/40 text-primary bg-primary/10",
};

export default function QuestHeartFlowCard({
  baseHearts, bonusAvailable, speciesFlow, hearthFlow, valueTreeContribution, rewardStatus,
}: Props) {
  return (
    <Card className="border border-amber-900/25 bg-gradient-to-br from-amber-50/40 via-card/60 to-rose-50/30 dark:from-amber-950/10 dark:to-rose-950/10">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-serif text-sm text-foreground flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" /> Quest Heart Flow
            </h3>
            <p className="text-[11px] font-serif text-muted-foreground/80 italic mt-0.5">
              Actions earn hearts. Quests multiply meaning. The Value Tree shows the flow.
            </p>
          </div>
          <span className={`text-[9px] font-serif px-2 py-0.5 rounded-full border shrink-0 ${STATUS_TONE[rewardStatus]}`}>
            {rewardStatus === "Locked" && <Lock className="w-2.5 h-2.5 inline mr-0.5" />}
            {rewardStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-serif">
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Base hearts</span>
            <span className="tabular-nums text-foreground">{baseHearts}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Bonus available</span>
            <span className="tabular-nums text-foreground">{bonusAvailable}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">→ Species hives</span>
            <span className="tabular-nums text-foreground">{speciesFlow}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">→ Hearth / circle</span>
            <span className="tabular-nums text-foreground">{hearthFlow}</span>
          </div>
          <div className="col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-2 flex justify-between">
            <span className="text-muted-foreground">→ S33D Value Tree branch</span>
            <span className="tabular-nums text-primary">+{valueTreeContribution}</span>
          </div>
        </div>

        <Button asChild size="sm" variant="outline" className="w-full h-8 text-[11px] font-serif">
          <Link to={ROUTES.VALUE_TREE}>
            View Heart Flow <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
