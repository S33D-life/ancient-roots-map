import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, Leaf, TreeDeciduous, ScrollText } from "lucide-react";

export type AgeConfidence = "guess" | "informed" | "verified";

export interface TreeAgeValue {
  mode: "estimate" | "known";
  ageMin: number | null;
  ageMax: number | null;
  ageConfidence: AgeConfidence | null;
  ageExact: number | null;
  ageSource: string | null;
}

export const EMPTY_AGE: TreeAgeValue = {
  mode: "estimate",
  ageMin: null,
  ageMax: null,
  ageConfidence: null,
  ageExact: null,
  ageSource: null,
};

const PRESETS: Array<{ label: string; min: number; max: number }> = [
  { label: "0–50", min: 0, max: 50 },
  { label: "50–100", min: 50, max: 100 },
  { label: "100–300", min: 100, max: 300 },
  { label: "300–800", min: 300, max: 800 },
  { label: "800–1500", min: 800, max: 1500 },
  { label: "1500+", min: 1500, max: 3000 },
];

const CONFIDENCE_OPTIONS: Array<{
  key: AgeConfidence;
  label: string;
  Icon: typeof Sprout;
  hint: string;
}> = [
  { key: "guess", label: "Guess", Icon: Sprout, hint: "A feeling" },
  { key: "informed", label: "Informed", Icon: Leaf, hint: "Compared to others" },
  { key: "verified", label: "Verified", Icon: TreeDeciduous, hint: "Records or measurement" },
];

interface Props {
  value: TreeAgeValue;
  onChange: (next: TreeAgeValue) => void;
}

const clampInt = (raw: string): number | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Math.floor(Number(trimmed));
  if (!Number.isFinite(n)) return null;
  if (n < 0) return 0;
  if (n > 10000) return 10000;
  return n;
};

