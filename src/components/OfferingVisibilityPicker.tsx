import { Eye, TreeDeciduous, Users, Heart } from "lucide-react";
import { Label } from "@/components/ui/label";

export type OfferingVisibility = "private" | "circle" | "tribe" | "public";

interface OfferingVisibilityPickerProps {
  value: OfferingVisibility;
  onChange: (v: OfferingVisibility) => void;
  disabled?: boolean;
}

const options: { value: OfferingVisibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "public", label: "Public Offering", desc: "Shared with the forest", icon: <Eye className="h-3.5 w-3.5" /> },
  { value: "tribe", label: "Tree Circle", desc: "Visitors of this tree", icon: <TreeDeciduous className="h-3.5 w-3.5" /> },
  { value: "circle", label: "Grove", desc: "Your grove companions", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "private", label: "Heartwood Memory", desc: "Held in trust for you", icon: <Heart className="h-3.5 w-3.5" /> },
];

const OfferingVisibilityPicker = ({ value, onChange, disabled }: OfferingVisibilityPickerProps) => {
  return (
    <div className="space-y-2">
      <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1">
        <Eye className="h-3 w-3" /> How is this offering held?
      </Label>
      <div className="grid grid-cols-2 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all text-center ${
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/30"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            {opt.icon}
            <span className="text-[11px] font-serif font-medium">{opt.label}</span>
            <span className="text-[9px] font-serif opacity-70 leading-tight">{opt.desc}</span>
          </button>
        ))}
      </div>
      {value === "private" && (
        <p className="text-[9px] font-serif text-muted-foreground/60 text-center leading-relaxed px-2">
          Heartwood memories are stewarded through time — visible only to you and those you entrust.
        </p>
      )}
    </div>
  );
};

export default OfferingVisibilityPicker;
