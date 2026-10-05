import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import raw from "@/data/relationships/council-appearances/c235_holmoak.json";
import { appearancesForSubject, resolveCouncilAppearance, type CouncilAppearance, type AppearanceProjection } from "@/lib/relationships/councilAppearance";
import { councilAppearanceReader } from "@/lib/relationships/councilAppearanceReader";
import { ROUTES } from "@/lib/routes";

const appearance = raw as CouncilAppearance;

/** Imported only through DEV-gated lazy imports. No public asset/JSON endpoint. */
export default function CouncilAppearancePilot({ treeId }: { treeId?: string }) {
  const [projection, setProjection] = useState<AppearanceProjection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const matches = !treeId || appearancesForSubject([appearance], { provider: "s33d", record_type: "trees", id: treeId }).length > 0;
  useEffect(() => {
    if (!import.meta.env.DEV || !matches) return;
    let active = true;
    resolveCouncilAppearance(appearance, councilAppearanceReader, "review").then(p => {
      if (active) { setProjection(p); setLoaded(true); }
    });
    return () => { active = false; };
  }, [matches, treeId]);
  if (!import.meta.env.DEV || !matches) return null;
  return <section className="my-6 rounded-xl border border-primary/30 bg-card/80 p-5 space-y-3" aria-label="Council appearance pilot">
    <p className="text-xs text-muted-foreground">Development review · no public publication approval</p>
    <h2 className="font-serif text-xl">{treeId ? "Appeared in Council 235" : "Council 235 → Holm Oak appearance"}</h2>
    <p className="text-sm">council-of-life/circle-235 / c235_holmoak</p>
    {!loaded ? <p>Reading existing records…</p> : <>
      <p className="text-sm">Resolution: {projection?.status ?? "Unavailable"}</p>
      <div className="flex flex-wrap gap-4 text-sm underline underline-offset-4">
        {projection?.tree && <Link to={ROUTES.TREE(projection.tree.id)}>{projection.tree.name} · existing Ancient Friend</Link>}
        {projection?.species?.slug && <Link to={ROUTES.SPECIES(encodeURIComponent(projection.species.slug))}>{projection.species.scientific_name || projection.species.species_key}</Link>}
        {projection?.hive && <Link to={ROUTES.HIVE(encodeURIComponent(projection.hive.slug))}>{projection.hive.display_name}</Link>}
        {treeId && <Link to={`${ROUTES.COUNCIL}#council-appearance-pilot`}>Council 235 appearance · review</Link>}
      </div>
      <p>{projection?.encounterState?.label ?? "Encounter status unresolved"}</p>
      <p className="text-sm text-muted-foreground">Individual identification remains a proposal. No October photographs or observations have been added.</p>
      <p className="text-sm">Chapter V4 · Candidate · Pre-Fire · Review only. Harvest: not recorded.</p>
      <p className="text-sm">Represented by: existing Holm Oak illustration (review-only reference; not field evidence). Supported by: no new claims.</p>
      <p className="text-sm">Consent for public reuse of personal material: not verified. No artwork, personal words or photographs are displayed.</p>
    </>}
  </section>;
}
