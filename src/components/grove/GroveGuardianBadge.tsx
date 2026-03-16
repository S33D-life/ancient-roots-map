/**
 * GroveGuardianBadge — small badge showing guardian role.
 * Use on user profiles, contribution records, etc.
 */
import { Badge } from "@/components/ui/badge";
import {
  GUARDIAN_ROLE_LABELS,
  GUARDIAN_ROLE_ICONS,
  type GuardianRole,
} from "@/hooks/use-grove-guardians";

interface Props {
  role: GuardianRole;
  groveName?: string;
  compact?: boolean;
}

export default function GroveGuardianBadge({ role, groveName, compact }: Props) {
  return (
    <Badge
      variant="outline"
      className="text-[9px] px-1.5 py-0.5 text-primary/80 border-primary/20 bg-primary/5 gap-1 font-normal"
    >
      <span>{GUARDIAN_ROLE_ICONS[role]}</span>
      {compact
        ? GUARDIAN_ROLE_LABELS[role]
        : groveName
          ? `${GUARDIAN_ROLE_LABELS[role]} · ${groveName}`
          : GUARDIAN_ROLE_LABELS[role]}
    </Badge>
  );
}
