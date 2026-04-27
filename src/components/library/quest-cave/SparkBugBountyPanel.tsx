/**
 * SparkBugBountyPanel — Spark contribution layer + Bug Bounty quests.
 *
 * Lives in Quest Cave near the Heart Flow card. Garden-flavoured;
 * no claiming logic. All rewards visual / prepared only.
 */
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame, Bug, Leaf, ArrowRight, Sparkles, ShieldCheck,
  CheckCircle2, GitBranch, Wand2,
} from "lucide-react";
import { ROUTES } from "@/lib/routes";
import {
  SPARK_QUESTS, SPARK_WHISPERS, BUG_REPORT_QUALITY_FIELDS,
  type SparkQuestKind,
} from "./sparkQuestsConfig";
import QuestRewardRow from "./QuestRewardRow";
import { HEART_FLOW_MICROCOPY, VERIFICATION_COPY } from "./rewardTypes";

const KIND_ICON: Record<SparkQuestKind, typeof Flame> = {
  report:  Bug,
  test:    CheckCircle2,
  improve: Wand2,
  verify:  ShieldCheck,
  triage:  GitBranch,
};

export default function SparkBugBountyPanel() {
  return (
    <section className="space-y-3">
      {/* Header card — warm ember motif */}
      <Card className="border border-amber-900/25 bg-gradient-to-br from-amber-100/40 via-card/60 to-orange-100/30 dark:from-amber-950/15 dark:to-orange-950/10">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div
              className="p-2 rounded-xl border shrink-0"
              style={{
                backgroundColor: "hsl(28, 85%, 55%, 0.12)",
                borderColor: "hsl(28, 85%, 55%, 0.35)",
              }}
            >
              <Flame className="w-5 h-5" style={{ color: "hsl(28, 85%, 55%)" }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-serif text-base text-foreground leading-snug">
                Spark &amp; Bug Bounty
              </h3>
              <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5 italic">
                Find thorns, test paths, offer fixes, and help the living app grow stronger.
              </p>
            </div>
          </div>

          <ul className="space-y-1">
            {SPARK_WHISPERS.map((w) => (
              <li
                key={w}
                className="flex items-start gap-1.5 text-[11px] font-serif text-foreground/75 leading-relaxed"
              >
                <Leaf className="w-3 h-3 mt-0.5 text-emerald-600/70 shrink-0" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              asChild size="sm"
              className="h-8 text-[11px] font-serif"
              style={{ backgroundColor: "hsl(28, 85%, 55%)", color: "hsl(0,0%,100%)" }}
            >
              <Link to={ROUTES.BUG_GARDEN}>
                Open Bug Garden <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 text-[11px] font-serif">
              <a href="#spark-quests">
                View Spark Quests <Sparkles className="w-3 h-3 ml-1" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quest list */}
      <div id="spark-quests" className="space-y-2">
        {SPARK_QUESTS.map((q) => {
          const Icon = KIND_ICON[q.kind];
          return (
            <Card
              key={q.id}
              className="border border-amber-900/15 bg-card/60 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-amber-500/10 border border-amber-600/25 shrink-0">
                    <Icon className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-sm text-foreground leading-snug">
                        {q.title}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-serif shrink-0 border-border/40 text-muted-foreground bg-muted/30"
                      >
                        Prepared
                      </Badge>
                    </div>
                    <p className="text-[11px] font-serif text-muted-foreground/80 mt-0.5 leading-relaxed">
                      {q.hint}
                    </p>
                    <div className="mt-1.5">
                      <QuestRewardRow reward={q.rewardFlow} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/30">
                  <span className="text-[10px] font-serif text-muted-foreground/70 italic">
                    Goal: {q.goal} {q.goal === 1 ? "contribution" : "contributions"}
                  </span>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-serif"
                  >
                    <Link to={ROUTES.BUG_GARDEN}>
                      Begin <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quality ladder — visible without forcing all fields */}
      <Card className="border border-border/30 bg-card/40">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
            <h4 className="font-serif text-xs text-foreground">Bug Report Quality Ladder</h4>
          </div>
          <p className="text-[10px] font-serif text-muted-foreground/80 italic leading-relaxed">
            Stronger reports earn stronger trust. Add more as you can — none are required at first.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1">
            {BUG_REPORT_QUALITY_FIELDS.map((f) => (
              <li
                key={f.key}
                className="flex items-center justify-between text-[10px] font-serif text-foreground/75 leading-relaxed"
                title={VERIFICATION_COPY[f.ladder]}
              >
                <span className="truncate">{f.label}</span>
                <span className="text-muted-foreground/60 shrink-0 ml-2">{f.ladder}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] font-serif text-muted-foreground/60 italic leading-relaxed pt-1 border-t border-border/30">
            {HEART_FLOW_MICROCOPY}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
