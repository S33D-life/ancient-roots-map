/**
 * QuestCard — parchment-styled card used across all Quest Cave tabs.
 * Visual language matches the existing Quest Cave room: amber/emerald
 * gradients, serif headings, soft progress bar.
 */
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import {
  CIRCLE_LABEL,
  FAMILY_LABEL,
  type QuestCardData,
  type QuestStatus,
} from "./types";

const STATUS_TONE: Record<QuestStatus, { label: string; cls: string }> = {
  draft:         { label: "Draft",         cls: "bg-muted/40 text-muted-foreground border-border/40" },
  active:        { label: "Active",        cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-600/30" },
  under_review:  { label: "Under Review",  cls: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-600/30" },
  complete:      { label: "Complete",      cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/30" },
  archived:      { label: "Archived",      cls: "bg-muted/30 text-muted-foreground border-border/30" },
};

interface Props {
  q: QuestCardData;
  index?: number;
}

export default function QuestCard({ q, index = 0 }: Props) {
  const tone = STATUS_TONE[q.status];
  const target = q.progressTarget ?? 0;
  const pct = target > 0
    ? Math.min(100, Math.round((q.progressCurrent / target) * 100))
    : null;

  const actionTo = q.actionTo ?? ROUTES.MAP;
  const actionLabel = q.actionLabel ?? q.nextAction ?? "Open the map";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="border border-amber-900/20 bg-gradient-to-br from-amber-50/40 via-card/60 to-emerald-50/30 dark:from-amber-950/10 dark:to-emerald-950/10 backdrop-blur-sm hover:border-primary/40 transition-colors">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-serif text-sm text-foreground leading-snug">{q.title}</h4>
                <Badge variant="outline" className={cn("text-[9px] font-serif", tone.cls)}>
                  {tone.label}
                </Badge>
              </div>
              <p className="text-[11px] font-serif text-muted-foreground/80 mt-1 leading-relaxed">
                {q.description}
              </p>
              <p className="text-[10px] font-serif text-muted-foreground/60 mt-1 italic">
                {FAMILY_LABEL[q.family]}
                {q.circleType && <> · {q.circleName ?? CIRCLE_LABEL[q.circleType]}</>}
                {typeof q.membersCount === "number" && (
                  <> · <Users className="inline w-2.5 h-2.5 -mt-0.5" /> {q.membersCount}</>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-serif text-muted-foreground">
              <span>
                {q.progressLabel ??
                  (target > 0
                    ? `${q.progressCurrent} / ${target}`
                    : `${q.progressCurrent}`)}
              </span>
              {typeof q.heartsEarned === "number" && (
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-primary/70" /> +{q.heartsEarned}
                </span>
              )}
            </div>
            {pct !== null && <Progress value={pct} className="h-1.5 bg-muted/40" />}
            {typeof q.myContribution === "number" && (
              <p className="text-[10px] font-serif text-muted-foreground/70">
                Your contribution: {q.myContribution}
                {typeof q.collectivePool === "number" && <> · Reward pool {q.collectivePool}</>}
              </p>
            )}
          </div>

          <Button asChild size="sm" className="w-full text-xs font-serif h-8">
            <Link to={actionTo}>
              {actionLabel}
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
