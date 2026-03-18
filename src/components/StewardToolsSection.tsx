/**
 * StewardToolsSection — contextual editing controls for tree pages.
 * Shows different tools based on the user's editing permission:
 * - Creator / Steward: Edit Details, Edit Location, View History
 * - Contributor: Suggest Edit, View History
 * - Anonymous: nothing
 */
import { lazy, Suspense, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, MapPin, MessageSquarePlus, Clock, Shield, Loader2 } from "lucide-react";
import type { TreeEditRole } from "@/hooks/use-tree-edit-permission";

const TreeDirectEditPanel = lazy(() => import("@/components/TreeDirectEditPanel"));
const TreeEditHistory = lazy(() => import("@/components/TreeEditHistory"));

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
}: Props) {
  const [editOpen, setEditOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (loading || role === "anonymous") return null;

  const roleInfo = ROLE_LABELS[role];

  return (
    <>
      <Card className="bg-card/40 border-primary/10 backdrop-blur">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm tracking-wide text-foreground/80 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-primary/60" />
              Steward Tools
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
            {canDirectEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif gap-1.5 border-primary/20 hover:border-primary/40"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-3 w-3" />
                Edit Details
              </Button>
            )}

            {!canDirectEdit && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-serif gap-1.5 border-primary/20 hover:border-primary/40"
                onClick={onProposeEdit}
              >
                <MessageSquarePlus className="h-3 w-3" />
                Suggest Edit
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
          </div>

          {showHistory && (
            <Suspense fallback={<div className="flex justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-primary/40" /></div>}>
              <TreeEditHistory treeId={treeId} />
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
    </>
  );
}
