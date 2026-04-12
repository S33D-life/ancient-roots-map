/**
 * SpeciesOfferingFilter — shared species filter dropdown for Library rooms.
 * Extracts unique species from items, resolves display names, and provides
 * instant client-side filtering.
 */
import { useMemo } from "react";
import { Leaf } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TREE_SPECIES from "@/data/treeSpecies";

/* ── Species resolution (lightweight, no DB calls) ─────── */

const speciesLookup = new Map(
  TREE_SPECIES.map(s => [s.common.toLowerCase(), s])
);
const scientificLookup = new Map(
  TREE_SPECIES.map(s => [s.scientific.toLowerCase(), s])
);

function resolveDisplayName(raw: string): { common: string; scientific: string } {
  const lower = raw.toLowerCase().trim();
  const byCommon = speciesLookup.get(lower);
  if (byCommon) return { common: byCommon.common, scientific: byCommon.scientific };
  const byLatin = scientificLookup.get(lower);
  if (byLatin) return { common: byLatin.common, scientific: byLatin.scientific };
  for (const sp of TREE_SPECIES) {
    if (sp.aliases?.some(a => a.toLowerCase() === lower)) {
      return { common: sp.common, scientific: sp.scientific };
    }
  }
  return { common: raw || "Unknown", scientific: "" };
}

/* ── Types ─────────────────────────────────────────────── */

export interface SpeciesOption {
  key: string;       // raw species string (used as filter value)
  common: string;    // resolved display name
  scientific: string;
  count: number;
}

interface SpeciesOfferingFilterProps {
  /** Raw species strings from the current dataset */
  speciesStrings: string[];
  /** Current filter value — "all" or a raw species key */
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/* ── Component ─────────────────────────────────────────── */

export default function SpeciesOfferingFilter({
  speciesStrings,
  value,
  onChange,
  className = "",
}: SpeciesOfferingFilterProps) {
  const options = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of speciesStrings) {
      const key = s || "Unknown";
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const resolved: SpeciesOption[] = Array.from(counts.entries()).map(
      ([key, count]) => {
        const { common, scientific } = resolveDisplayName(key);
        return { key, common, scientific, count };
      }
    );

    // Sort by frequency (most first)
    resolved.sort((a, b) => b.count - a.count);
    return resolved;
  }, [speciesStrings]);

  if (options.length <= 1) return null; // no point filtering one species

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-9 text-[11px] font-serif border-border/20 bg-card/30 ${className}`}
      >
        <Leaf className="h-3 w-3 mr-1 text-muted-foreground/50 shrink-0" />
        <SelectValue placeholder="All species" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs font-serif">
          All species
        </SelectItem>
        {options.map(opt => (
          <SelectItem key={opt.key} value={opt.key} className="text-xs font-serif">
            <span>{opt.common}</span>
            <span className="text-muted-foreground/40 ml-1.5">({opt.count})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Helper: filter items by species ───────────────────── */

export function filterBySpecies<T extends { species: string }>(
  items: T[],
  speciesFilter: string
): T[] {
  if (speciesFilter === "all") return items;
  return items.filter(item => (item.species || "Unknown") === speciesFilter);
}
