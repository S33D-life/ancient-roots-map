/**
 * RewardLedgerPanel — Shows recent reward distribution entries from agent_reward_ledger.
 * Lightweight, read-only view for Dev Room stewards.
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, CONTRIBUTION_TYPE_LABELS } from "@/lib/lifecycle-labels";

interface LedgerEntry {
  id: string;
  agent_id: string;
  hearts_amount: number;
  reward_type: string;
  reason: string | null;
  status: string;
  issued_at: string | null;
  created_at: string;
  agent_profiles?: { agent_name: string; avatar_emoji: string | null } | null;
}

export function RewardLedgerPanel() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [totalDistributed, setTotalDistributed] = useState(0);

  useEffect(() => {
    (async () => {
      const [ledgerRes, sumRes] = await Promise.all([
        supabase
          .from("agent_reward_ledger")
          .select("*, agent_profiles(agent_name, avatar_emoji)")
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("agent_reward_ledger")
          .select("hearts_amount")
          .eq("status", "issued"),
      ]);

      setEntries((ledgerRes.data || []) as unknown as LedgerEntry[]);
      const sum = (sumRes.data || []).reduce((acc, r) => acc + (r.hearts_amount || 0), 0);
      setTotalDistributed(sum);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <Card className="bg-card/30 border-border/20">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-3 h-3 animate-spin text-primary mr-1.5" />
          <span className="text-[10px] text-muted-foreground">Loading ledger…</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/30 border-border/20">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-mono flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          Reward Ledger
          {totalDistributed > 0 && (
            <Badge variant="outline" className="text-[9px] ml-auto bg-primary/5 text-primary border-primary/20">
              {totalDistributed}♡ distributed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        {entries.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4">
            No rewards distributed yet. Accept contributions and distribute hearts to see entries here.
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry) => {
              const agent = entry.agent_profiles;
              const contType = entry.reason?.replace("Research contribution: ", "") || "";

              return (
                <div key={entry.id} className="flex items-center gap-2 text-[11px] py-1 px-1 rounded hover:bg-card/20 transition-colors">
                  <Gift className="w-3 h-3 text-primary/50 shrink-0" />
                  <span className="shrink-0">{agent?.avatar_emoji || "🤖"}</span>
                  <span className="text-foreground/80 truncate">
                    {agent?.agent_name || "Unknown"}
                  </span>
                  <span className="text-muted-foreground/40">·</span>
                  <span className="text-muted-foreground/70 truncate text-[10px]">
                    {CONTRIBUTION_TYPE_LABELS[contType] || contType || entry.reward_type}
                  </span>
                  <span className="ml-auto text-primary font-mono text-[10px] font-medium shrink-0">
                    +{entry.hearts_amount}♡
                  </span>
                  <span className="text-muted-foreground/50 text-[9px] shrink-0">
                    {timeAgo(entry.issued_at || entry.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
