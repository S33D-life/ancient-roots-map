/**
 * FamilyModeToggle — gentle switch shown in the Arborium hero.
 *
 * Designed for children and first-time visitors: simpler words, roomier cards.
 */
import { Sparkles } from "lucide-react";

interface Props {
  active: boolean;
  onToggle: () => void;
}

export default function FamilyModeToggle({ active, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      aria-label="Toggle Family Mode for simpler language and roomier cards"
      className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-900/20 bg-[hsl(48_55%_96%)]/80 hover:bg-[hsl(48_55%_96%)] transition-colors text-[11px] font-serif text-amber-900/75"
    >
      <Sparkles
        className={`w-3.5 h-3.5 transition-colors ${
          active ? "text-amber-600" : "text-amber-900/45"
        }`}
      />
      <span className="uppercase tracking-[0.16em]">Family Mode</span>
      <span
        className={`relative inline-flex h-4 w-7 rounded-full border transition-colors ${
          active
            ? "bg-emerald-700/70 border-emerald-800/40"
            : "bg-amber-900/10 border-amber-900/20"
        }`}
      >
        <span
          className={`absolute top-[1px] h-[14px] w-[14px] rounded-full bg-[hsl(48_55%_98%)] shadow-sm transition-all ${
            active ? "left-[12px]" : "left-[1px]"
          }`}
        />
      </span>
    </button>
  );
}
