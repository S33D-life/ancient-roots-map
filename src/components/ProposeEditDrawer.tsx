import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, AlertTriangle, CheckCircle2, Plus, X, Link as LinkIcon, Camera, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface Tree {
  id: string;
  name: string;
  species: string;
  latitude: number | null;
  longitude: number | null;
  what3words: string | null;
  description: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: Tree;
}

type EvidenceItem = { type: "note" | "link" | "visit"; value: string };

const HAVERSINE_LIMIT_M = 44;

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ProposeEditDrawer({ open, onOpenChange, tree }: Props) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [editName, setEditName] = useState(false);
  const [name, setName] = useState(tree.name);
  const [editSpecies, setEditSpecies] = useState(false);
  const [species, setSpecies] = useState(tree.species);
  const [editW3W, setEditW3W] = useState(false);
  const [w3w, setW3w] = useState(tree.what3words || "");
  const [editLocation, setEditLocation] = useState(false);
  const [lat, setLat] = useState(tree.latitude?.toString() || "");
  const [lng, setLng] = useState(tree.longitude?.toString() || "");
  const [editNotes, setEditNotes] = useState(false);
  const [accessNotes, setAccessNotes] = useState("");

  // Required fields
  const [reason, setReason] = useState("");
  const [confidence, setConfidence] = useState<"low" | "medium" | "high">("medium");
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [newEvidenceType, setNewEvidenceType] = useState<EvidenceItem["type"]>("note");
  const [newEvidenceValue, setNewEvidenceValue] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(tree.name);
      setSpecies(tree.species);
      setW3w(tree.what3words || "");
      setLat(tree.latitude?.toString() || "");
      setLng(tree.longitude?.toString() || "");
      setAccessNotes("");
      setReason("");
      setConfidence("medium");
      setEvidence([]);
      setEditName(false);
      setEditSpecies(false);
      setEditW3W(false);
      setEditLocation(false);
      setEditNotes(false);
    }
  }, [open, tree]);

  const addEvidence = () => {
    if (!newEvidenceValue.trim()) return;
    setEvidence((prev) => [...prev, { type: newEvidenceType, value: newEvidenceValue.trim() }]);
    setNewEvidenceValue("");
  };

  const removeEvidence = (i: number) => setEvidence((prev) => prev.filter((_, idx) => idx !== i));

  // Build proposed changes
  const buildChanges = () => {
    const changes: Record<string, unknown> = {};
    if (editName && name !== tree.name) changes.name = name;
    if (editSpecies && species !== tree.species) changes.species = species;
    if (editW3W && w3w !== (tree.what3words || "")) changes.what3words = w3w;
    if (editLocation) {
      const pLat = parseFloat(lat);
      const pLng = parseFloat(lng);
      if (!isNaN(pLat) && !isNaN(pLng)) {
        if (pLat !== tree.latitude) changes.latitude = pLat;
        if (pLng !== tree.longitude) changes.longitude = pLng;
      }
    }
    if (editNotes && accessNotes.trim()) changes.access_notes = accessNotes.trim();
    return changes;
  };

  const changes = buildChanges();
  const hasChanges = Object.keys(changes).length > 0;

  // Auto-flags
  const flags: string[] = [];
  if (changes.latitude !== undefined || changes.longitude !== undefined) {
    const pLat = parseFloat(lat);
    const pLng = parseFloat(lng);
    if (tree.latitude && tree.longitude && !isNaN(pLat) && !isNaN(pLng)) {
      const dist = haversineMeters(tree.latitude, tree.longitude, pLat, pLng);
      if (dist > HAVERSINE_LIMIT_M) flags.push("major_relocation");
    }
  }
  if (changes.species) flags.push("species_change");

  const canSubmit = hasChanges && reason.trim().length >= 5 && evidence.length >= 1 && userId;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    const { error } = await supabase.from("tree_edit_proposals" as any).insert({
      tree_id: tree.id,
      proposed_by: userId,
      proposed_changes: changes,
      reason: reason.trim(),
      evidence,
      confidence,
      flags,
      status: "pending",
    } as any);
    setSaving(false);
    if (error) {
      toast.error("Failed to submit proposal: " + error.message);
    } else {
      toast.success("Thank you — your suggestion is now in review.");
      onOpenChange(false);
    }
  };

  const evidenceTypeIcons: Record<EvidenceItem["type"], React.ReactNode> = {
    note: <MessageSquare className="w-3 h-3" />,
    link: <LinkIcon className="w-3 h-3" />,
    visit: <MapPin className="w-3 h-3" />,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-serif text-primary tracking-wide">Propose an Edit</SheetTitle>
          <p className="text-xs text-muted-foreground font-serif">
            Suggest corrections for <span className="text-foreground">{tree.name}</span>
          </p>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Toggle-able edit fields */}
          <EditField
            label="Tree Name"
            currentValue={tree.name}
            editing={editName}
            onToggle={() => setEditName(!editName)}
          >
            <Input value={name} onChange={(e) => setName(e.target.value)} className="font-serif text-sm" />
          </EditField>

          <EditField
            label="Species"
            currentValue={tree.species}
            editing={editSpecies}
            onToggle={() => setEditSpecies(!editSpecies)}
          >
            <Input value={species} onChange={(e) => setSpecies(e.target.value)} className="font-serif text-sm" />
            {editSpecies && species !== tree.species && (
              <Badge variant="outline" className="mt-1 text-[10px] border-accent/50 text-accent">
                <AlertTriangle className="w-3 h-3 mr-1" /> Species change flagged for review
              </Badge>
            )}
          </EditField>

          <EditField
            label="What3Words"
            currentValue={tree.what3words || "Not set"}
            editing={editW3W}
            onToggle={() => setEditW3W(!editW3W)}
          >
            <Input value={w3w} onChange={(e) => setW3w(e.target.value)} placeholder="///word.word.word" className="font-serif text-sm font-mono" />
          </EditField>

          <EditField
            label="Location (lat / lng)"
            currentValue={tree.latitude && tree.longitude ? `${tree.latitude}, ${tree.longitude}` : "Not set"}
            editing={editLocation}
            onToggle={() => setEditLocation(!editLocation)}
          >
            <div className="flex gap-2">
              <Input value={lat} onChange={(e) => setLat(e.target.value)} placeholder="Latitude" className="font-mono text-sm" />
              <Input value={lng} onChange={(e) => setLng(e.target.value)} placeholder="Longitude" className="font-mono text-sm" />
            </div>
            {flags.includes("major_relocation") && (
              <Badge variant="outline" className="mt-1 text-[10px] border-destructive/50 text-destructive">
                <AlertTriangle className="w-3 h-3 mr-1" /> Major relocation (&gt;44m)
              </Badge>
            )}
          </EditField>

          <EditField
            label="Access Notes"
            currentValue="Add notes about access"
            editing={editNotes}
            onToggle={() => setEditNotes(!editNotes)}
          >
            <Textarea
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="e.g. Path from car park, gate code…"
              className="font-serif text-sm"
              rows={2}
            />
          </EditField>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Reason */}
          <div>
            <Label className="font-serif text-xs tracking-wide text-muted-foreground uppercase">
              Reason for change *
            </Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should this record be updated?"
              className="font-serif text-sm mt-1.5"
              rows={2}
            />
          </div>

          {/* Confidence */}
          <div>
            <Label className="font-serif text-xs tracking-wide text-muted-foreground uppercase">
              Confidence Level
            </Label>
            <Select value={confidence} onValueChange={(v) => setConfidence(v as typeof confidence)}>
              <SelectTrigger className="font-serif text-sm mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low — I think this might be right</SelectItem>
                <SelectItem value="medium">Medium — I'm fairly certain</SelectItem>
                <SelectItem value="high">High — I've verified this in person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Evidence */}
          <div>
            <Label className="font-serif text-xs tracking-wide text-muted-foreground uppercase">
              Evidence * <span className="normal-case text-muted-foreground/60">(at least 1)</span>
            </Label>
            <div className="space-y-2 mt-2">
              {evidence.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/30 rounded-md px-3 py-1.5 text-sm">
                  {evidenceTypeIcons[ev.type]}
                  <span className="font-serif flex-1 truncate">{ev.value}</span>
                  <button onClick={() => removeEvidence(i)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <Select value={newEvidenceType} onValueChange={(v) => setNewEvidenceType(v as EvidenceItem["type"])}>
                  <SelectTrigger className="w-[100px] text-xs font-serif">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">Note</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="visit">Visit</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newEvidenceValue}
                  onChange={(e) => setNewEvidenceValue(e.target.value)}
                  placeholder={newEvidenceType === "link" ? "https://…" : newEvidenceType === "visit" ? "Date / description of visit" : "Your observation…"}
                  className="text-sm font-serif flex-1"
                  onKeyDown={(e) => e.key === "Enter" && addEvidence()}
                />
                <Button variant="outline" size="icon" onClick={addEvidence} className="shrink-0">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Flags preview */}
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {flags.map((f) => (
                <Badge key={f} variant="outline" className="text-[10px] border-accent/40 text-accent font-serif">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {f.replace(/_/g, " ")}
                </Badge>
              ))}
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="w-full gap-2 font-serif tracking-wider"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit Proposal
          </Button>

          {!userId && (
            <p className="text-xs text-center text-muted-foreground font-serif">
              You must be signed in to propose edits.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* Toggleable edit field wrapper */
function EditField({
  label,
  currentValue,
  editing,
  onToggle,
  children,
}: {
  label: string;
  currentValue: string;
  editing: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="font-serif text-xs tracking-wide text-muted-foreground uppercase">{label}</Label>
        <button
          onClick={onToggle}
          className="text-xs text-primary hover:text-primary/80 font-serif transition-colors"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>
      {editing ? (
        <div>{children}</div>
      ) : (
        <p className="text-sm font-serif text-foreground/70">{currentValue}</p>
      )}
    </div>
  );
}
