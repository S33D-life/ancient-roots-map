import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lock, Users, Globe, Beaker, ChevronDown, ChevronRight, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { CollaboratorVolume } from "@/hooks/use-collaborator-volumes";

interface Props {
  volume: CollaboratorVolume;
  isOwner?: boolean;
  onVisibilityChange?: (id: string, newState: "root" | "ring" | "ripple") => void;
  onDelete?: (id: string) => void;
  onOpenDetail?: (volume: CollaboratorVolume) => void;
}

const VISIBILITY_CONFIG = {
  root: {
    icon: Lock,
    label: "Root (Heartwood)",
    borderColor: "border-amber-800/40",
    accentColor: "hsl(28 35% 30%)",
    bgGradient: "linear-gradient(135deg, hsl(28 25% 12% / 0.7), hsl(22 20% 10% / 0.7))",
  },
  ring: {
    icon: Users,
    label: "Ring (Wanderers)",
    borderColor: "border-emerald-700/40",
    accentColor: "hsl(140 30% 35%)",
    bgGradient: "linear-gradient(135deg, hsl(140 20% 12% / 0.7), hsl(130 15% 10% / 0.7))",
  },
  ripple: {
    icon: Globe,
    label: "Ripple (Linked)",
    borderColor: "border-amber-500/40",
    accentColor: "hsl(38 70% 50%)",
    bgGradient: "linear-gradient(135deg, hsl(38 25% 14% / 0.7), hsl(30 20% 10% / 0.7))",
  },
};

const STATUS_LABELS: Record<string, string> = {
  exploring: "🌱 Exploring",
  testing: "🧪 Testing",
  active: "🌿 Active",
  dormant: "🍂 Dormant",
};

const CollaboratorVolumeCard = ({ volume, isOwner, onVisibilityChange, onDelete, onOpenDetail }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const vis = VISIBILITY_CONFIG[volume.visibility_state];
  const VisIcon = vis.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border ${vis.borderColor} overflow-hidden transition-all`}
      style={{ background: vis.bgGradient }}
    >
      {/* Accent edge */}
      <div className="h-[2px]" style={{ background: vis.accentColor }} />

      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger className="w-full text-left px-4 py-3 group">
          <div className="flex items-start gap-3">
            {/* Book icon with state-based styling */}
            <div
              className="mt-0.5 p-1.5 rounded-md shrink-0"
              style={{ background: `${vis.accentColor}22` }}
            >
              <BookOpen className="w-4 h-4" style={{ color: vis.accentColor }} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-serif text-sm text-foreground truncate">
                {volume.document_title}
              </p>
              <p className="text-[10px] text-muted-foreground font-serif truncate">
                {volume.collaborator_name}
                {volume.collaborator_project && ` · ${volume.collaborator_project}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Badge variant="outline" className="text-[9px] font-serif gap-1 py-0">
                <VisIcon className="w-2.5 h-2.5" />
                {volume.visibility_state}
              </Badge>
              {expanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Themes */}
            {volume.themes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {volume.themes.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[9px] font-serif">{t}</Badge>
                ))}
              </div>
            )}

            {/* Status + Intent */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-serif">
              <span>{STATUS_LABELS[volume.experiment_status] || volume.experiment_status}</span>
              <span>·</span>
              <span className="capitalize">{volume.integration_intent}</span>
            </div>

            {/* Essence preview */}
            {volume.essence_summary && (
              <p className="text-xs text-muted-foreground font-serif line-clamp-3 italic">
                "{volume.essence_summary}"
              </p>
            )}

            {/* Actions */}
            {isOwner && (
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="font-serif text-[10px] h-7 gap-1"
                  onClick={() => onOpenDetail?.(volume)}
                >
                  <Eye className="w-3 h-3" /> View
                </Button>

                {volume.visibility_state === "root" && onVisibilityChange && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-serif text-[10px] h-7 gap-1 border-emerald-700/30 text-emerald-400"
                    onClick={() => onVisibilityChange(volume.id, "ring")}
                  >
                    <Users className="w-3 h-3" /> Share to Ring
                  </Button>
                )}

                {volume.visibility_state === "ring" && onVisibilityChange && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-serif text-[10px] h-7 gap-1"
                    style={{ borderColor: "hsl(38 70% 50% / 0.3)", color: "hsl(38 70% 55%)" }}
                    onClick={() => onVisibilityChange(volume.id, "ripple")}
                  >
                    <Globe className="w-3 h-3" /> Extend to Ripple
                  </Button>
                )}

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-serif text-[10px] h-7 gap-1 text-destructive/60 hover:text-destructive ml-auto"
                    onClick={() => onDelete(volume.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default CollaboratorVolumeCard;
