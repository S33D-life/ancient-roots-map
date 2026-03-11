/**
 * ProposalSeedCard — displays a governance proposal with category,
 * funding progress, council status, and pledge action.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Heart, ThumbsUp, Shield, MapPin, CheckCircle, Clock, Loader2, TreePine } from "lucide-react";
import { usePledgeHearts, type GovernanceProposal } from "@/hooks/use-governance-proposals";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const CATEGORY_META: Record<string, { emoji: string; color: string }> = {
  restoration: { emoji: "🌿", color: "hsl(var(--primary))" },
  planting: { emoji: "🌱", color: "hsl(120, 40%, 45%)" },
  protection: { emoji: "🛡️", color: "hsl(200, 50%, 50%)" },
  seed_library: { emoji: "📦", color: "hsl(30, 60%, 50%)" },
  nursery: { emoji: "🏡", color: "hsl(80, 50%, 45%)" },
  research: { emoji: "🔬", color: "hsl(250, 40%, 55%)" },
  cultural: { emoji: "📜", color: "hsl(45, 70%, 50%)" },
  education: { emoji: "📚", color: "hsl(210, 50%, 50%)" },
  harvest: { emoji: "🍎", color: "hsl(0, 60%, 50%)" },
  general: { emoji: "💡", color: "hsl(var(--muted-foreground))" },
};

const OUTCOME_META: Record<string, { label: string; color: string }> = {
  discussed: { label: "Discussed", color: "hsl(var(--muted-foreground))" },
  endorsed: { label: "Endorsed", color: "hsl(150, 60%, 45%)" },
  deferred: { label: "Deferred", color: "hsl(45, 70%, 50%)" },
  declined: { label: "Declined", color: "hsl(0, 50%, 50%)" },
  needs_revision: { label: "Needs Revision", color: "hsl(25, 60%, 50%)" },
};

interface Props {
  proposal: GovernanceProposal;
  userId?: string | null;
  compact?: boolean;
}

const ProposalSeedCard = ({ proposal: p, userId, compact }: Props) => {
  const [pledging, setPledging] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState("5");
  const pledgeHearts = usePledgeHearts();
  const cat = CATEGORY_META[p.category] || CATEGORY_META.general;
  const fundingPct = p.funding_target > 0 ? Math.min(100, Math.round((p.funding_current / p.funding_target) * 100)) : 0;

  const handlePledge = async () => {
    if (!userId) { toast.error("Sign in to pledge"); return; }
    const amt = parseInt(pledgeAmount) || 0;
    if (amt <= 0) return;
    try {
      await pledgeHearts.mutateAsync({ proposalId: p.id, userId, amount: amt });
      setPledging(false);
      toast.success(`Pledged ${amt} hearts`);
    } catch (err: any) {
      toast.error(err.message || "Could not pledge");
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      {/* Category accent line */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${cat.color}, transparent)` }} />
      <CardContent className="p-4 space-y-2.5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-sm">{cat.emoji}</span>
              <h4 className="text-sm font-serif text-foreground truncate">{p.title}</h4>
            </div>
            {!compact && (
              <p className="text-[11px] text-muted-foreground font-serif line-clamp-2">{p.description}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge variant="outline" className="text-[9px] font-serif capitalize" style={{ borderColor: `${cat.color}40`, color: cat.color }}>
              {p.category.replace("_", " ")}
            </Badge>
            {p.council_reviewed && p.council_outcome && (
              <Badge variant="outline" className="text-[9px] font-serif" style={{
                borderColor: `${(OUTCOME_META[p.council_outcome] || OUTCOME_META.discussed).color}40`,
                color: (OUTCOME_META[p.council_outcome] || OUTCOME_META.discussed).color,
              }}>
                <CheckCircle className="w-2.5 h-2.5 mr-0.5" />
                {(OUTCOME_META[p.council_outcome] || OUTCOME_META.discussed).label}
              </Badge>
            )}
          </div>
        </div>

        {/* Tags row */}
        <div className="flex flex-wrap gap-1.5">
          {p.value_tree_branch && (
            <Link to={`/value-tree?tab=proposals`}>
              <Badge variant="secondary" className="text-[9px] font-serif gap-0.5 cursor-pointer hover:bg-accent/10">
                <TreePine className="w-2.5 h-2.5" /> {p.value_tree_branch.replace("_", " ")}
              </Badge>
            </Link>
          )}
          {p.hive_family && (
            <Badge variant="secondary" className="text-[9px] font-serif gap-0.5">
              🐝 {p.hive_family}
            </Badge>
          )}
          {p.location_name && (
            <Badge variant="secondary" className="text-[9px] font-serif gap-0.5">
              <MapPin className="w-2.5 h-2.5" /> {p.location_name}
            </Badge>
          )}
        </div>

        {/* Funding progress */}
        {p.funding_target > 0 && p.funding_type !== "none" && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-serif">
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" /> {p.funding_current} / {p.funding_target} hearts pledged
              </span>
              <span className="tabular-nums">{fundingPct}%</span>
            </div>
            <Progress value={fundingPct} className="h-1.5" />
          </div>
        )}

        {/* Bottom row: support + pledge */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-serif">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> {p.support_count} support
            </span>
            {p.council_reviewed && (
              <span className="flex items-center gap-1 text-primary">
                <CheckCircle className="w-3 h-3" /> Council reviewed
              </span>
            )}
          </div>

          {userId && p.funding_type !== "none" && p.funding_target > 0 && (
            <>
              {pledging ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number"
                    value={pledgeAmount}
                    onChange={e => setPledgeAmount(e.target.value)}
                    min={1}
                    max={100}
                    className="w-16 h-7 text-xs"
                  />
                  <Button size="sm" className="h-7 text-[10px] font-serif gap-1" onClick={handlePledge} disabled={pledgeHearts.isPending}>
                    {pledgeHearts.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Heart className="w-3 h-3" />}
                    Pledge
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={() => setPledging(false)}>×</Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" className="h-7 text-[10px] font-serif gap-1" onClick={() => setPledging(true)}>
                  <Heart className="w-3 h-3" /> Pledge Hearts
                </Button>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProposalSeedCard;
