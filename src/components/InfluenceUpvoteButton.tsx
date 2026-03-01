/**
 * InfluenceUpvoteButton — compact upvote with scope chooser drawer.
 * Features: optimistic UI, scope badges, atomic RPC voting.
 */
import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowBigUp, TreePine, Leaf, MapPin, Info, Loader2, Undo2 } from "lucide-react";
import { useUIFlow } from "@/contexts/UIFlowContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  useInfluenceVote,
  fetchInfluenceLedger,
  type InfluenceScope,
} from "@/hooks/use-influence-vote";

interface InfluenceUpvoteButtonProps {
  offeringId: string;
  treeId: string;
  treeSpecies?: string | null;
  treeNation?: string | null;
  userId: string | null;
  influenceScore?: number;
  compact?: boolean;
}

const scopeIcon: Record<string, React.ReactNode> = {
  tree: <TreePine className="h-3.5 w-3.5" />,
  species: <Leaf className="h-3.5 w-3.5" />,
  place: <MapPin className="h-3.5 w-3.5" />,
};

const scopeEmoji: Record<string, string> = {
  tree: "🌳",
  species: "🌿",
  place: "📍",
};

const InfluenceUpvoteButton = ({
  offeringId,
  treeId,
  treeSpecies,
  treeNation,
  userId,
  influenceScore = 0,
  compact = false,
}: InfluenceUpvoteButtonProps) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [optimisticBoost, setOptimisticBoost] = useState(0);
  const { toast } = useToast();
  const { enterFlow, exitFlow } = useUIFlow();

  useEffect(() => {
    if (drawerOpen || ledgerOpen) {
      enterFlow("offering");
      return () => exitFlow();
    }
  }, [drawerOpen, ledgerOpen, enterFlow, exitFlow]);

  const {
    availableScopes,
    existingVotes,
    dailyRemaining,
    dailyBudget,
    loading,
    voting,
    hasVotedInScope,
    castVote,
    retractVote,
    hasAnyInfluence,
    totalVotedWeight,
  } = useInfluenceVote({
    offeringId,
    treeId,
    treeSpecies,
    treeNation,
    userId,
  });

  // Reset optimistic boost when real data arrives
  useEffect(() => {
    setOptimisticBoost(0);
  }, [influenceScore]);

  const hasVoted = existingVotes.length > 0;
  const displayScore = influenceScore + optimisticBoost;

  // Determine primary voted scope for badge display
  const votedScopeType = existingVotes.length > 0 ? existingVotes[0].scope_type : null;

  const handleVote = useCallback(
    async (scope: InfluenceScope) => {
      // Optimistic UI: immediately show the score bump
      setOptimisticBoost((prev) => prev + scope.computedWeight);

      const result = await castVote(scope);
      if (result.success) {
        toast({
          title: `+${result.weight} influence`,
          description: `${scope.label} influence applied`,
        });
        setDrawerOpen(false);
      } else {
        // Revert optimistic boost on failure
        setOptimisticBoost((prev) => prev - scope.computedWeight);
        toast({
          title: "Could not vote",
          description: dailyRemaining <= 0 ? "Daily influence budget exhausted" : "Vote failed",
          variant: "destructive",
        });
      }
    },
    [castVote, toast, dailyRemaining]
  );

  const handleRetract = useCallback(
    async (scopeKey: string) => {
      const vote = existingVotes.find((v) => v.scope_key === scopeKey);
      if (vote) {
        // Optimistic: immediately reduce
        setOptimisticBoost((prev) => prev - vote.weight_applied);
      }
      const success = await retractVote(scopeKey);
      if (success) {
        toast({ title: "Vote retracted" });
        setDrawerOpen(false);
      } else if (vote) {
        // Revert
        setOptimisticBoost((prev) => prev + vote.weight_applied);
      }
    },
    [retractVote, toast, existingVotes]
  );

  const openLedger = useCallback(async () => {
    setLedgerLoading(true);
    setLedgerOpen(true);
    const data = await fetchInfluenceLedger(offeringId);
    setLedgerData(data);
    setLedgerLoading(false);
  }, [offeringId]);

  const handleButtonClick = () => {
    if (!userId) {
      toast({ title: "Sign in required", description: "Sign in to use influence voting", variant: "destructive" });
      return;
    }
    if (!hasAnyInfluence && !hasVoted) {
      toast({ title: "No influence available", description: "Earn influence tokens through stewardship to amplify offerings." });
      return;
    }
    setDrawerOpen(true);
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleButtonClick}
              disabled={loading}
              className={`inline-flex items-center gap-1 transition-colors ${
                hasVoted
                  ? "text-primary"
                  : hasAnyInfluence
                  ? "text-muted-foreground hover:text-primary"
                  : "text-muted-foreground/40 cursor-default"
              } ${compact ? "text-[10px]" : "text-xs"}`}
            >
              <ArrowBigUp
                className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} ${
                  hasVoted ? "fill-primary" : ""
                }`}
              />
              {displayScore > 0 && (
                <span className="font-mono tabular-nums">
                  {displayScore >= 100
                    ? `${(displayScore / 100).toFixed(0)}c`
                    : displayScore.toFixed(displayScore < 10 ? 1 : 0)}
                </span>
              )}
              {/* Scope badge: tiny icon showing which scope was voted */}
              {hasVoted && votedScopeType && (
                <span className="text-[9px] opacity-70" title={`Voted via ${votedScopeType}`}>
                  {scopeEmoji[votedScopeType] || ""}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent className="font-serif text-xs max-w-[200px]">
            {!userId
              ? "Sign in to influence-upvote"
              : !hasAnyInfluence
              ? "Earn influence through stewardship to amplify offerings"
              : hasVoted
              ? `Your applied influence: +${totalVotedWeight}`
              : "Influence reflects stewardship in this scope"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Scope Chooser Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="bg-card border-border max-h-[70vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="font-serif text-primary text-lg tracking-wide flex items-center gap-2">
              <ArrowBigUp className="h-5 w-5" />
              Influence Upvote
            </DrawerTitle>
            <DrawerDescription className="font-serif text-xs">
              Choose scope to apply your influence weight.
              <span className="ml-2 font-mono text-muted-foreground/60">
                Budget: {Math.round(dailyRemaining)}/{dailyBudget} remaining today
              </span>
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-3">
            {availableScopes.length === 0 && !hasVoted && (
              <p className="text-center text-muted-foreground font-serif text-sm py-4">
                No matching influence tokens found for this offering's scope.
              </p>
            )}

            {availableScopes.map((scope) => {
              const voted = hasVotedInScope(scope.key);
              const vote = existingVotes.find((v) => v.scope_key === scope.key);
              return (
                <motion.div
                  key={scope.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-lg border p-3 ${
                    voted
                      ? "border-primary/40 bg-primary/5"
                      : "border-border/50 bg-secondary/10 hover:border-primary/30"
                  } transition-colors`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-primary/70">{scopeIcon[scope.type]}</span>
                      <div>
                        <p className="font-serif text-sm text-foreground">{scope.label}</p>
                        <p className="text-[10px] text-muted-foreground/60 font-mono">
                          {scope.availableInfluence} tokens → weight {scope.computedWeight}
                        </p>
                      </div>
                    </div>
                    {voted ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-serif border-primary/30 text-primary">
                          +{vote?.weight_applied}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs font-serif gap-1 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRetract(scope.key)}
                          disabled={voting}
                        >
                          <Undo2 className="h-3 w-3" /> Retract
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 text-xs font-serif gap-1"
                        onClick={() => handleVote(scope)}
                        disabled={voting || dailyRemaining < scope.computedWeight}
                      >
                        {voting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ArrowBigUp className="h-3.5 w-3.5" />
                        )}
                        +{scope.computedWeight}
                      </Button>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {displayScore > 0 && (
              <button
                onClick={openLedger}
                className="w-full text-center text-[10px] text-muted-foreground/60 hover:text-primary font-serif tracking-wider mt-2 transition-colors flex items-center justify-center gap-1"
              >
                <Info className="h-2.5 w-2.5" /> View Influence Ledger
              </button>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Influence Ledger Dialog */}
      <Dialog open={ledgerOpen} onOpenChange={setLedgerOpen}>
        <DialogContent className="bg-card border-border max-w-sm max-h-[60vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary text-lg">Influence Ledger</DialogTitle>
          </DialogHeader>
          {ledgerLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : ledgerData.length === 0 ? (
            <p className="text-center text-muted-foreground font-serif text-sm py-4">No influence votes yet.</p>
          ) : (
            <div className="space-y-2">
              {ledgerData.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded border border-border/30 bg-secondary/10"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-primary/60">{scopeIcon[entry.scope_type]}</span>
                    <div>
                      <p className="text-xs font-serif capitalize">{entry.scope_type}</p>
                      <p className="text-[9px] text-muted-foreground/50 font-mono">
                        {new Date(entry.created_at).toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary/80">
                    +{entry.weight_applied}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InfluenceUpvoteButton;
