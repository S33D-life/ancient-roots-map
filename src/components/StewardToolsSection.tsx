/**
 * StewardToolsSection — contextual editing controls for tree pages.
 * Shows different tools based on the user's editing permission:
 * - Creator / Steward: Edit Details, Edit Location, View History, Duplicate Review, Merge
 * - Contributor: Suggest Edit, Report Duplicate, View History
 * - Anonymous: nothing
 */
import { lazy, Suspense, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, MessageSquarePlus, Clock, Shield, Loader2, GitMerge, Leaf, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import type { TreeEditRole } from "@/hooks/use-tree-edit-permission";
import { useTreeEditEligibility } from "@/hooks/use-tree-edit-eligibility";

const TreeDirectEditPanel = lazy(() => import("@/components/TreeDirectEditPanel"));
const RefinementTrail = lazy(() => import("@/components/RefinementTrail"));
const DuplicateReviewQueue = lazy(() => import("@/components/DuplicateReviewQueue"));
const TreeMergeDialog = lazy(() => import("@/components/TreeMergeDialog"));
const ReportDuplicateButton = lazy(() => import("@/components/ReportDuplicateButton"));
const TreeChangeFlow = lazy(() => import("@/components/tree-change/TreeChangeFlow"));

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
  description: string | null;
  estimated_age: number | null;
  lore_text?: string | null;
}

interface Props {
  tree: Tree;
  treeId: string;
  userId: string | null;
  role: TreeEditRole;
  canDirectEdit: boolean;
  loading: boolean;
  onProposeEdit: () => void;
  onTreeUpdated: (updated: any) => void;
  /** Optional controlled open state for the Tend This Tree panel */
  editOpen?: boolean;
  onEditOpenChange?: (open: boolean) => void;
  /** Stewardship entry point for the existing photo offering flow */
  onTendPhotos?: () => void;
  /** Number of photo offerings already remembered at this tree */
  photoCount?: number;
}

const ROLE_LABELS: Record<TreeEditRole, { label: string; icon: React.ReactNode }> = {
  creator: { label: "Creator", icon: <Shield className="h-3 w-3" /> },
  steward: { label: "Steward", icon: <Shield className="h-3 w-3" /> },
  contributor: { label: "Contributor", icon: null },
  anonymous: { label: "", icon: null },
};

