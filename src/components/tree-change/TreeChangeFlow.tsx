/**
 * TreeChangeFlow — one coherent flow for changing an Ancient Friend's record.
 *
 * Three ways in, same rules:
 *   Details            — update the tree's written record
 *   Correct location   — move the pin to where the tree truly stands
 *   Duplicate / merge  — say that two entries are the same physical tree
 *
 * Whether a change saves immediately or travels to the curators is decided by
 * the database (public.tree_edit_eligibility) and re-checked on every write.
 * Merges always go to curators, even when proposed by the record's creator.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2, MapPin, GitMerge, Pencil, CheckCircle2, Search, Clock, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import TreeLocationPicker from "./TreeLocationPicker";
import { useTreeEditEligibility, type TreeEditEligibility } from "@/hooks/use-tree-edit-eligibility";
import { haversineDistance } from "@/utils/treeSimilarityEngine";

import { TREE_TEXT_FIELDS, type TreeFieldKey } from "@/lib/tree-change/fields";

type FieldKey = TreeFieldKey;

const TEXT_FIELDS = TREE_TEXT_FIELDS;


interface TreeRow {
  id: string;
  name: string;
  species: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at?: string | null;
  photo_url?: string | null;
  [k: string]: unknown;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treeId: string;
  tree: TreeRow;
  onTreeUpdated?: (tree: TreeRow) => void;
  initialTab?: "details" | "location" | "duplicate";
}

const asText = (v: unknown) => (v == null ? "" : String(v));

function friendlyError(message: string): string {
  if (message.includes("review_required")) return "Someone else has since contributed to this tree, so these changes now need curator review.";
  if (message.includes("stale_edit") || message.includes("stale_proposal")) return "This tree has changed since you opened the form. Reopen it to see the newest record.";
  if (message.includes("duplicate_pending_merge")) return "A merge proposal for these two trees is already awaiting review.";
  if (message.includes("reason_required")) return "Please say briefly why this change is needed.";
  if (message.includes("not_signed_in")) return "Please sign in to contribute a change.";
  return "That didn't save. Your words are still here — please try again.";
}

export default function TreeChangeFlow({
  open, onOpenChange, treeId, tree, onTreeUpdated, initialTab = "details",
}: Props) {
  const { eligibility, loading: eligLoading, refresh } = useTreeEditEligibility(open ? treeId : undefined);
  const [tab, setTab] = useState(initialTab);
  const [current, setCurrent] = useState<TreeRow>(tree);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lat, setLat] = useState<number | null>(tree.latitude);
  const [lng, setLng] = useState<number | null>(tree.longitude);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [forcedProposal, setForcedProposal] = useState(false);
  const [myProposals, setMyProposals] = useState<any[]>([]);

  // Duplicate / merge state
  const [dupQuery, setDupQuery] = useState("");
  const [dupResults, setDupResults] = useState<TreeRow[]>([]);
  const [dupSearching, setDupSearching] = useState(false);
  const [dupSelected, setDupSelected] = useState<TreeRow | null>(null);
  const [dupSurvivor, setDupSurvivor] = useState<string>(treeId);
  const [dupReason, setDupReason] = useState("");

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setFormError(null);
    setSuccess(null);
    setForcedProposal(false);
    (async () => {
      const { data } = await supabase.from("trees").select("*").eq("id", treeId).maybeSingle();
      if (data) {
        setCurrent(data as TreeRow);
        setLat((data as TreeRow).latitude);
        setLng((data as TreeRow).longitude);
        const seeded: Record<string, string> = {};
        TEXT_FIELDS.forEach((f) => (seeded[f.key] = asText((data as any)[f.key])));
        setValues(seeded);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: props } = await supabase
          .from("tree_edit_proposals" as any)
          .select("id, status, reason, reviewer_note, created_at, proposal_type")
          .eq("tree_id", treeId)
          .eq("proposed_by", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        setMyProposals((props as any[]) || []);
      }
      // nearby candidates for the duplicate tab
      if (data?.latitude != null && data?.longitude != null) {
        const d = 0.01;
        const { data: near } = await supabase
          .from("trees")
          .select("id, name, species, latitude, longitude")
          .neq("id", treeId)
          .is("merged_into_tree_id", null)
          .gte("latitude", data.latitude - d).lte("latitude", data.latitude + d)
          .gte("longitude", data.longitude - d).lte("longitude", data.longitude + d)
          .limit(12);
        setDupResults((near as TreeRow[]) || []);
      }
    })();
  }, [open, treeId, initialTab]);

  const directEdit = eligibility.can_direct_edit && !forcedProposal;

  const detailChanges = useMemo(() => {
    const out: Record<string, string> = {};
    TEXT_FIELDS.forEach((f) => {
      const next = (values[f.key] ?? "").trim();
      if (next !== asText((current as any)[f.key]).trim()) out[f.key] = next;
    });
    return out;
  }, [values, current]);

  const locationChanged =
    lat != null && lng != null &&
    (lat !== current.latitude || lng !== current.longitude);

  const movedMeters =
    locationChanged && current.latitude != null && current.longitude != null && lat != null && lng != null
      ? haversineDistance(current.latitude, current.longitude, lat, lng)
      : 0;

  const dirty = Object.keys(detailChanges).length > 0 || locationChanged || !!dupSelected;

  useEffect(() => {
    if (!open || !dirty || success) return;
    const protectUnsavedChanges = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", protectUnsavedChanges);
    return () => window.removeEventListener("beforeunload", protectUnsavedChanges);
  }, [dirty, open, success]);

  const validateDetails = () => {
    const e: Record<string, string> = {};
    if ("name" in detailChanges && !detailChanges.name) e.name = "A tree needs a name.";
    if ("species" in detailChanges && !detailChanges.species) e.species = "A tree needs a species.";
    (["estimated_age", "planted_year", "girth_cm"] as FieldKey[]).forEach((k) => {
      const v = detailChanges[k];
      if (v && (Number.isNaN(Number(v)) || Number(v) < 0)) e[k] = "Please use a whole number.";
    });
    if (!directEdit && reason.trim().length < 5) e.reason = "Please say briefly why this change is needed.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFailure = async (message: string) => {
    if (message.includes("review_required")) {
      setForcedProposal(true);
      await refresh();
    }
    setFormError(friendlyError(message));
  };

  const submitChanges = async (changes: Record<string, unknown>, type: "edit" | "location") => {
    setSaving(true);
    setFormError(null);
    try {
      if (directEdit) {
        const { data, error } = await (supabase.rpc as any)("apply_tree_direct_edit", {
          _tree_id: treeId,
          _changes: changes,
          _reason: reason.trim() || null,
          _base_updated_at: current.updated_at ?? null,
        });
        if (error) throw error;
        setCurrent(data as TreeRow);
        onTreeUpdated?.(data as TreeRow);
        setSuccess("Saved. The tree's record now carries your care.");
        toast.success("Changes saved");
      } else {
        const { error } = await (supabase.rpc as any)("submit_tree_change_proposal", {
          _tree_id: treeId,
          _proposal_type: type,
          _changes: changes,
          _reason: reason.trim(),
          _evidence: [],
          _confidence: "medium",
        });
        if (error) throw error;
        setSuccess("Sent. Your proposal is awaiting curator review.");
        toast.success("Proposal submitted");
      }
      await refresh();
    } catch (err: any) {
      await handleFailure(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  };

  const saveDetails = async () => {
    if (!validateDetails()) return;
    if (Object.keys(detailChanges).length === 0) {
      setFormError("Nothing has changed yet.");
      return;
    }
    await submitChanges(detailChanges, "edit");
  };

  const saveLocation = async () => {
    if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      setFormError("Those coordinates fall outside the world. Please check them.");
      return;
    }
    if (!directEdit && reason.trim().length < 5) {
      setErrors({ reason: "Please say briefly why the location needs correcting." });
      return;
    }
    await submitChanges({ latitude: lat, longitude: lng }, "location");
  };

  const searchDuplicates = async () => {
    if (dupQuery.trim().length < 2) return;
    setDupSearching(true);
    const { data } = await supabase
      .from("trees")
      .select("id, name, species, latitude, longitude")
      .neq("id", treeId)
      .is("merged_into_tree_id", null)
      .ilike("name", `%${dupQuery.trim()}%`)
      .limit(12);
    setDupResults((data as TreeRow[]) || []);
    setDupSearching(false);
  };

  const submitMerge = async () => {
    if (!dupSelected) return;
    if (dupReason.trim().length < 5) {
      setErrors({ dupReason: "Please explain why these are the same physical tree." });
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const { error } = await (supabase.rpc as any)("submit_tree_change_proposal", {
        _tree_id: treeId,
        _proposal_type: "merge",
        _changes: {},
        _reason: dupReason.trim(),
        _evidence: [],
        _confidence: "medium",
        _merge_target_tree_id: dupSelected.id,
        _merge_preferred_tree_id: dupSurvivor,
      });
      if (error) throw error;
      setSuccess("Sent. A curator will compare both records before anything is joined.");
      toast.success("Merge proposal submitted");
      setDupSelected(null);
      setDupReason("");
    } catch (err: any) {
      await handleFailure(String(err?.message ?? err));
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (dirty && !success) setConfirmDiscard(true);
    else onOpenChange(false);
  };

  const modeNote = eligLoading
    ? "Checking how your changes will travel…"
    : directEdit
      ? "You added this tree and nobody else has tended it yet — your changes save straight away."
      : eligibility.reason === "others_contributed"
        ? "Others have helped grow this tree's record, so changes now travel to the curators."
        : "You didn't add this tree, so your changes travel to the curators for review.";

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : requestClose())}>
        <DialogContent className="max-w-lg max-h-[92dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <Pencil className="h-4 w-4 text-primary" />
              {directEdit ? "Edit tree" : "Propose changes"}
            </DialogTitle>
            <DialogDescription className="font-serif text-xs">{modeNote}</DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto" />
              <p className="font-serif text-sm text-foreground/80">{success}</p>
              <Button className="font-serif" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full font-serif">
                <TabsTrigger value="details" className="flex-1 text-xs">Details</TabsTrigger>
                <TabsTrigger value="location" className="flex-1 text-xs">Location</TabsTrigger>
                <TabsTrigger value="duplicate" className="flex-1 text-xs">Duplicate</TabsTrigger>
              </TabsList>

              {/* ---------- Details ---------- */}
              <TabsContent value="details" className="space-y-3 pt-4">
                {TEXT_FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label htmlFor={`tcf-${f.key}`} className="text-xs font-serif">
                      {f.label}
                      {f.hint && <span className="text-muted-foreground/70 ml-1">· {f.hint}</span>}
                    </Label>
                    {f.long ? (
                      <Textarea
                        id={`tcf-${f.key}`}
                        className="text-base font-serif min-h-[72px]"
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    ) : (
                      <Input
                        id={`tcf-${f.key}`}
                        className="text-base font-serif"
                        inputMode={f.numeric ? "numeric" : undefined}
                        value={values[f.key] ?? ""}
                        onChange={(e) => setValues((p) => ({ ...p, [f.key]: e.target.value }))}
                      />
                    )}
                    {errors[f.key] && <p className="text-[11px] text-destructive font-serif">{errors[f.key]}</p>}
                  </div>
                ))}
                <ReasonField
                  required={!directEdit}
                  value={reason}
                  onChange={setReason}
                  error={errors.reason}
                />
                <FlowFooter
                  saving={saving}
                  error={formError}
                  label={directEdit ? "Save changes" : "Submit proposal"}
                  onCancel={requestClose}
                  onSubmit={saveDetails}
                  disabled={Object.keys(detailChanges).length === 0}
                />
              </TabsContent>

              {/* ---------- Location ---------- */}
              <TabsContent value="location" className="space-y-3 pt-4">
                <TreeLocationPicker
                  originalLat={current.latitude}
                  originalLng={current.longitude}
                  lat={lat}
                  lng={lng}
                  onChange={(a, b) => { setLat(a); setLng(b); }}
                />
                {locationChanged && (
                  <p className="text-xs font-serif text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3 w-3" />
                    Proposed move: {Math.round(movedMeters)}m from the recorded position.
                  </p>
                )}
                <ReasonField
                  required={!directEdit}
                  value={reason}
                  onChange={setReason}
                  error={errors.reason}
                  placeholder="How do you know this is the right spot?"
                />
                <FlowFooter
                  saving={saving}
                  error={formError}
                  label={directEdit ? "Save changes" : "Submit proposal"}
                  onCancel={requestClose}
                  onSubmit={saveLocation}
                  disabled={!locationChanged}
                />
              </TabsContent>

              {/* ---------- Duplicate / merge ---------- */}
              <TabsContent value="duplicate" className="space-y-3 pt-4">
                <p className="text-xs font-serif text-muted-foreground">
                  Every merge is reviewed by a curator, because joining records touches
                  many people's offerings and memories.
                </p>
                <div className="flex gap-2">
                  <Input
                    className="text-base font-serif"
                    placeholder="Search trees by name"
                    value={dupQuery}
                    onChange={(e) => setDupQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && searchDuplicates()}
                  />
                  <Button variant="outline" className="font-serif" onClick={searchDuplicates} disabled={dupSearching}>
                    {dupSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                {dupResults.length === 0 ? (
                  <p className="text-xs font-serif text-muted-foreground/70 py-3 text-center">
                    No other trees found nearby. Search by name to look further afield.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {dupResults.map((t) => {
                      const dist =
                        current.latitude != null && current.longitude != null && t.latitude != null && t.longitude != null
                          ? Math.round(haversineDistance(current.latitude, current.longitude, t.latitude, t.longitude))
                          : null;
                      const selected = dupSelected?.id === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => { setDupSelected(selected ? null : t); setDupSurvivor(treeId); }}
                          className={`w-full text-left rounded-lg border px-3 py-2 transition-colors min-h-11 ${
                            selected ? "border-primary/60 bg-primary/5" : "border-border/40 hover:border-primary/30"
                          }`}
                        >
                          <p className="font-serif text-sm text-foreground/90">{t.name}</p>
                          <p className="text-[11px] text-muted-foreground font-serif">
                            {t.species ?? "Unknown species"}
                            {dist != null && ` · ${dist}m away`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}

                {dupSelected && (
                  <div className="space-y-3 rounded-lg border border-border/40 p-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-serif">Which record should survive?</Label>
                      <div className="flex gap-2">
                        {[{ id: treeId, name: current.name }, { id: dupSelected.id, name: dupSelected.name }].map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => setDupSurvivor(o.id)}
                            className={`flex-1 rounded-md border px-2 py-2 text-xs font-serif min-h-11 ${
                              dupSurvivor === o.id ? "border-primary/60 bg-primary/5" : "border-border/40"
                            }`}
                          >
                            {o.name}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground font-serif">
                        A curator makes the final choice.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="tcf-dup-reason" className="text-xs font-serif">
                        Why are these the same tree?
                      </Label>
                      <Textarea
                        id="tcf-dup-reason"
                        className="text-base font-serif min-h-[72px]"
                        value={dupReason}
                        onChange={(e) => setDupReason(e.target.value)}
                      />
                      {errors.dupReason && <p className="text-[11px] text-destructive font-serif">{errors.dupReason}</p>}
                    </div>
                    <FlowFooter
                      saving={saving}
                      error={formError}
                      label="Submit proposal"
                      onCancel={requestClose}
                      onSubmit={submitMerge}
                      disabled={false}
                    />
                  </div>
                )}
              </TabsContent>

              {myProposals.length > 0 && (
                <div className="mt-6 space-y-2 border-t border-border/30 pt-4">
                  <p className="text-xs font-serif text-muted-foreground">Your recent proposals</p>
                  {myProposals.map((p) => (
                    <div key={p.id} className="flex items-start gap-2 text-[11px] font-serif">
                      <Badge variant="outline" className="text-[9px] gap-1 shrink-0">
                        {p.status === "pending" ? <Clock className="h-2.5 w-2.5" /> : <ShieldCheck className="h-2.5 w-2.5" />}
                        {p.status === "pending" ? "Awaiting curator review"
                          : p.status === "accepted" ? "Approved"
                          : p.status === "rejected" ? "Declined"
                          : p.status.replace(/_/g, " ")}
                      </Badge>
                      <span className="text-muted-foreground/80 truncate">
                        {p.reviewer_note || p.reason}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={setConfirmDiscard}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription className="font-serif">
              Your unsaved changes to this tree will be let go.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Keep editing</AlertDialogCancel>
            <AlertDialogAction className="font-serif" onClick={() => { setConfirmDiscard(false); onOpenChange(false); }}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ReasonField({
  required, value, onChange, error, placeholder,
}: { required: boolean; value: string; onChange: (v: string) => void; error?: string; placeholder?: string }) {
  return (
    <div className="space-y-1">
      <Label htmlFor="tcf-reason" className="text-xs font-serif">
        {required ? "Why this change?" : "Note for the record"}
        {!required && <span className="text-muted-foreground/70 ml-1">· Optional</span>}
      </Label>
      <Textarea
        id="tcf-reason"
        className="text-base font-serif min-h-[64px]"
        placeholder={placeholder ?? "A sentence or two is plenty."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <p className="text-[11px] text-destructive font-serif">{error}</p>}
    </div>
  );
}

function FlowFooter({
  saving, error, label, onCancel, onSubmit, disabled,
}: { saving: boolean; error: string | null; label: string; onCancel: () => void; onSubmit: () => void; disabled: boolean }) {
  return (
    <div className="space-y-2 pt-1">
      {error && (
        <p className="text-[11px] text-destructive font-serif" role="alert">{error}</p>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" className="font-serif" onClick={onCancel} disabled={saving}>Cancel</Button>
        <Button className="font-serif gap-1.5 min-h-11" onClick={onSubmit} disabled={saving || disabled}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitMerge className="h-4 w-4 hidden" />}
          {label}
        </Button>
      </div>
    </div>
  );
}
