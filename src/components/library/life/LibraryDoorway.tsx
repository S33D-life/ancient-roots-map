/**
 * The single Ancient Friend → PLANeTary Library doorway.
 *
 * Shown only when the tree's stored species_key resolves to exactly one
 * canonical species_index row (and its slug, if any, resolves back to it).
 * Unkeyed, unresolved or ambiguous trees get no doorway. The tree record and
 * its offerings are not read or changed here.
 *
 * Pilot scope: the doorway also requires the species to have a chapter record in
 * the Library content source, so only Birch (betula-pendula) is offered for now.
 */
import { Link } from "react-router-dom";
import { useLibraryIdentity } from "@/hooks/use-library-identity";
import { withOrigin } from "@/lib/library/origin";
import { LIBRARY_LIFE_ROUTES } from "@/lib/library/routes";
import { useLibraryContent } from "@/components/library/life/LibraryContentContext";

export default function LibraryDoorway({ treeId, speciesKey, className }: {
  treeId: string; speciesKey: string | null | undefined; className?: string;
}) {
  const content = useLibraryContent();
  const inPilot = typeof speciesKey === "string" && content.listChapters(speciesKey).length > 0;
  const identity = useLibraryIdentity(inPilot ? speciesKey : null);
  if (!inPilot || identity.status !== "ready") return null;
  const to = withOrigin(LIBRARY_LIFE_ROUTES.HOME(identity.row.species_key), { type: "ancient-friend", id: treeId });
  return (
    <div className={className} data-testid="library-doorway">
      <Link
        to={to}
        className="inline-flex items-center min-h-[44px] px-1 text-sm font-serif tracking-wide text-primary/80 underline-offset-4 hover:underline"
      >
        Open in Library of Life →
      </Link>
    </div>
  );
}