export default function StewardToolsSection({
  tree,
  treeId,
  userId,
  role,
  canDirectEdit,
  loading,
  onProposeEdit,
  onTreeUpdated,
  editOpen: editOpenProp,
  onEditOpenChange,
  onTendPhotos,
  photoCount = 0,
}: Props) {
  const [editOpenInternal, setEditOpenInternal] = useState(false);
  const editOpen = editOpenProp ?? editOpenInternal;
  const setEditOpen = (open: boolean) => {
    if (onEditOpenChange) onEditOpenChange(open);
    else setEditOpenInternal(open);
  };
  const [showHistory, setShowHistory] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergePrimaryId, setMergePrimaryId] = useState("");
  const [mergeSecondaryId, setMergeSecondaryId] = useState("");
  const [changeFlowOpen, setChangeFlowOpen] = useState(false);
  const [changeFlowTab, setChangeFlowTab] = useState<"details" | "location" | "duplicate">("details");
  const { eligibility } = useTreeEditEligibility(treeId);

  const openChangeFlow = (tab: "details" | "location" | "duplicate") => {
    setChangeFlowTab(tab);
    setChangeFlowOpen(true);
  };

  if (loading) return null;

  if (role === "anonymous") {
    return (
      <Card className="bg-card/40 border-primary/10 backdrop-blur">
        <CardContent className="p-4 space-y-2">
          <h3 className="font-serif text-sm tracking-wide text-foreground/80 flex items-center gap-2">
            <Leaf className="h-3.5 w-3.5 text-primary/60" />
            Tend This Tree
          </h3>
          <p className="text-[11px] text-muted-foreground font-serif">
            Sign in to correct this tree's details, its location, or to flag a duplicate record.
          </p>
          <Button asChild variant="outline" size="sm" className="text-xs font-serif min-h-11">
            <Link to={`/auth?redirect=${encodeURIComponent(`/tree/${treeId}`)}`}>Sign in to contribute</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const roleInfo = ROLE_LABELS[role];

  const handleMergeTrees = (primaryId: string, secondaryId: string) => {
    setMergePrimaryId(primaryId);
    setMergeSecondaryId(secondaryId);
    setMergeOpen(true);
  };

  return (
    <>
      <Card className="bg-card/40 border-primary/10 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm tracking-wide text-foreground/80 flex items-center gap-2">
              <Leaf className="h-3.5 w-3.5 text-primary/60" />
              Tend This Tree
            </h3>
            {roleInfo.label && (
              <Badge
                variant="outline"
                className="text-[10px] gap-1 border-primary/30 text-primary/70"
              >
                {roleInfo.icon}
                {roleInfo.label}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-serif gap-1.5 border-primary/20 hover:border-primary/40 min-h-11"
              onClick={() => openChangeFlow("details")}
            >
              {eligibility.can_direct_edit ? <Pencil className="h-3 w-3" /> : <MessageSquarePlus className="h-3 w-3" />}
              {eligibility.can_direct_edit ? "Edit tree" : "Propose changes"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-serif gap-1.5 text-muted-foreground min-h-11"
              onClick={() => openChangeFlow("location")}
            >
              <Leaf className="h-3 w-3" />
              Correct location
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-serif gap-1.5 text-muted-foreground min-h-11"
              onClick={() => openChangeFlow("duplicate")}
            >
              <GitMerge className="h-3 w-3" />
              Propose duplicate / merge
            </Button>

            {canDirectEdit && onTendPhotos && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif gap-1.5 border-primary/20 hover:border-primary/40 min-h-11"
                onClick={onTendPhotos}
              >
                <Camera className="h-3 w-3" />
                Tend Photos
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="text-xs font-serif gap-1.5 text-muted-foreground"
              onClick={() => setShowHistory(!showHistory)}
            >
              <Clock className="h-3 w-3" />
              {showHistory ? "Hide History" : "View History"}
            </Button>

            {/* Duplicate tools */}
            {canDirectEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs font-serif gap-1.5 text-muted-foreground"
                onClick={() => setShowDuplicates(!showDuplicates)}
              >
                <GitMerge className="h-3 w-3" />
                {showDuplicates ? "Hide Duplicates" : "Duplicate Queue"}
              </Button>
            )}

            {!canDirectEdit && (
              <Suspense fallback={null}>
                <ReportDuplicateButton
                  treeId={treeId}
                  treeName={tree.name}
                  treeSpecies={tree.species}
                  treeLat={tree.latitude}
                  treeLng={tree.longitude}
                />
              </Suspense>
            )}
          </div>

          {/* Photo memory context — visible to all authenticated users */}
          <p className="text-[11px] text-muted-foreground/60 font-serif italic">
            {photoCount === 0
              ? "No photos remembered here yet."
              : photoCount === 1
                ? "1 photo remembered here."
                : `${photoCount} photos remembered here.`}
            {canDirectEdit && photoCount === 0 && (
              <> Add a photo to the tree's living memory.</>
            )}
          </p>

          {showHistory && (
            <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary/40" /></div>}>
              <RefinementTrail treeId={treeId} />
            </Suspense>
          )}

          {showDuplicates && canDirectEdit && (
            <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary/40" /></div>}>
              <DuplicateReviewQueue onMergeTrees={handleMergeTrees} />
            </Suspense>
          )}
        </CardContent>
      </Card>

      {canDirectEdit && userId && (
        <Suspense fallback={null}>
          <TreeDirectEditPanel
            open={editOpen}
            onOpenChange={setEditOpen}
            tree={tree}
            userId={userId}
            role={role}
            onTreeUpdated={onTreeUpdated}
          />
        </Suspense>
      )}

      {changeFlowOpen && (
        <Suspense fallback={null}>
          <TreeChangeFlow
            open={changeFlowOpen}
            onOpenChange={setChangeFlowOpen}
            treeId={treeId}
            tree={tree as any}
            initialTab={changeFlowTab}
            onTreeUpdated={(updated) => onTreeUpdated(updated)}
          />
        </Suspense>
      )}

      {canDirectEdit && mergeOpen && (
        <Suspense fallback={null}>
          <TreeMergeDialog
            open={mergeOpen}
            onOpenChange={setMergeOpen}
            primaryTreeId={mergePrimaryId}
            secondaryTreeId={mergeSecondaryId}
            onMergeComplete={() => {
              setShowDuplicates(true);
              onTreeUpdated(tree); // refresh
            }}
          />
        </Suspense>
      )}
    </>
  );
}
