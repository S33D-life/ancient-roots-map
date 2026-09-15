import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/use-role";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Shield, CheckCircle2, XCircle, HelpCircle, AlertTriangle,
  MapPin, ArrowRight, Clock, User,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Proposal {
  id: string;
  tree_id: string;
  proposed_by: string;
  proposed_changes: Record<string, unknown>;
  reason: string;
  evidence: { type: string; value: string }[];
  confidence: string;
  status: string;
  reviewer_note: string | null;
  flags: string[];
  created_at: string;
  updated_at: string;
  proposal_type?: string;
  merge_target_tree_id?: string | null;
  merge_preferred_tree_id?: string | null;
  base_updated_at?: string | null;
}

interface TreeInfo {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
}

interface ProposerInfo {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function EditReviewPage() {
  // "Steward-level" review access = curator OR keeper (matches the app-wide
  // convention; see heartwoodRooms steward = "Curator or keeper role"). The route
  // is otherwise public-mountable, so this page is the access boundary.
  const { hasRole: isCurator, loading: curatorLoading } = useHasRole("curator");
  const { hasRole: isKeeper, loading: keeperLoading } = useHasRole("keeper");
  const hasRole = isCurator || isKeeper;
  const roleLoading = curatorLoading || keeperLoading;
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trees, setTrees] = useState<Record<string, TreeInfo>>({});
  const [proposers, setProposers] = useState<Record<string, ProposerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionDialog, setActionDialog] = useState<{ proposal: Proposal; action: "accept" | "reject" | "needs_more_info" } | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const [curatorId, setCuratorId] = useState<string | null>(null);
  const [mergeSurvivor, setMergeSurvivor] = useState<string | null>(null);
  const [conflictAck, setConflictAck] = useState(false);
  const [staleWarning, setStaleWarning] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCuratorId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!hasRole) return;
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      const { data: propData, error: propErr } = await supabase
        .from("tree_edit_proposals" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (propErr) {
        setLoadError(propErr.message);
        setLoading(false);
        return;
      }

      const props = (propData || []) as unknown as Proposal[];
      setProposals(props);

      // Load tree info
      const treeIds = [...new Set(
        props.flatMap((p) => [p.tree_id, p.merge_target_tree_id]).filter(Boolean) as string[],
      )];
      if (treeIds.length > 0) {
        const { data: treesData } = await supabase
          .from("trees")
          .select("id, name, species, latitude, longitude, what3words")
          .in("id", treeIds);
        const map: Record<string, TreeInfo> = {};
        (treesData || []).forEach((t: any) => (map[t.id] = t));
        setTrees(map);
      }

      // Load proposer profiles
      const userIds = [...new Set(props.map((p) => p.proposed_by))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", userIds);
        const pMap: Record<string, ProposerInfo> = {};
        (profilesData || []).forEach((p: any) => (pMap[p.id] = p));
        setProposers(pMap);
      }

      setLoading(false);
    };
    load();
  }, [hasRole]);

  const filtered = useMemo(
    () => proposals.filter((p) => p.status === statusFilter),
    [proposals, statusFilter]
  );

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = { pending: 0, accepted: 0, rejected: 0, needs_more_info: 0 };
    proposals.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [proposals]);

  // All decisions run through SECURITY DEFINER functions so curator authority,
  // conflict detection and atomic merges are enforced by the database.
  const handleAction = async () => {
    if (!actionDialog || !curatorId) return;
    const { proposal, action } = actionDialog;
    setProcessing(true);

    try {
      if (proposal.proposal_type === "merge") {
        if (action !== "accept") {
          const { error } = await (supabase.rpc as any)("review_tree_change_proposal", {
            _proposal_id: proposal.id,
            _decision: action === "reject" ? "decline" : "needs_more_info",
            _note: reviewNote.trim(),
          });
          if (error) throw error;
        } else {
          const survivor = mergeSurvivor || proposal.merge_preferred_tree_id || proposal.tree_id;
          const { error } = await (supabase.rpc as any)("approve_tree_merge", {
            _proposal_id: proposal.id,
            _surviving_tree_id: survivor,
            _field_resolutions: {},
            _note: reviewNote.trim() || null,
            _acknowledge_conflict: conflictAck,
          });
          if (error) throw error;
          toast.success("Merged. Every offering and memory now rests with the surviving record.");
        }
      } else {
        const { error } = await (supabase.rpc as any)("review_tree_change_proposal", {
          _proposal_id: proposal.id,
          _decision: action === "accept" ? "approve" : action === "reject" ? "decline" : "needs_more_info",
          _note: reviewNote.trim() || null,
          _overrides: null,
          _acknowledge_conflict: conflictAck,
        });
        if (error) throw error;
        toast.success(
          action === "accept" ? "Approved — the tree's record has been updated."
            : action === "reject" ? "Declined." : "Requested more information.",
        );

        if (action === "accept") {
          const tree = trees[proposal.tree_id];
          if (tree) {
            setTrees((prev) => ({
              ...prev,
              [proposal.tree_id]: { ...tree, ...proposal.proposed_changes } as TreeInfo,
            }));
          }
        }
      }
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      if (msg.includes("stale_proposal")) {
        setStaleWarning(true);
        toast.error("This record changed after the proposal was written — please review it afresh.");
      } else if (msg.includes("already_reviewed")) {
        toast.error("This proposal has already been decided.");
      } else if (msg.includes("already_merged")) {
        toast.error("One of these records has already been merged.");
      } else {
        toast.error(msg);
      }
      setProcessing(false);
      return;
    }

    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposal.id
          ? { ...p, status: action === "accept" ? "accepted" : action === "reject" ? "rejected" : "needs_more_info", reviewer_note: reviewNote }
          : p
      )
    );
    setProcessing(false);
    setActionDialog(null);
    setReviewNote("");
    setConflictAck(false);
    setStaleWarning(false);
    setMergeSurvivor(null);
  };

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasRole) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-serif text-foreground mb-2">Steward Access Required</h1>
          <p className="text-muted-foreground font-serif">This area is tended by Heartwood Curators and Keepers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-24 pb-20 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-serif text-primary tracking-wide">Tree Edit Review</h1>
        </div>

        {loadError && (
          <div className="mb-6 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm font-serif">
              <p className="text-destructive">Couldn't load the review queue.</p>
              <p className="text-muted-foreground text-xs mt-0.5">{loadError}</p>
            </div>
          </div>
        )}

        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="mb-6 font-serif">
            <TabsTrigger value="pending" className="gap-1.5 text-xs">
              <Clock className="w-3.5 h-3.5" /> Pending ({statusCounts.pending})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="gap-1.5 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" /> Accepted ({statusCounts.accepted})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1.5 text-xs">
              <XCircle className="w-3.5 h-3.5" /> Rejected ({statusCounts.rejected})
            </TabsTrigger>
            <TabsTrigger value="needs_more_info" className="gap-1.5 text-xs">
              <HelpCircle className="w-3.5 h-3.5" /> Needs Info ({statusCounts.needs_more_info})
            </TabsTrigger>
          </TabsList>

          {["pending", "accepted", "rejected", "needs_more_info"].map((status) => (
            <TabsContent key={status} value={status}>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <p className="font-serif text-muted-foreground">No {status.replace(/_/g, " ")} proposals.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filtered.map((proposal) => {
                    const tree = trees[proposal.tree_id];
                    const proposer = proposers[proposal.proposed_by];
                    return (
                      <ProposalCard
                        key={proposal.id}
                        proposal={proposal}
                        tree={tree}
                        proposer={proposer}
                        onAction={(action) => {
                          setActionDialog({ proposal, action });
                          setReviewNote("");
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(open) => !open && setActionDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-primary capitalize">
              {actionDialog?.action.replace(/_/g, " ")} Proposal
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder={
                actionDialog?.action === "accept"
                  ? "Optional note about the merge…"
                  : actionDialog?.action === "reject"
                  ? "Reason for rejection…"
                  : "What additional information is needed?"
              }
              className="font-serif text-sm"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)} className="font-serif">
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionDialog?.action !== "accept" && !reviewNote.trim())}
              className="gap-2 font-serif"
              variant={actionDialog?.action === "reject" ? "destructive" : "default"}
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              {actionDialog?.action === "accept" ? "Accept & Merge" : actionDialog?.action === "reject" ? "Reject" : "Request Info"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- Proposal Card ---------- */

function ProposalCard({
  proposal,
  tree,
  proposer,
  onAction,
}: {
  proposal: Proposal;
  tree?: TreeInfo;
  proposer?: ProposerInfo;
  onAction: (action: "accept" | "reject" | "needs_more_info") => void;
}) {
  const fieldLabels: Record<string, string> = {
    name: "Name",
    species: "Species",
    latitude: "Latitude",
    longitude: "Longitude",
    what3words: "What3Words",
    access_notes: "Access Notes",
  };

  // Compute distance if location changed
  let distanceM: number | null = null;
  if (
    tree &&
    tree.latitude &&
    tree.longitude &&
    (proposal.proposed_changes.latitude !== undefined || proposal.proposed_changes.longitude !== undefined)
  ) {
    const newLat = (proposal.proposed_changes.latitude as number) ?? tree.latitude;
    const newLng = (proposal.proposed_changes.longitude as number) ?? tree.longitude;
    distanceM = haversineMeters(tree.latitude, tree.longitude, newLat, newLng);
  }

  return (
    <Card className="border-border/40 hover:border-primary/20 transition-all">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Link
              to={`/tree/${proposal.tree_id}`}
              className="font-serif text-foreground hover:text-primary transition-colors"
            >
              {tree?.name || "Unknown Tree"}
            </Link>
            <p className="text-xs text-muted-foreground font-serif mt-0.5">
              {tree?.species} • {new Date(proposal.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px] font-serif">
              {proposal.proposal_type === "merge" ? "Duplicate / merge"
                : proposal.proposal_type === "location" ? "Location" : "Details"}
            </Badge>
            {proposal.flags?.map((f) => (
              <Badge key={f} variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-600 font-serif">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {f.replace(/_/g, " ")}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className={`text-[10px] font-serif ${
                proposal.confidence === "high"
                  ? "border-green-500/40 text-green-500"
                  : proposal.confidence === "medium"
                  ? "border-yellow-500/40 text-yellow-500"
                  : "border-muted-foreground/40 text-muted-foreground"
              }`}
            >
              {proposal.confidence}
            </Badge>
          </div>
        </div>

        {/* Diff view */}
        <div className="bg-secondary/20 rounded-lg p-3 space-y-2">
          {Object.entries(proposal.proposed_changes).map(([key, value]) => {
            const currentVal = tree ? (tree as any)[key] : undefined;
            return (
              <div key={key} className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground font-serif text-xs w-24 shrink-0">
                  {fieldLabels[key] || key}
                </span>
                <span className="text-destructive/70 line-through font-mono text-xs truncate max-w-[120px]">
                  {currentVal !== undefined && currentVal !== null ? String(currentVal) : "—"}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-green-500 font-mono text-xs truncate max-w-[120px]">
                  {String(value)}
                </span>
              </div>
            );
          })}
          {distanceM !== null && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              <span className="font-mono">
                {distanceM.toFixed(1)}m moved
                {distanceM > 44 && <span className="text-destructive ml-1">(exceeds 44m limit)</span>}
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide mb-0.5">Reason</p>
          <p className="text-sm font-serif text-foreground/80">{proposal.reason}</p>
        </div>

        {/* Evidence */}
        <div>
          <p className="text-xs text-muted-foreground font-serif uppercase tracking-wide mb-1">Evidence</p>
          <div className="flex flex-wrap gap-2">
            {proposal.evidence.map((ev, i) => (
              <Badge key={i} variant="secondary" className="text-xs font-serif gap-1">
                {ev.type === "link" ? "🔗" : ev.type === "visit" ? "📍" : "📝"}
                {ev.value.length > 50 ? ev.value.slice(0, 50) + "…" : ev.value}
              </Badge>
            ))}
          </div>
        </div>

        {/* Proposer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span className="font-serif">{proposer?.full_name || "Anonymous"}</span>
          </div>

          {proposal.status === "pending" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-serif gap-1 h-7"
                onClick={() => onAction("needs_more_info")}
              >
                <HelpCircle className="w-3 h-3" /> More Info
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-serif gap-1 h-7 border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => onAction("reject")}
              >
                <XCircle className="w-3 h-3" /> Reject
              </Button>
              <Button
                size="sm"
                className="text-xs font-serif gap-1 h-7"
                onClick={() => onAction("accept")}
              >
                <CheckCircle2 className="w-3 h-3" /> Accept
              </Button>
            </div>
          )}

          {proposal.reviewer_note && proposal.status !== "pending" && (
            <p className="text-xs text-muted-foreground italic font-serif max-w-[200px] truncate">
              "{proposal.reviewer_note}"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
