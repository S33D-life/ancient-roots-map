/**
 * TreeDirectEditPanel — allows creators and stewards to directly edit tree details.
 * Records all changes to tree_edit_history for transparency.
 * Sensitive fields (location, species) require confirmation.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Pencil,
  LocateFixed,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { searchSpecies } from "@/data/treeSpecies";
import type { TreeEditRole } from "@/hooks/use-tree-edit-permission";

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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tree: Tree;
  userId: string;
  role: TreeEditRole;
  onTreeUpdated: (updated: any) => void;
}

type FieldSensitivity = "low" | "medium" | "high";

const FIELD_SENSITIVITY: Record<string, FieldSensitivity> = {
  description: "low",
  lore_text: "low",
  name: "medium",
  species: "medium",
  estimated_age: "low",
  latitude: "high",
  longitude: "high",
  what3words: "high",
};

const SENSITIVITY_MESSAGES: Record<FieldSensitivity, string | null> = {
  low: null,
  medium: "Changes to this field affect how the tree appears in search and groves.",
  high: "Changes to this field affect how the tree appears in the map and grove.",
};

export default function TreeDirectEditPanel({ open, onOpenChange, tree, userId, role, onTreeUpdated }: Props) {
  const [name, setName] = useState(tree.name);
  const [species, setSpecies] = useState(tree.species);
  const [description, setDescription] = useState(tree.description || "");
  const [estimatedAge, setEstimatedAge] = useState(tree.estimated_age?.toString() || "");
  const [lat, setLat] = useState(tree.latitude?.toString() || "");
  const [lng, setLng] = useState(tree.longitude?.toString() || "");
  const [editReason, setEditReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [findingMe, setFindingMe] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({});
  const [speciesQuery, setSpeciesQuery] = useState("");
  const [showSpeciesSuggestions, setShowSpeciesSuggestions] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setName(tree.name);
      setSpecies(tree.species);
      setDescription(tree.description || "");
      setEstimatedAge(tree.estimated_age?.toString() || "");
      setLat(tree.latitude?.toString() || "");
      setLng(tree.longitude?.toString() || "");
      setEditReason("");
    }
  }, [open, tree]);

  const speciesSuggestions = species ? searchSpecies(species).slice(0, 5) : [];

  // Build changes object
  const buildChanges = useCallback(() => {
    const changes: Record<string, { old: any; new: any }> = {};
    if (name.trim() !== tree.name) changes.name = { old: tree.name, new: name.trim() };
    if (species.trim() !== tree.species) changes.species = { old: tree.species, new: species.trim() };
    if (description.trim() !== (tree.description || "")) changes.description = { old: tree.description, new: description.trim() || null };
    const ageNum = estimatedAge ? parseInt(estimatedAge) : null;
    if (ageNum !== tree.estimated_age) changes.estimated_age = { old: tree.estimated_age, new: ageNum };
    const newLat = lat ? parseFloat(lat) : null;
    const newLng = lng ? parseFloat(lng) : null;
    if (newLat !== tree.latitude) changes.latitude = { old: tree.latitude, new: newLat };
    if (newLng !== tree.longitude) changes.longitude = { old: tree.longitude, new: newLng };
    return changes;
  }, [name, species, description, estimatedAge, lat, lng, tree]);

  const changes = buildChanges();
  const hasChanges = Object.keys(changes).length > 0;

  // Check if any sensitive field is changed
  const hasSensitiveChanges = Object.keys(changes).some(
    (f) => FIELD_SENSITIVITY[f] === "high" || FIELD_SENSITIVITY[f] === "medium"
  );

  const handleSave = () => {
    if (!hasChanges) return;
    if (hasSensitiveChanges) {
      setPendingChanges(changes);
      setConfirmOpen(true);
    } else {
      executeChanges(changes);
    }
  };

  const executeChanges = async (changesToApply: Record<string, { old: any; new: any }>) => {
    setSaving(true);
    try {
      // Build update object
      const updateObj: Record<string, any> = {};
      for (const [field, vals] of Object.entries(changesToApply)) {
        updateObj[field] = vals.new;
      }

      const { data, error } = await supabase
        .from("trees")
        .update(updateObj)
        .eq("id", tree.id)
        .select("*")
        .single();

      if (error) throw error;

      // Record history entries
      const historyEntries = Object.entries(changesToApply).map(([field, vals]) => ({
        tree_id: tree.id,
        user_id: userId,
        field_name: field,
        old_value: vals.old != null ? String(vals.old) : null,
        new_value: vals.new != null ? String(vals.new) : null,
        edit_reason: editReason.trim() || null,
        edit_type: "direct",
      }));

      await supabase.from("tree_edit_history" as any).insert(historyEntries as any);

      onTreeUpdated(data);
      toast.success("Tree details updated");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Failed to save: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setFindingMe(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setFindingMe(false);
      },
      (err) => {
        toast.error(err.message);
        setFindingMe(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const sensitiveFields = Object.keys(pendingChanges).filter(
    (f) => FIELD_SENSITIVITY[f] === "high" || FIELD_SENSITIVITY[f] === "medium"
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto sm:max-w-lg" style={{ maxHeight: '100dvh' }}>
          <SheetHeader>
            <SheetTitle className="font-serif text-primary tracking-wide flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit Details
            </SheetTitle>
            <p className="text-xs text-muted-foreground font-serif">
              {role === "creator" ? "You created this Ancient Friend" : "Steward editing"}
              {" — changes are recorded in the tree's history."}
            </p>
          </SheetHeader>

          <div className="space-y-5 mt-6">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-serif text-muted-foreground">Tree Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="font-serif text-sm"
                maxLength={200}
              />
              {changes.name && (
                <SensitivityBadge field="name" />
              )}
            </div>

            {/* Species */}
            <div className="space-y-1.5 relative">
              <Label className="text-xs font-serif text-muted-foreground">Species</Label>
              <Input
                value={species}
                onChange={(e) => {
                  setSpecies(e.target.value);
                  setShowSpeciesSuggestions(true);
                }}
                onFocus={() => setShowSpeciesSuggestions(true)}
                className="font-serif text-sm"
                maxLength={200}
              />
              {showSpeciesSuggestions && speciesSuggestions.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {speciesSuggestions.map((s) => (
                    <button
                      key={s.common + s.scientific}
                      className="w-full text-left px-3 py-2 text-xs font-serif hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSpecies(s.common || s.scientific);
                        setShowSpeciesSuggestions(false);
                      }}
                    >
                      {s.common} <span className="text-muted-foreground italic">({s.scientific})</span>
                    </button>
                  ))}
                </div>
              )}
              {changes.species && (
                <SensitivityBadge field="species" />
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-serif text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="font-serif text-sm min-h-[80px]"
                maxLength={2000}
              />
            </div>

            {/* Estimated Age */}
            <div className="space-y-1.5">
              <Label className="text-xs font-serif text-muted-foreground">Estimated Age (years)</Label>
              <Input
                type="number"
                value={estimatedAge}
                onChange={(e) => setEstimatedAge(e.target.value)}
                className="font-serif text-sm"
                min={0}
                max={10000}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label className="text-xs font-serif text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> Location
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground/60">Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="font-serif text-sm"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground/60">Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    className="font-serif text-sm"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5"
                onClick={handleUseMyLocation}
                disabled={findingMe}
              >
                {findingMe ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                Use my location
              </Button>
              {(changes.latitude || changes.longitude) && (
                <SensitivityBadge field="latitude" />
              )}
            </div>

            {/* Edit reason */}
            <div className="space-y-1.5">
              <Label className="text-xs font-serif text-muted-foreground">Reason for edit (optional)</Label>
              <Input
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="e.g. Corrected species after field visit"
                className="font-serif text-sm"
                maxLength={500}
              />
            </div>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="w-full font-serif tracking-wide"
            >
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Confirmation dialog for sensitive fields */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Confirm Sensitive Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="font-serif text-sm space-y-2">
              <p>You're updating fields that affect how this tree appears in the map and grove:</p>
              <ul className="list-disc pl-5 space-y-1">
                {sensitiveFields.map((f) => (
                  <li key={f} className="text-foreground/80">
                    <span className="font-medium">{f}</span>: {String(pendingChanges[f]?.old ?? "—")} → {String(pendingChanges[f]?.new ?? "—")}
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs mt-2">
                These changes will be recorded in the tree's history for transparency.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-serif">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="font-serif"
              onClick={() => {
                setConfirmOpen(false);
                executeChanges(pendingChanges);
              }}
            >
              Confirm Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SensitivityBadge({ field }: { field: string }) {
  const level = FIELD_SENSITIVITY[field] || "low";
  const message = SENSITIVITY_MESSAGES[level];
  if (!message) return null;

  return (
    <div className="flex items-start gap-1.5 mt-1">
      <AlertTriangle className="h-3 w-3 text-accent shrink-0 mt-0.5" />
      <span className="text-[10px] text-accent/80">{message}</span>
    </div>
  );
}
