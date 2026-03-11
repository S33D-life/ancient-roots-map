/**
 * TreeStewardshipLog — displays stewardship actions on a tree
 * and allows authenticated users to log new actions.
 */
import { useState } from "react";
import {
  useStewardshipActions,
  useLogStewardshipAction,
  getActionMeta,
  ACTION_META,
} from "@/hooks/use-stewardship-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Leaf, Heart } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

interface Props {
  treeId: string;
  treeName: string;
  userId?: string | null;
}

const TreeStewardshipLog = ({ treeId, treeName, userId }: Props) => {
  const { data: actions, isLoading } = useStewardshipActions(treeId);
  const logAction = useLogStewardshipAction();
  const [open, setOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("monitoring");
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (!userId) return;
    try {
      await logAction.mutateAsync({
        tree_id: treeId,
        user_id: userId,
        action_type: selectedType,
        notes: notes || undefined,
      });
      setOpen(false);
      setNotes("");
      toast.success("Stewardship action recorded — +3 Hearts earned");
    } catch (err: any) {
      toast.error(err.message || "Could not log action");
    }
  };

  return (
    <Card className="bg-card/60 backdrop-blur border-border/40 overflow-hidden">
      <div className="h-0.5" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary)), transparent)" }} />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <h4 className="font-serif text-sm text-foreground tracking-wide">Stewardship Log</h4>
          </div>
          {userId && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 text-[10px] font-serif gap-1">
                  <Plus className="w-3 h-3" /> Log Action
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif text-base">Log Stewardship Action</DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground font-serif italic">for {treeName}</p>
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Action Type</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {Object.entries(ACTION_META).map(([key, meta]) => (
                        <Badge
                          key={key}
                          variant={selectedType === key ? "default" : "outline"}
                          className="text-[10px] font-serif cursor-pointer transition-colors"
                          onClick={() => setSelectedType(key)}
                        >
                          {meta.emoji} {meta.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-serif text-muted-foreground uppercase tracking-wider">Notes (optional)</label>
                    <Textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="What did you do? How is the tree?"
                      className="mt-1 text-sm min-h-[60px]"
                      maxLength={1000}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground font-serif flex items-center gap-1">
                    <Heart className="w-3 h-3 text-primary" /> You'll earn 3 S33D Hearts + 1 Species Heart
                  </div>
                  <Button
                    onClick={handleSubmit}
                    disabled={logAction.isPending}
                    className="w-full font-serif"
                  >
                    {logAction.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Leaf className="w-4 h-4 mr-2" />}
                    Record Stewardship
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {isLoading ? (
          <div className="py-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
        ) : !actions || actions.length === 0 ? (
          <div className="py-4 text-center">
            <Leaf className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground font-serif">
              No stewardship actions yet. Be the first to care for this tree.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {actions.slice(0, 8).map((a, i) => {
              const meta = getActionMeta(a.action_type);
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-lg border border-border/30 p-2.5 flex items-start gap-2.5"
                >
                  <span className="text-base mt-0.5">{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-serif font-medium text-foreground">{meta.label}</p>
                      {a.season && (
                        <Badge variant="outline" className="text-[8px] font-serif capitalize">{a.season}</Badge>
                      )}
                    </div>
                    {a.notes && (
                      <p className="text-[10px] text-muted-foreground font-serif mt-0.5 line-clamp-2">{a.notes}</p>
                    )}
                    <p className="text-[9px] text-muted-foreground/60 font-serif mt-1">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {actions.length > 8 && (
              <p className="text-[10px] text-center text-muted-foreground font-serif">
                +{actions.length - 8} more actions
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TreeStewardshipLog;
