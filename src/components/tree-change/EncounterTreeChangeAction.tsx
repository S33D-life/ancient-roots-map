import { lazy, Suspense, useState } from "react";
import { Loader2, MessageSquarePlus, Pencil, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTreeEditEligibility } from "@/hooks/use-tree-edit-eligibility";

const TreeChangeFlow = lazy(() => import("@/components/tree-change/TreeChangeFlow"));

interface EncounterTree {
  id: string;
  name: string;
  species: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at?: string | null;
  photo_url?: string | null;
  [key: string]: unknown;
}

interface EncounterTreeChangeActionProps {
  tree: EncounterTree;
  onTreeUpdated?: (tree: EncounterTree) => void;
  className?: string;
}

export default function EncounterTreeChangeAction({
  tree,
  onTreeUpdated,
  className,
}: EncounterTreeChangeActionProps) {
  const [open, setOpen] = useState(false);
  const { eligibility, loading, error, retry } = useTreeEditEligibility(tree.id);

  // A failed lookup is not a permission decision — offer a retry instead.
  if (error) {
    return (
      <div className={`flex flex-col gap-1 ${className ?? ""}`} role="status">
        <p className="text-[11px] font-serif text-muted-foreground">
          Editing access for {tree.name} could not be checked.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void retry()}
          aria-label={`Retry checking editing access: ${tree.name}`}
          className="min-h-11 shrink-0 gap-1.5 font-serif text-xs border-primary/25 self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Retry
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled
        aria-live="polite"
        aria-label={`Checking editing access: ${tree.name}`}
        className={`min-h-11 shrink-0 gap-1.5 font-serif text-xs border-primary/25 ${className ?? ""}`}
      >
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Checking editing access…
      </Button>
    );
  }

  if (!eligibility.signed_in) return null;

  const directEdit = eligibility.can_direct_edit;
  const label = directEdit ? "Edit tree" : "Propose changes";

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={`${label}: ${tree.name}`}
        className={`min-h-11 shrink-0 gap-1.5 font-serif text-xs border-primary/25 ${className ?? ""}`}
      >
        {directEdit ? (
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {label}
      </Button>

      {open && (
        <Suspense fallback={null}>
          <TreeChangeFlow
            open={open}
            onOpenChange={setOpen}
            treeId={tree.id}
            tree={tree}
            initialTab="details"
            onTreeUpdated={onTreeUpdated}
          />
        </Suspense>
      )}
    </>
  );
}