/**
 * SpeciesNameLink — small clickable component used wherever a tree's
 * species is displayed. Shows the common name (or scientific) and links
 * to /species/:slug. Optionally shows 1-2 alternate names below.
 *
 * Resolution path:
 *   1. If we already have a species_key on the tree, look up slug by key.
 *   2. If no key but we have a species string, render plain text (no link).
 */
import { Link } from "react-router-dom";
import { Languages } from "lucide-react";
import { useSpeciesByKey, useSpeciesAlternateNames } from "@/hooks/use-treeasurus";

interface Props {
  /** species_key from the tree row (preferred). */
  speciesKey?: string | null;
  /** Display label fallback if we can't resolve to a slug. */
  fallbackLabel: string;
  /** Show 1-2 alternate names below (for the lore-rich tree page). */
  showAlternates?: boolean;
  className?: string;
}

export default function SpeciesNameLink({
  speciesKey,
  fallbackLabel,
  showAlternates = false,
  className = "",
}: Props) {
  const { data: species } = useSpeciesByKey(speciesKey);
  const { data: alternates = [] } = useSpeciesAlternateNames(
    showAlternates ? species?.id : undefined,
    4
  );

  const slug = species?.slug;
  const label = species?.canonical_common_name || species?.common_name || fallbackLabel;

  // Filter alternates: skip ones that match the canonical label
  const altShown = alternates
    .filter((n) => n.name.toLowerCase() !== label.toLowerCase())
    .slice(0, 2);

  if (!slug) {
    return <span className={className}>{label}</span>;
  }

  return (
    <span className={className}>
      <Link
        to={`/species/${slug}`}
        className="underline-offset-4 decoration-dotted hover:underline hover:text-primary transition-colors"
      >
        {label}
      </Link>
      {showAlternates && altShown.length > 0 && (
        <span className="inline-flex items-center gap-1.5 ml-2 text-[10px] text-muted-foreground/70 font-serif italic">
          <Languages className="w-2.5 h-2.5" />
          {altShown.map((n, i) => (
            <span key={n.id}>
              {n.name}
              {n.language_code && (
                <span className="text-muted-foreground/40 not-italic"> · {n.language_code}</span>
              )}
              {i < altShown.length - 1 && <span className="text-muted-foreground/40">,</span>}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