const TreeAgeInput = ({ value, onChange }: Props) => {
  // Preserve estimate values while user toggles into "known" mode
  const stashedEstimate = useRef<TreeAgeValue>(value.mode === "estimate" ? value : EMPTY_AGE);
  const [minStr, setMinStr] = useState<string>(value.ageMin?.toString() ?? "");
  const [maxStr, setMaxStr] = useState<string>(value.ageMax?.toString() ?? "");
  const [exactStr, setExactStr] = useState<string>(value.ageExact?.toString() ?? "");

  useEffect(() => {
    if (value.mode === "estimate") {
      stashedEstimate.current = value;
    }
  }, [value]);

  const setMode = (mode: "estimate" | "known") => {
    if (mode === "known") {
      onChange({
        ...EMPTY_AGE,
        mode: "known",
        ageExact: value.ageExact,
        ageSource: value.ageSource,
        ageConfidence: value.ageExact != null ? "verified" : null,
      });
    } else {
      // restore stashed estimate (or empty)
      const restored = stashedEstimate.current;
      setMinStr(restored.ageMin?.toString() ?? "");
      setMaxStr(restored.ageMax?.toString() ?? "");
      onChange({ ...restored, mode: "estimate" });
    }
  };

  const applyPreset = (min: number, max: number) => {
    setMinStr(min.toString());
    setMaxStr(max.toString());
    onChange({
      ...value,
      mode: "estimate",
      ageMin: min,
      ageMax: max,
      // bump to at least "informed" if user picked a preset and was a guess
      ageConfidence: value.ageConfidence ?? "informed",
    });
  };

  const handleMinBlur = () => {
    const n = clampInt(minStr);
    setMinStr(n?.toString() ?? "");
    let nextMax = value.ageMax;
    if (n != null && nextMax != null && n > nextMax) {
      nextMax = n;
      setMaxStr(n.toString());
    }
    onChange({ ...value, ageMin: n, ageMax: nextMax });
  };

  const handleMaxBlur = () => {
    const n = clampInt(maxStr);
    setMaxStr(n?.toString() ?? "");
    let nextMin = value.ageMin;
    if (n != null && nextMin != null && n < nextMin) {
      nextMin = n;
      setMinStr(n.toString());
    }
    onChange({ ...value, ageMin: nextMin, ageMax: n });
  };

  const handleExactBlur = () => {
    const n = clampInt(exactStr);
    setExactStr(n?.toString() ?? "");
    onChange({
      ...value,
      mode: "known",
      ageExact: n,
      ageConfidence: n != null ? "verified" : null,
    });
  };

  const isKnown = value.mode === "known";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
          Tree Age
        </Label>
        <label
          htmlFor="age-known-toggle"
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <span className="text-[10px] font-serif text-muted-foreground/80 flex items-center gap-1">
            <ScrollText className="w-3 h-3" />
            I know the age
          </span>
          <Switch
            id="age-known-toggle"
            checked={isKnown}
            onCheckedChange={(c) => setMode(c ? "known" : "estimate")}
          />
        </label>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {!isKnown ? (
          <motion.div
            key="estimate"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {/* Range inputs */}
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="age-min" className="text-[10px] text-muted-foreground/70 font-serif">
                  From (years)
                </Label>
                <Input
                  id="age-min"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  value={minStr}
                  onChange={(e) => setMinStr(e.target.value)}
                  onBlur={handleMinBlur}
                  placeholder="50"
                  className="font-serif h-9 text-sm"
                />
              </div>
              <span className="pb-2.5 text-muted-foreground/60 font-serif">–</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="age-max" className="text-[10px] text-muted-foreground/70 font-serif">
                  To (years)
                </Label>
                <Input
                  id="age-max"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={10000}
                  value={maxStr}
                  onChange={(e) => setMaxStr(e.target.value)}
                  onBlur={handleMaxBlur}
                  placeholder="100"
                  className="font-serif h-9 text-sm"
                />
              </div>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => {
                const active = value.ageMin === p.min && value.ageMax === p.max;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => applyPreset(p.min, p.max)}
                    className={`text-[11px] font-serif px-2.5 py-1 rounded-full border transition-colors ${
                      active
                        ? "bg-primary/15 border-primary/50 text-foreground"
                        : "bg-background border-border/60 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Confidence */}
            <div className="space-y-1.5">
              <Label className="text-[10px] text-muted-foreground/70 font-serif">
                Confidence
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {CONFIDENCE_OPTIONS.map(({ key, label, Icon, hint }) => {
                  const active = value.ageConfidence === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onChange({ ...value, ageConfidence: active ? null : key })
                      }
                      className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg border transition-all ${
                        active
                          ? "bg-primary/15 border-primary/50 text-foreground"
                          : "bg-background border-border/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-serif leading-tight">{label}</span>
                      <span className="text-[9px] text-muted-foreground/60 leading-tight">{hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="known"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-2.5"
          >
            <div className="space-y-1">
              <Label htmlFor="age-exact" className="text-[10px] text-muted-foreground/70 font-serif">
                Exact age (years)
              </Label>
              <Input
                id="age-exact"
                type="number"
                inputMode="numeric"
                min={0}
                max={10000}
                value={exactStr}
                onChange={(e) => setExactStr(e.target.value)}
                onBlur={handleExactBlur}
                placeholder="230"
                className="font-serif h-9 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="age-source" className="text-[10px] text-muted-foreground/70 font-serif">
                Source <span className="text-muted-foreground/50">(optional)</span>
              </Label>
              <Input
                id="age-source"
                type="text"
                value={value.ageSource ?? ""}
                onChange={(e) =>
                  onChange({ ...value, ageSource: e.target.value.slice(0, 200) || null })
                }
                placeholder="e.g. plaque, local records, guide"
                maxLength={200}
                className="font-serif h-9 text-sm"
              />
            </div>
            {value.ageExact != null && (
              <p className="text-[10px] text-muted-foreground/70 font-serif flex items-center gap-1">
                <TreeDeciduous className="w-3 h-3" />
                Recorded as <strong className="text-foreground">verified</strong>.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreeAgeInput;
