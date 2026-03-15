/**
 * RoadmapLinker — allows curators to link a bug report to a roadmap feature.
 * Uses static ROADMAP_FEATURES data with slug-based linking.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link2, X } from "lucide-react";
import { ROADMAP_FEATURES, STAGE_META, type RoadmapFeature } from "@/data/roadmap-forest";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  bugId: string;
  currentSlug: string | null;
  onLinked: (slug: string | null) => void;
}

export default function RoadmapLinker({ bugId, currentSlug, onLinked }: Props) {
  const [saving, setSaving] = useState(false);

  const currentFeature = currentSlug
    ? ROADMAP_FEATURES.find((f) => f.id === currentSlug)
    : null;

  const handleLink = async (slug: string) => {
    if (slug === "__none__") {
      await unlink();
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("bug_reports")
      .update({ roadmap_feature_slug: slug } as any)
      .eq("id", bugId);
    setSaving(false);
    if (error) {
      toast.error("Failed to link");
      return;
    }
    onLinked(slug);
    toast.success("Linked to roadmap");
  };

  const unlink = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("bug_reports")
      .update({ roadmap_feature_slug: null } as any)
      .eq("id", bugId);
    setSaving(false);
    if (error) {
      toast.error("Failed to unlink");
      return;
    }
    onLinked(null);
    toast.success("Unlinked from roadmap");
  };

  if (currentFeature) {
    return (
      <div className="flex items-center gap-2 text-xs bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
        <Link2 className="w-3 h-3 text-primary shrink-0" />
        <span className="font-serif text-foreground">
          {currentFeature.symbol || STAGE_META[currentFeature.stage].emoji} {currentFeature.name}
        </span>
        <button
          onClick={unlink}
          disabled={saving}
          className="ml-auto text-muted-foreground hover:text-foreground transition-colors min-w-[28px] min-h-[28px] flex items-center justify-center"
          aria-label="Unlink"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
      <Select onValueChange={handleLink} disabled={saving}>
        <SelectTrigger className="h-7 text-[10px] flex-1">
          <SelectValue placeholder="Link to roadmap…" />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value="__none__" className="text-xs text-muted-foreground">None</SelectItem>
          {ROADMAP_FEATURES.map((f) => (
            <SelectItem key={f.id} value={f.id} className="text-xs">
              {f.symbol || STAGE_META[f.stage].emoji} {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
