/**
 * GovernanceProposalsList — displays filtered list of governance proposals.
 * Used in Value Tree and standalone governance pages.
 */
import { useGovernanceProposals, type GovernanceProposal } from "@/hooks/use-governance-proposals";
import { useCurrentUser } from "@/hooks/use-current-user";
import ProposalSeedCard from "./ProposalSeedCard";
import ProposalSeedForm from "./ProposalSeedForm";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sprout, Filter } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const BRANCH_FILTERS = [
  { value: "", label: "All" },
  { value: "restoration", label: "🌿 Restoration" },
  { value: "biodiversity", label: "🦋 Biodiversity" },
  { value: "food_systems", label: "🍎 Food Systems" },
  { value: "cultural_memory", label: "📜 Cultural Memory" },
  { value: "governance", label: "🏛️ Governance" },
  { value: "education", label: "📚 Education" },
];

interface Props {
  defaultBranch?: string;
  defaultHiveFamily?: string;
  compact?: boolean;
}

const GovernanceProposalsList = ({ defaultBranch, defaultHiveFamily, compact }: Props) => {
  const [branch, setBranch] = useState(defaultBranch || "");
  const { user } = useCurrentUser();
  const { data: proposals, isLoading } = useGovernanceProposals({
    valueBranch: branch || undefined,
    hiveFamily: defaultHiveFamily || undefined,
  });

  if (isLoading) {
    return <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          {BRANCH_FILTERS.map(f => (
            <Badge
              key={f.value}
              variant={branch === f.value ? "default" : "outline"}
              className="text-[10px] font-serif cursor-pointer transition-colors"
              onClick={() => setBranch(f.value)}
            >
              {f.label}
            </Badge>
          ))}
        </div>
        {user && (
          <ProposalSeedForm userId={user.id} defaultBranch={branch || undefined} defaultHiveFamily={defaultHiveFamily} />
        )}
      </div>

      {/* Proposals list */}
      {!proposals || proposals.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <Sprout className="w-8 h-8 text-muted-foreground/30 mx-auto" />
          <p className="text-xs text-muted-foreground font-serif">No proposals yet. Plant the first seed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <ProposalSeedCard proposal={p} userId={user?.id} compact={compact} />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GovernanceProposalsList;
