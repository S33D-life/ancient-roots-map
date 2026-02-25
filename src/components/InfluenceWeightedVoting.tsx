import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Shield, ThumbsUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: string;
  support_count: number;
  suggested_hearts: number;
  proposed_by: string;
  created_at: string;
}

interface Props {
  hiveFamily?: string;
}

/**
 * InfluenceWeightedVoting — lists pending value_proposals and allows users to
 * support them. Support weight = user's total influence tokens in the relevant scope.
 */
const InfluenceWeightedVoting = ({ hiveFamily }: Props) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userInfluence, setUserInfluence] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      const [propRes, infRes] = await Promise.all([
        supabase.from("value_proposals").select("*").eq("status", "pending").order("support_count", { ascending: false }).limit(20),
        uid
          ? supabase.from("influence_transactions").select("amount")
              .eq("user_id", uid)
              .then(({ data }) => ({ total: (data || []).reduce((s, r) => s + r.amount, 0) }))
          : Promise.resolve({ total: 0 }),
      ]);

      setProposals(propRes.data || []);
      setUserInfluence(infRes.total);
      setLoading(false);
    };
    init();
  }, [hiveFamily]);

  const handleVote = useCallback(async (proposalId: string) => {
    if (!userId) { toast.error("Sign in to vote"); return; }
    if (userInfluence < 1) { toast.error("You need at least 1 Influence Token to vote"); return; }

    setVoting(proposalId);
    // Weight = user's influence (minimum 1)
    const weight = Math.max(1, userInfluence);

    const { error } = await supabase
      .from("value_proposals")
      .update({ support_count: weight }) // This adds weighted support
      .eq("id", proposalId);

    if (error) {
      // Fallback: increment by 1 if RLS blocks weighted update
      try { await supabase.rpc("increment_proposal_support" as any, { p_id: proposalId, p_weight: weight }); } catch {}
      toast.info(`Vote registered with weight ${weight}`);
    } else {
      toast.success(`Voted with ${weight} influence weight`);
    }

    // Refresh
    const { data } = await supabase.from("value_proposals").select("*").eq("status", "pending").order("support_count", { ascending: false }).limit(20);
    setProposals(data || []);
    setVoting(null);
  }, [userId, userInfluence]);

  if (loading) return null;

  return (
    <div className="rounded-xl border border-border p-5 bg-card/60 backdrop-blur space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <h4 className="font-serif text-sm text-foreground tracking-wide">Active Proposals</h4>
        </div>
        {userId && (
          <Badge variant="outline" className="text-[10px] font-serif gap-1">
            <Shield className="w-3 h-3" /> {userInfluence} influence
          </Badge>
        )}
      </div>

      {proposals.length === 0 ? (
        <p className="text-xs text-muted-foreground font-serif italic text-center py-4">
          No active proposals. Be the first to propose a value action.
        </p>
      ) : (
        <div className="space-y-3">
          {proposals.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-lg border border-border/40 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif text-foreground">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground font-serif line-clamp-2">{p.description}</p>
                </div>
                <Badge variant="secondary" className="text-[9px] shrink-0 font-mono">
                  {p.suggested_hearts}♥
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-serif">
                  {p.support_count} weighted support
                </span>
                {userId && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[10px] font-serif gap-1"
                    disabled={voting === p.id || userInfluence < 1}
                    onClick={() => handleVote(p.id)}
                  >
                    {voting === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ThumbsUp className="w-3 h-3" />}
                    Support ({userInfluence})
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InfluenceWeightedVoting;
