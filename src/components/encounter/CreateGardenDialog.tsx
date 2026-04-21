/**
 * CreateGardenDialog — minimal form for spawning a new Garden / Orchard.
 *
 * Only curators or users with the `garden_steward` role can create
 * (RLS enforces this server-side; the picker hides the entry point
 * for everyone else). Pre-fills lat/lng from the tree being mapped
 * so the garden lives at roughly the same place.
 */
import { useState, useEffect } from "react";
import ResponsiveDialog from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Sprout, Save, X } from "lucide-react";
import { gardenSlug, type Garden } from "@/hooks/use-gardens";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLat?: number | null;
  defaultLng?: number | null;
  onCreated?: (garden: Garden) => void;
}

export default function CreateGardenDialog({
  open,
  onOpenChange,
  defaultLat,
  defaultLng,
  onCreated,
}: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [openDays, setOpenDays] = useState("");
  const [notes, setNotes] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  // Reset whenever dialog opens fresh
  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
    setOpenDays("");
    setNotes("");
    setIsPublic(true);
  }, [open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "A garden needs a name", variant: "destructive" });
      return;
    }
    if (defaultLat == null || defaultLng == null) {
      toast({
        title: "Missing location",
        description: "Place the tree on the map first, then plant the garden.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Please sign in to plant a garden", variant: "destructive" });
        setSaving(false);
        return;
      }

      // Make slug unique by appending a short suffix on collision
      const baseSlug = gardenSlug(name.trim()) || "garden";
      let slug = baseSlug;
      let attempt = 0;
      while (attempt < 5) {
        const { data: existing } = await supabase
          .from("gardens")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!existing) break;
        attempt += 1;
        slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const { data, error } = await supabase
        .from("gardens")
        .insert({
          name: name.trim(),
          slug,
          description: description.trim() || null,
          latitude: defaultLat,
          longitude: defaultLng,
          is_public: isPublic,
          open_days: openDays.trim() || null,
          notes: notes.trim() || null,
          created_by: user.id,
        })
        .select("*")
        .single();

      if (error) {
        // RLS rejection → invite-only message
        if (error.code === "42501" || /row-level security/i.test(error.message)) {
          toast({
            title: "Garden creation is invite-only",
            description: "Ask a curator to grant you the garden steward role.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "Garden planted",
        description: `${data.name} is now a place on the map.`,
      });
      queryClient.invalidateQueries({ queryKey: ["gardens"] });
      onCreated?.(data as Garden);
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Could not plant garden",
        description: err?.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Plant a new garden"
      subtitle="A living place where trees, people, and time can gather."
    >
      <div className="space-y-4 pb-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/15">
          <Sprout className="w-4 h-4 text-primary shrink-0" />
          <p className="text-[11px] font-serif text-muted-foreground/80 leading-relaxed">
            This becomes a node of care — a place that can hold many trees, stories, and seasons.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label
            htmlFor="garden-name"
            className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
          >
            Name
          </Label>
          <Input
            id="garden-name"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 80))}
            maxLength={80}
            placeholder="e.g. Old Cherry Orchard"
            className="font-serif"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label
            htmlFor="garden-desc"
            className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
          >
            Short description
          </Label>
          <Textarea
            id="garden-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            placeholder="What lives here? Who tends it?"
            className="font-serif resize-none"
          />
        </div>

        {/* Open days (optional) */}
        <div className="space-y-1.5">
          <Label
            htmlFor="garden-opendays"
            className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
          >
            Open days{" "}
            <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span>
          </Label>
          <Input
            id="garden-opendays"
            value={openDays}
            onChange={(e) => setOpenDays(e.target.value.slice(0, 120))}
            maxLength={120}
            placeholder="e.g. Sundays · Open by appointment"
            className="font-serif text-sm"
          />
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label
            htmlFor="garden-notes"
            className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
          >
            Notes{" "}
            <span className="normal-case tracking-normal text-muted-foreground/50">(optional)</span>
          </Label>
          <Textarea
            id="garden-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 1000))}
            rows={2}
            maxLength={1000}
            placeholder="Anything visitors should know."
            className="font-serif resize-none"
          />
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-border/30">
          <div className="min-w-0">
            <Label
              htmlFor="garden-public"
              className="text-xs font-serif text-foreground cursor-pointer"
            >
              Visible on the public map
            </Label>
            <p className="text-[10px] text-muted-foreground/70 font-serif">
              Off — only you (and curators) can see it for now.
            </p>
          </div>
          <Switch id="garden-public" checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/30">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="font-serif"
          >
            <X className="h-3.5 w-3.5 mr-1.5" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="font-serif gap-1.5"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Planting…
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Plant garden
              </>
            )}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/50 font-serif text-center">
          A garden is alive · trees, people, and seasons can join it later.
        </p>
      </div>
    </ResponsiveDialog>
  );
}
