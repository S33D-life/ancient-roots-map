import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings2, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { CompanionSettings } from "@/lib/companion-types";
import { DEFAULT_SETTINGS } from "@/lib/companion-types";

/**
 * Collapsible sensitivity tuning panel for companion controller.
 */

interface SettingsPanelProps {
  settings: CompanionSettings;
  onChange: (settings: CompanionSettings) => void;
}

export default function CompanionSettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-serif mx-auto hover:text-muted-foreground transition-colors min-h-[28px]"
      >
        <Settings2 className="w-3 h-3" />
        {open ? "Hide settings" : "Sensitivity"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div
              className="mt-2 rounded-xl p-3 space-y-3"
              style={{
                background: "hsl(var(--secondary) / 0.2)",
                border: "1px solid hsl(var(--border) / 0.2)",
              }}
            >
              {/* Pointer sensitivity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-serif">Pointer speed</span>
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{settings.pointerSensitivity.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={[settings.pointerSensitivity]}
                  onValueChange={([v]) => onChange({ ...settings, pointerSensitivity: v })}
                  className="w-full"
                />
              </div>

              {/* Scroll sensitivity */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground font-serif">Scroll speed</span>
                  <span className="text-[9px] text-muted-foreground/50 font-mono">{settings.scrollSensitivity.toFixed(1)}</span>
                </div>
                <Slider
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={[settings.scrollSensitivity]}
                  onValueChange={([v]) => onChange({ ...settings, scrollSensitivity: v })}
                  className="w-full"
                />
              </div>

              {/* Natural scroll */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-serif">Natural scroll</span>
                <Switch
                  checked={settings.naturalScroll}
                  onCheckedChange={(v) => onChange({ ...settings, naturalScroll: v })}
                />
              </div>

              {/* Reset */}
              <button
                onClick={() => onChange({ ...DEFAULT_SETTINGS })}
                className="flex items-center gap-1 text-[9px] text-muted-foreground/50 hover:text-muted-foreground transition-colors mx-auto min-h-[24px]"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Reset defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
