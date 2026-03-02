/**
 * HiveFruitPreview — Mini preview card shown when clicking a fruit indicator on the map.
 * Shows hive name, species, seasonal status, tree count, and "Enter the Hive" CTA.
 */
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, TreePine, X } from "lucide-react";
import type { HiveInfo } from "@/utils/hiveUtils";

interface HiveFruitPreviewProps {
  hive: HiveInfo;
  stage: string;
  stageLabel: string;
  stageEmoji: string;
  treeCount: number;
  regionLabel?: string;
  onClose: () => void;
  visible: boolean;
}

export default function HiveFruitPreview({
  hive,
  stage,
  stageLabel,
  stageEmoji,
  treeCount,
  regionLabel,
  onClose,
  visible,
}: HiveFruitPreviewProps) {
  const navigate = useNavigate();

  const handleEnterHive = () => {
    navigate(`/hive/${hive.slug}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-72 pointer-events-auto"
        >
          <div
            className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-lg overflow-hidden"
            style={{
              boxShadow: `0 0 24px hsla(${hive.accentHsl} / 0.2), 0 4px 16px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Accent bar */}
            <div
              className="h-1"
              style={{ background: `linear-gradient(90deg, transparent, hsl(${hive.accentHsl}), transparent)` }}
            />

            <div className="p-4 space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{hive.icon}</span>
                  <div>
                    <h3 className="font-serif text-sm text-foreground leading-tight">
                      {hive.displayName}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] py-0 px-1.5 font-serif"
                        style={{
                          borderColor: `hsl(${hive.accentHsl} / 0.5)`,
                          color: `hsl(${hive.accentHsl})`,
                        }}
                      >
                        {stageEmoji} {stageLabel}
                      </Badge>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-muted/50 transition-colors text-muted-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs font-serif text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TreePine className="w-3 h-3" /> {treeCount} trees
                </span>
                {regionLabel && (
                  <span className="truncate">🌍 {regionLabel}</span>
                )}
              </div>

              {/* CTA */}
              <Button
                onClick={handleEnterHive}
                size="sm"
                className="w-full font-serif text-xs gap-1.5"
                style={{
                  background: `hsl(${hive.accentHsl})`,
                  color: "hsl(var(--background))",
                }}
              >
                Enter the Hive <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
