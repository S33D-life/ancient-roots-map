/**
 * OrchardModePanel — optional cultivated-tree fields.
 *
 * Adds variety/cultivar, orchard mode toggle, and lineage tracking
 * (propagation type, parent source, planted year). All optional;
 * default tree-mapping flow stays unchanged when this panel is collapsed.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sprout, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export type PropagationType = "seed" | "graft" | "cutting" | "unknown";

export interface OrchardValue {
  /** Variety / cultivar name (e.g. "Bramley") */
  varietyName: string;
  /** Cultivated / orchard tree */
  isOrchard: boolean;
  /** How it was propagated (only meaningful when isOrchard=true) */
  propagationType: PropagationType | "";
  /** Free-text source / parent description */
  parentDescription: string;
  /** Year planted (4-digit) */
  plantedYear: string;
}

export const EMPTY_ORCHARD: OrchardValue = {
  varietyName: "",
  isOrchard: false,
  propagationType: "",
  parentDescription: "",
  plantedYear: "",
};

interface Props {
  value: OrchardValue;
  onChange: (next: OrchardValue) => void;
}

const PROPAGATION_OPTIONS: { value: PropagationType; label: string; emoji: string }[] = [
  { value: "seed", label: "Grown from seed", emoji: "🌱" },
  { value: "graft", label: "Grafted", emoji: "🪴" },
  { value: "cutting", label: "Cutting", emoji: "✂️" },
  { value: "unknown", label: "Unknown", emoji: "❔" },
];

const OrchardModePanel = ({ value, onChange }: Props) => {
  // Auto-expand if the user has any data filled in (e.g. coming back to edit)
  const [expanded, setExpanded] = useState(
    () => !!value.varietyName || value.isOrchard
  );

  useEffect(() => {
    if (value.varietyName || value.isOrchard) setExpanded(true);
  }, [value.varietyName, value.isOrchard]);

  const set = <K extends keyof OrchardValue>(key: K, v: OrchardValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <section className="space-y-2">
      {/* Collapsed entry pill */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors"
        style={{
          background: "hsla(120, 25%, 14%, 0.25)",
          borderColor: "hsla(120, 35%, 30%, 0.25)",
        }}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sprout className="h-3.5 w-3.5 shrink-0" style={{ color: "hsl(120, 45%, 55%)" }} />
          <span className="text-[11px] font-serif" style={{ color: "hsl(120, 45%, 60%)" }}>
            Cultivar or variety details?
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground/60 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-lg p-3 space-y-3 mt-1"
              style={{
                background: "hsla(120, 20%, 12%, 0.25)",
                border: "1px solid hsla(120, 30%, 28%, 0.2)",
              }}
            >
              {/* Variety / cultivar */}
              <div className="space-y-1.5">
                <Label
                  htmlFor="variety-name"
                  className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
                >
                  Variety / Cultivar <span className="text-muted-foreground/40 normal-case tracking-normal">(optional)</span>
                </Label>
                <Input
                  id="variety-name"
                  value={value.varietyName}
                  onChange={(e) => set("varietyName", e.target.value.slice(0, 120))}
                  placeholder="e.g., Bramley, Cox's Orange Pippin, Conference"
                  maxLength={120}
                  className="font-serif h-9 text-sm"
                />
                <p className="text-[10px] text-muted-foreground/50 font-serif">
                  Helps preserve heritage varieties.
                </p>
              </div>

              {/* Orchard toggle */}
              <div
                className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                style={{
                  background: "hsla(120, 25%, 18%, 0.3)",
                  border: "1px solid hsla(120, 35%, 30%, 0.2)",
                }}
              >
                <div className="min-w-0">
                  <Label
                    htmlFor="orchard-toggle"
                    className="text-xs font-serif cursor-pointer"
                    style={{ color: "hsl(120, 45%, 65%)" }}
                  >
                    Cultivated tree (orchard / nursery)
                  </Label>
                  <p className="text-[10px] text-muted-foreground/50 font-serif mt-0.5">
                    Unlocks lineage tracking — propagation, parent, year
                  </p>
                </div>
                <Switch
                  id="orchard-toggle"
                  checked={value.isOrchard}
                  onCheckedChange={(c) => set("isOrchard", c)}
                />
              </div>

              {/* Lineage (only when orchard mode is on) */}
              <AnimatePresence initial={false}>
                {value.isOrchard && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-1">
                      {/* Propagation type */}
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif">
                          How was it grown?
                        </Label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {PROPAGATION_OPTIONS.map((opt) => {
                            const active = value.propagationType === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  set("propagationType", active ? "" : opt.value)
                                }
                                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-serif transition-all border ${
                                  active
                                    ? "bg-primary/15 text-primary border-primary/30"
                                    : "bg-muted/20 text-muted-foreground border-border/30 hover:border-primary/20"
                                }`}
                              >
                                <span>{opt.emoji}</span>
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Parent / source */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="parent-description"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
                        >
                          Parent tree or source <span className="text-muted-foreground/40 normal-case tracking-normal">(optional)</span>
                        </Label>
                        <Input
                          id="parent-description"
                          value={value.parentDescription}
                          onChange={(e) =>
                            set("parentDescription", e.target.value.slice(0, 280))
                          }
                          placeholder="e.g., Cutting from grandfather's orchard"
                          maxLength={280}
                          className="font-serif h-9 text-sm"
                        />
                      </div>

                      {/* Planted year */}
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="planted-year"
                          className="text-[10px] uppercase tracking-widest text-muted-foreground font-serif"
                        >
                          Year planted <span className="text-muted-foreground/40 normal-case tracking-normal">(optional)</span>
                        </Label>
                        <Input
                          id="planted-year"
                          type="number"
                          inputMode="numeric"
                          min={1500}
                          max={new Date().getFullYear() + 1}
                          value={value.plantedYear}
                          onChange={(e) => set("plantedYear", e.target.value.slice(0, 4))}
                          placeholder="e.g., 2005"
                          className="font-serif h-9 text-sm w-32"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default OrchardModePanel;

/**
 * Build the DB payload subset for the trees table from an OrchardValue.
 * Returns null/undefined-safe values so it can be spread into an insert/update.
 */
export function buildOrchardPayload(o: OrchardValue) {
  const variety = o.varietyName.trim();
  const parent = o.parentDescription.trim();
  const yearNum = o.plantedYear ? Number(o.plantedYear) : NaN;
  const validYear =
    Number.isFinite(yearNum) &&
    yearNum >= 1500 &&
    yearNum <= new Date().getFullYear() + 1;
  return {
    variety_name: variety || null,
    is_orchard: o.isOrchard,
    propagation_type: o.isOrchard && o.propagationType ? o.propagationType : null,
    parent_description: o.isOrchard && parent ? parent : null,
    planted_year: o.isOrchard && validYear ? yearNum : null,
  };
}
