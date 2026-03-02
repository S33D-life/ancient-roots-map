/**
 * VisibilitySelector — Reusable visibility tier picker.
 * Used across bookshelf entries, press works, and offerings.
 * "Who should see this?"
 */
import { Eye, Users, Globe, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type VisibilityTier = "private" | "circle" | "tribe" | "public";

const TIERS: { value: VisibilityTier; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "private",  label: "Private",  icon: <Lock className="h-3.5 w-3.5" />,  desc: "Only you" },
  { value: "circle",   label: "Circle",   icon: <Eye className="h-3.5 w-3.5" />,   desc: "Close companions" },
  { value: "tribe",    label: "Tribe",    icon: <Users className="h-3.5 w-3.5" />,  desc: "Your grove" },
  { value: "public",   label: "Public",   icon: <Globe className="h-3.5 w-3.5" />,  desc: "Everyone" },
];

interface VisibilitySelectorProps {
  value: VisibilityTier;
  onChange: (tier: VisibilityTier) => void;
  className?: string;
  /** Compact mode — icon only trigger */
  compact?: boolean;
}

export default function VisibilitySelector({ value, onChange, className = "", compact = false }: VisibilitySelectorProps) {
  const current = TIERS.find(t => t.value === value) || TIERS[0];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as VisibilityTier)}>
      <SelectTrigger
        className={`border-border/20 bg-transparent font-serif text-xs ${compact ? "w-10 h-8 px-2" : "w-36 h-8"} ${className}`}
        title={`Visibility: ${current.label}`}
      >
        {compact ? current.icon : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {TIERS.map((tier) => (
          <SelectItem key={tier.value} value={tier.value} className="font-serif text-xs">
            <span className="flex items-center gap-2">
              {tier.icon}
              <span>{tier.label}</span>
              <span className="text-muted-foreground/50 ml-1">— {tier.desc}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
