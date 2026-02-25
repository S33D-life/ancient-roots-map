import { TreePine, Home } from "lucide-react";
import { Label } from "@/components/ui/label";

export type TreeRole = "stewardship" | "anchored" | "none";

interface TreeRolePickerProps {
  value: TreeRole;
  onChange: (v: TreeRole) => void;
  disabled?: boolean;
}

const options: { value: TreeRole; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    value: "stewardship",
    label: "Tree Record",
    desc: "Documentation, observation, seasonal change, wildlife, research",
    icon: <TreePine className="h-5 w-5" />,
  },
  {
    value: "anchored",
    label: "Beneath This Tree",
    desc: "Personal memory, family photo, song, reflection",
    icon: <Home className="h-5 w-5" />,
  },
];

const TreeRolePicker = ({ value, onChange, disabled }: TreeRolePickerProps) => {
  return (
    <div className="space-y-2">
      <Label className="font-serif text-xs tracking-wider text-muted-foreground uppercase flex items-center gap-1">
        🌳 How does this relate to the tree?
      </Label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 transition-all text-center ${
              value === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border/40 text-muted-foreground hover:border-primary/30"
            } ${disabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            {opt.icon}
            <span className="text-xs font-serif font-medium">{opt.label}</span>
            <span className="text-[9px] font-serif opacity-70 leading-tight">{opt.desc}</span>
          </button>
        ))}
      </div>
      {value === "stewardship" && (
        <p className="text-[10px] text-primary/70 font-serif italic text-center">
          This becomes part of the tree's shared record.
        </p>
      )}
    </div>
  );
};

export default TreeRolePicker;
