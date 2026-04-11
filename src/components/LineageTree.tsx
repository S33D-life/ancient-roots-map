/**
 * LineageTree — visualisation of invitation and staff lineage.
 * Shows upstream chain (who invited you), your node, and downstream invitees.
 */
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, User, Wand2, ChevronDown, ArrowDown, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface LineageNode {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  lineage_staff_id?: string | null;
  depth?: number;
  created_at?: string;
}

interface LineageData {
  self: LineageNode & {
    invites_remaining: number;
    invites_sent: number;
    invites_accepted: number;
  };
  upstream: LineageNode[];
  downstream: LineageNode[];
  staff: { staff_code: string; staff_name: string; staff_species: string } | null;
}

interface Props {
  userId: string;
}

const NodeCard = ({ node, isSelf, label }: { node: LineageNode; isSelf?: boolean; label?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
      isSelf
        ? "border-primary/30 bg-primary/5 shadow-[0_0_15px_hsl(var(--primary)/0.1)]"
        : "border-border/20 bg-card/40"
    }`}
  >
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm"
      style={{
        background: isSelf ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.3)",
      }}
    >
      {node.avatar_url ? (
        <img src={node.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        <User className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-serif text-foreground truncate">
        {node.display_name || "Anonymous Wanderer"}
        {isSelf && <span className="text-primary ml-1 text-xs">(you)</span>}
      </p>
      {label && <p className="text-[10px] text-muted-foreground/60 font-serif">{label}</p>}
    </div>
  </motion.div>
);

const ChainConnector = () => (
  <div className="flex justify-center py-1">
    <div className="w-px h-6 bg-gradient-to-b from-primary/20 to-primary/5" />
  </div>
);

export default function LineageTree({ userId }: Props) {
  const [lineage, setLineage] = useState<LineageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllDown, setShowAllDown] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.rpc("get_user_lineage", { p_user_id: userId });
        if (!error && data) setLineage(data as unknown as LineageData);
      } catch (err) {
        console.warn("[Lineage] fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!lineage?.self) {
    return (
      <div className="text-center py-8 space-y-3">
        <Users className="w-6 h-6 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-serif text-muted-foreground">Your lineage is still forming.</p>
        <p className="text-xs text-muted-foreground/60">Invite others to see your grove grow.</p>
      </div>
    );
  }

  const visibleDown = showAllDown ? lineage.downstream : lineage.downstream.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Staff badge */}
      {lineage.staff && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-primary/20 bg-primary/5 mx-auto w-fit"
        >
          <Wand2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-serif text-foreground">
            Staff: {lineage.staff.staff_name || lineage.staff.staff_code}
          </span>
          {lineage.staff.staff_species && (
            <span className="text-[10px] text-muted-foreground/60">({lineage.staff.staff_species})</span>
          )}
        </motion.div>
      )}

      {/* Upstream chain */}
      {lineage.upstream.length > 0 && (
        <div className="space-y-0">
          <p className="text-[10px] font-serif text-muted-foreground/50 text-center tracking-wider uppercase mb-2">
            Your path into the forest
          </p>
          {[...lineage.upstream].reverse().map((node, i) => (
            <div key={node.id}>
              <NodeCard node={node} label={`${lineage.upstream.length - i} step${lineage.upstream.length - i > 1 ? "s" : ""} above`} />
              <ChainConnector />
            </div>
          ))}
        </div>
      )}

      {/* Self */}
      <NodeCard node={lineage.self} isSelf />

      {/* Invitation stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Remaining", value: lineage.self.invites_remaining },
          { label: "Sent", value: lineage.self.invites_sent },
          { label: "Accepted", value: lineage.self.invites_accepted },
        ].map((s) => (
          <div key={s.label} className="p-2 rounded-lg border border-border/15 bg-card/30">
            <p className="text-sm font-serif font-medium text-foreground">{s.value}</p>
            <p className="text-[9px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Downstream */}
      {lineage.downstream.length > 0 && (
        <div className="space-y-0">
          <ChainConnector />
          <p className="text-[10px] font-serif text-muted-foreground/50 text-center tracking-wider uppercase mb-2">
            Those you've invited ({lineage.downstream.length})
          </p>
          {visibleDown.map((node) => (
            <div key={node.id} className="mb-1.5">
              <NodeCard node={node} label={node.created_at ? `Joined ${new Date(node.created_at).toLocaleDateString()}` : undefined} />
            </div>
          ))}
          {lineage.downstream.length > 5 && !showAllDown && (
            <button
              onClick={() => setShowAllDown(true)}
              className="w-full text-center py-2 text-xs text-primary hover:underline font-serif flex items-center justify-center gap-1"
            >
              <ChevronDown className="w-3 h-3" />
              Show all {lineage.downstream.length} invitees
            </button>
          )}
        </div>
      )}

      {lineage.downstream.length === 0 && lineage.upstream.length === 0 && (
        <div className="text-center py-4">
          <Sparkles className="w-5 h-5 mx-auto text-muted-foreground/30 mb-2" />
          <p className="text-xs font-serif text-muted-foreground/60">
            You have {lineage.self.invites_remaining} invitations to share.
          </p>
          <p className="text-[10px] text-muted-foreground/40 mt-1">
            Each invitation plants a seed in your lineage tree.
          </p>
        </div>
      )}
    </div>
  );
}
