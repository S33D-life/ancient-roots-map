import { Eye, EyeOff, Users } from "lucide-react";
import { Label } from "@/components/ui/label";

export type OfferingVisibility = "private" | "tribe" | "public";

interface OfferingVisibilityPickerProps {
  value: OfferingVisibility;
  onChange: (v: OfferingVisibility) => void;
  disabled?: boolean;
}

const options: { value: OfferingVisibility; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: "private", label: "Just me", desc: "Only you can see this", icon: <EyeOff className="h-3.5 w-3.5" /> },
  { value: "tribe", label: "Tribe", desc: "Visitors of this tree", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "public", label: "All", desc: "Everyone can see this", icon: <Eye className="h-3.5 w-3.5" /> },
];

const OfferingVisibilityPicker = ({ value, onChange, disabled }: OfferingVisibilityPickerProps) => {
  return (
    <div className="space-y-2">
      <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1">
        <Eye className="h-3 w-3" /> Who can see this?
      </Label>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 transition-all text-center ${
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
    </div>
  );
};

export default OfferingVisibilityPicker;
