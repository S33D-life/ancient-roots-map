/**
 * QuestHeartFlowCard — gentle Heart Flow / Value Tree connection.
 * v0.2: shows shape of bonus heart-flow without awarding hearts.
 *
 * Reward status vocabulary uses the safe set from rewardTypes.ts.
 * No "Claim Bonus" button. Most actions are visual-only until a safe
 * reward-claim ledger exists.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ArrowRight, Lock, ShieldCheck, Hourglass, Sparkles } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  HEART_FLOW_MICROCOPY,
  HEART_FLOW_NOTE,
  rewardButtonLabel,
  isRewardButtonDisabled,
  type RewardStatus,
} from "./rewardTypes";

interface Props {
  baseHearts: number;
  bonusPrepared: number;
  speciesFlow: number;
  hearthFlow: number;
  valueTreeContribution: number;
  rewardStatus: RewardStatus;
}

const STATUS_TONE: Record<RewardStatus, string> = {
  "Locked":                "border-border/40 text-muted-foreground bg-muted/30",
  "Prepared":              "border-amber-600/30 text-amber-700 dark:text-amber-300 bg-amber-500/10",
  "Earned":                "border-primary/40 text-primary bg-primary/10",
  "Requires Verification": "border-sky-600/30 text-sky-700 dark:text-sky-300 bg-sky-500/10",
  "Claiming Coming Soon":  "border-rose-600/30 text-rose-700 dark:text-rose-300 bg-rose-500/10",
};

function StatusGlyph({ status }: { status: RewardStatus }) {
  const cls = "w-2.5 h-2.5 inline mr-1";
  switch (status) {
    case "Locked":                return <Lock className={cls} />;
    case "Prepared":              return <Hourglass className={cls} />;
    case "Earned":                return <Sparkles className={cls} />;
    case "Requires Verification": return <ShieldCheck className={cls} />;
    case "Claiming Coming Soon":  return <Hourglass className={cls} />;
  }
}

export default function QuestHeartFlowCard({
  baseHearts, bonusPrepared, speciesFlow, hearthFlow, valueTreeContribution, rewardStatus,
}: Props) {
  const buttonLabel = rewardButtonLabel(rewardStatus);
  const buttonDisabled = isRewardButtonDisabled(rewardStatus);

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
          <span
            className={`text-[9px] font-serif px-2 py-0.5 rounded-full border shrink-0 inline-flex items-center ${STATUS_TONE[rewardStatus]}`}
          >
            <StatusGlyph status={rewardStatus} />
            {rewardStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[11px] font-serif">
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Current Hearts</span>
            <span className="tabular-nums text-foreground">{baseHearts}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Prepared Bonus Hearts</span>
            <span className="tabular-nums text-foreground">{bonusPrepared}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Species Flow Prepared</span>
            <span className="tabular-nums text-foreground">{speciesFlow}</span>
          </div>
          <div className="rounded-lg border border-border/40 bg-card/50 p-2 flex justify-between">
            <span className="text-muted-foreground">Hearth / Circle Flow Prepared</span>
            <span className="tabular-nums text-foreground">{hearthFlow}</span>
          </div>
          <div className="col-span-2 rounded-lg border border-primary/30 bg-primary/5 p-2 flex justify-between">
            <span className="text-muted-foreground">Value Tree Contribution Prepared</span>
            <span className="tabular-nums text-primary">+{valueTreeContribution}</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-[10px] font-serif text-muted-foreground/70 italic leading-relaxed">
            {HEART_FLOW_NOTE}
          </p>
          <p className="text-[10px] font-serif text-muted-foreground/60 italic leading-relaxed">
            {HEART_FLOW_MICROCOPY}
          </p>
        </div>

        {/* "View Heart Flow" is always safe — it just navigates. */}
        <div className="grid grid-cols-2 gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-[11px] font-serif">
            <Link to={ROUTES.VALUE_TREE}>
              View Heart Flow <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant={buttonDisabled ? "outline" : "default"}
            disabled={buttonDisabled}
            title={buttonDisabled ? HEART_FLOW_MICROCOPY : undefined}
            className="h-8 text-[11px] font-serif"
          >
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
