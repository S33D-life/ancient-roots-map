/**
 * ContributionFeed — Displays layered contributions on a tree page.
 * Lightweight cards with state badges and community support.
 */
import { motion } from "framer-motion";
import { Heart, CheckCircle2, Shield, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  CONTRIBUTION_META,
  STATE_LABELS,
  useSupportContribution,
  type TreeContribution,
} from "@/hooks/use-tree-contributions";

interface Props {
  contributions: TreeContribution[];
  treeId: string;
  maxDisplay?: number;
}

const STATE_ICONS: Record<string, React.ReactNode> = {
  new: <Eye className="h-3 w-3" />,
  community_supported: <Heart className="h-3 w-3" />,
  curator_reviewed: <CheckCircle2 className="h-3 w-3" />,
  guardian_confirmed: <Shield className="h-3 w-3" />,
};

const ContributionFeed = ({ contributions, treeId, maxDisplay = 12 }: Props) => {
  const supportMutation = useSupportContribution();
  const visible = contributions.slice(0, maxDisplay);

  if (visible.length === 0) return null;

  const handleSupport = async (contributionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Sign in to support"); return; }
    try {
      await supportMutation.mutateAsync({
        contribution_id: contributionId,
        user_id: user.id,
        tree_id: treeId,
      });
      toast.success("🌱 Support recorded");
    } catch {
      toast.error("Already supported or failed");
    }
  };

  // Group by type for summary
  const typeCounts = visible.reduce((acc, c) => {
    acc[c.contribution_type] = (acc[c.contribution_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, hsl(var(--primary) / 0.3), transparent)" }} />
        <h3 className="text-sm font-serif text-primary tracking-[0.15em] uppercase">
          Community Contributions
        </h3>
        <div className="h-px flex-1" style={{ background: "linear-gradient(270deg, hsl(var(--primary) / 0.3), transparent)" }} />
      </div>

      {/* Type summary */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Object.entries(typeCounts).map(([type, count]) => {
          const meta = CONTRIBUTION_META[type as keyof typeof CONTRIBUTION_META];
          if (!meta) return null;
          return (
            <Badge key={type} variant="outline" className="text-[10px] font-serif gap-1 border-border/40">
              {meta.emoji} {meta.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Feed */}
      <motion.div
        className="space-y-2"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
      >
        {visible.map((c) => {
          const meta = CONTRIBUTION_META[c.contribution_type as keyof typeof CONTRIBUTION_META];
          const stateMeta = STATE_LABELS[c.state as keyof typeof STATE_LABELS];
          if (!meta || !stateMeta) return null;

          return (
            <motion.div
              key={c.id}
              variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
              className="rounded-xl border border-border/30 bg-card/50 backdrop-blur p-3 hover:border-primary/20 transition-colors group"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg shrink-0 mt-0.5">{meta.emoji}</span>
                <div className="flex-1 min-w-0 space-y-1">
                  {c.title && (
                    <p className="font-serif text-sm text-foreground font-medium truncate">{c.title}</p>
                  )}
                  {c.content && (
                    <p className="text-xs text-muted-foreground/80 font-serif line-clamp-2">{c.content}</p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      {new Date(c.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[9px] font-serif gap-1 py-0 h-4"
                      style={{ borderColor: stateMeta.color + "40", color: stateMeta.color }}
                    >
                      {STATE_ICONS[c.state]} {stateMeta.label}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSupport(c.id)}
                  disabled={supportMutation.isPending}
                  className="shrink-0 h-7 px-2 text-muted-foreground/50 hover:text-primary gap-1 text-[10px] font-serif"
                >
                  <Heart className="h-3 w-3" />
                  {c.support_count > 0 && c.support_count}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {contributions.length > maxDisplay && (
        <p className="text-center text-[10px] text-muted-foreground/50 font-serif">
          +{contributions.length - maxDisplay} more contributions
        </p>
      )}
    </section>
  );
};

export default ContributionFeed;
