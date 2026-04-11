import { Eye, TreeDeciduous, Users, Heart } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  HEARTWOOD_LINE,
  STAFF_HEARTWOOD_MSG,
  NON_STAFF_HEARTWOOD_MSG,
} from "@/lib/heartwood-labels";

export type OfferingVisibility = "private" | "circle" | "tribe" | "public";

interface OfferingVisibilityPickerProps {
  value: OfferingVisibility;
  onChange: (v: OfferingVisibility) => void;
  disabled?: boolean;
  /** Whether the current user holds an Origin Staff */
  hasStaff?: boolean;
}

const options: { value: OfferingVisibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "public", label: "Public Offering", desc: "Shared with the forest", icon: <Eye className="h-3.5 w-3.5" /> },
  { value: "tribe", label: "Tree Circle", desc: "Shared with this tree's circle", icon: <TreeDeciduous className="h-3.5 w-3.5" /> },
  { value: "circle", label: "Grove", desc: "Shared with your grove", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "private", label: "Heartwood Memory", desc: "Held in Heartwood", icon: <Heart className="h-3.5 w-3.5" /> },
];

const OfferingVisibilityPicker = ({ value, onChange, disabled, hasStaff }: OfferingVisibilityPickerProps) => {
  const isHeartwood = value === "private";

  return (
    <div className="space-y-2">
      <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1">
        <Eye className="h-3 w-3" /> How is this offering held?
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => {
          const active = value === opt.value;
          const heartwoodActive = opt.value === "private" && active;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all text-center ${
                heartwoodActive
                  ? "border-accent/40 bg-accent/8 text-accent-foreground"
                  : active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/40 text-muted-foreground hover:border-primary/30"
              } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
              style={heartwoodActive ? {
                background: "linear-gradient(135deg, hsl(var(--accent) / 0.06), hsl(var(--muted) / 0.1))",
                borderColor: "hsl(var(--accent) / 0.25)",
              } : undefined}
            >
              {opt.icon}
              <span className="text-[11px] font-serif font-medium">{opt.label}</span>
              <span className="text-[9px] font-serif opacity-70 leading-tight">{opt.desc}</span>
            </button>
          );
        })}
      </div>

      {isHeartwood && (
        <div
          className="rounded-lg px-3 py-2.5 space-y-1"
          style={{
            background: "linear-gradient(135deg, hsl(var(--accent) / 0.04), hsl(var(--muted) / 0.06))",
            border: "1px solid hsl(var(--accent) / 0.12)",
          }}
        >
          <p className="text-[10px] font-serif text-muted-foreground/70 text-center leading-relaxed">
            {HEARTWOOD_LINE}
          </p>
          <p className="text-[9px] font-serif text-muted-foreground/50 text-center italic">
            {hasStaff ? STAFF_HEARTWOOD_MSG : NON_STAFF_HEARTWOOD_MSG}
          </p>
        </div>
      )}
    </div>
  );
};

export default OfferingVisibilityPicker;
