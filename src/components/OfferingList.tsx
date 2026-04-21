import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import OfferingCard from "@/components/OfferingCard";
import EditOfferingDialog from "@/components/EditOfferingDialog";
import OfferingSortControls, { type OfferingSortMode } from "@/components/OfferingSortControls";

type Offering = Database["public"]["Tables"]["offerings"]["Row"];

export interface TreeContext {
  id: string;
  name: string;
  species?: string | null;
  nation?: string | null;
}

interface OfferingListProps {
  offerings: Offering[];
  /** Tree lookup for linking + influence context */
  treeLookup?: TreeContext[];
  /** Items per page (default 20) */
  pageSize?: number;
  emptyMessage?: string;
  showTreeLink?: boolean;
  /** Display variant: 'full' for rich cards, 'compact' for list rows */
  variant?: "full" | "compact";
  /** Enable sort controls */
  sortable?: boolean;
  /** Called after a successful delete so parent can refresh */
  onDelete?: () => void;
  /** Called after a successful edit so parent can refresh */
  onEdit?: () => void;
}

const OfferingList = ({
  offerings,
  treeLookup,
  pageSize = 20,
  emptyMessage = "No offerings yet.",
  showTreeLink = true,
  variant = "compact",
  sortable = false,
  onDelete,
  onEdit,
}: OfferingListProps) => {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Offering | null>(null);
  const [editTarget, setEditTarget] = useState<Offering | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<OfferingSortMode>("new");
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    setCursor(null);
  }, [offerings]);

  const treeMap = useMemo(() => {
    if (!treeLookup) return null;
    const m = new Map<string, TreeContext>();
    treeLookup.forEach((t) => m.set(t.id, t));
    return m;
  }, [treeLookup]);

  const sorted = useMemo(() => {
    const items = [...offerings];
    const now = Date.now();
    switch (sortMode) {
      case "hot":
        return items.sort((a, b) => (b.hot_score || 0) - (a.hot_score || 0));
      case "top_24h":
        return items
          .filter((o) => now - new Date(o.created_at).getTime() < 86400000)
          .sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0));
      case "top_7d":
        return items
          .filter((o) => now - new Date(o.created_at).getTime() < 604800000)
          .sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0));
      case "top_all":
        return items.sort((a, b) => (b.influence_score || 0) - (a.influence_score || 0));
      default:
        return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [offerings, sortMode]);

  const paginatedItems = useMemo(() => {
    if (!cursor) return sorted.slice(0, pageSize);
    const cursorIdx = sorted.findIndex((o) => o.created_at === cursor);
    if (cursorIdx === -1) return sorted.slice(0, pageSize);
    return sorted.slice(0, cursorIdx + pageSize);
  }, [sorted, cursor, pageSize]);

  const hasMore = paginatedItems.length < sorted.length;

  const loadMore = useCallback(() => {
    if (!hasMore || paginatedItems.length === 0) return;
    const lastItem = paginatedItems[paginatedItems.length - 1];
    setCursor(lastItem.created_at);
  }, [hasMore, paginatedItems]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("offerings").delete().eq("id", deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (error) {
      toast({ title: "Could not delete", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Offering removed" });
      onDelete?.();
    }
  };

  if (sorted.length === 0) {
    return (
      <p className="text-center text-muted-foreground font-serif py-12">{emptyMessage}</p>
    );
  }

  return (
    <>
      {sortable && (
        <div className="flex justify-end mb-4">
          <OfferingSortControls value={sortMode} onChange={setSortMode} />
        </div>
      )}

      <div className={variant === "full" ? "space-y-4" : "space-y-2"}>
        <AnimatePresence mode="popLayout">
          {paginatedItems.map((off, i) => {
            const treeCtx = treeMap?.get(off.tree_id);
            return (
              <motion.div
                key={off.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ delay: Math.min(i, 10) * 0.02, duration: 0.2 }}
              >
                <OfferingCard
                  offering={off}
                  variant={variant}
                  treeId={treeCtx?.id || off.tree_id}
                  treeSpecies={treeCtx?.species}
                  treeNation={treeCtx?.nation}
                  userId={currentUserId}
                  treeName={treeCtx?.name}
                  showTreeLink={showTreeLink}
                  onDelete={(id) => {
                    const target = offerings.find((o) => o.id === id);
                    if (target) setDeleteTarget(target);
                  }}
                  onEdit={(id) => {
                    const target = offerings.find((o) => o.id === id);
                    if (target) setEditTarget(target);
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {hasMore && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              className="font-serif text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              Load more ({sorted.length - paginatedItems.length} remaining)
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Remove offering?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              "{deleteTarget?.title}" will be permanently removed from all views.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} className="font-serif">Keep</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-serif"
            >
              {deleting ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {editTarget && (
        <EditOfferingDialog
          open={!!editTarget}
          onOpenChange={(o) => !o && setEditTarget(null)}
          offering={editTarget}
          onSaved={() => {
            setEditTarget(null);
            onEdit?.();
          }}
        />
      )}
    </>
  );
};

export default OfferingList;
