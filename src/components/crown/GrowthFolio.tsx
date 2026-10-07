/**
 * Growth Folio — a read-only Crown view of one growth.
 *
 * Crown (what is growing, maturity) → Taproot (wiring, source of truth)
 * → Agent Garden (tending relationship) → Dev Room (evidence) → Heartwood
 * → decision needed → back to the Crown.
 *
 * Rendered as a Living Parchment field folio: the sheet scopes the existing
 * `.light` Botanical Parchment tokens, so it reads the same in Dawn or Night
 * without changing the site theme. Nothing here writes.
 */
import { Link } from "react-router-dom";
import { ArrowLeft, Feather, GitMerge, Leaf, Sprout } from "lucide-react";
import {
  GROWTH_MATURITY, IMPLEMENTATION_LABEL, MATURITY_LABEL,
  type CrownGrowth, type GrowthRealm, type ImplementationState,
} from "@/data/crown/growths";
import { taprootContext } from "@/lib/crown/taprootContext";
import { placeBuild, seamInBuild, servingBuild, stillOpen } from "@/lib/crown/devRoomEvidence";
import { useGrowthTasks } from "@/hooks/use-growth-tasks";
import { ROUTES } from "@/lib/routes";

const REALM_LABEL: Record<GrowthRealm, string> = {
  roots: "Roots · Ancient Friends", heartwood: "Heartwood", canopy: "Canopy · Council of Life",
  crown: "Crown", taproot: "Taproot", "embodied-tetol": "Embodied TETOL",
};

const short = (sha: string) => sha.slice(0, 8);

function Section({ n, title, kicker, children, id }: { n: string; title: string; kicker?: string; id: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-border pt-6 mt-6 first:border-t-0 first:pt-0 first:mt-0">
      <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
        <span className="text-primary font-serif mr-2">{n}</span>{kicker}
      </p>
      <h2 id={id} className="font-serif text-lg md:text-xl mt-1 mb-3 tracking-wide">{title}</h2>
      {children}
    </section>
  );
}

function StateMark({ state }: { state: ImplementationState }) {
  const tone = state === "blocked" ? "border-destructive/50 text-foreground"
    : state === "testing" ? "border-accent text-foreground"
    : "border-primary/50 text-foreground";
  return (
    <span className={`inline-flex items-center rounded-full border ${tone} px-2 py-0.5 text-xs whitespace-nowrap`}>
      {IMPLEMENTATION_LABEL[state]}
    </span>
  );
}

function MaturityStrip({ growth }: { growth: CrownGrowth }) {
  const current = GROWTH_MATURITY.indexOf(growth.maturity);
  return (
    <div>
      <ol aria-label={`Public maturity: ${MATURITY_LABEL[growth.maturity]}`} className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {GROWTH_MATURITY.map((stage, i) => {
          const here = i === current;
          return (
            <li key={stage} aria-current={here ? "step" : undefined} className="flex items-center gap-1">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm font-serif ${
                  here ? "bg-primary text-primary-foreground" : i < current ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {MATURITY_LABEL[stage]}
              </span>
              {i < GROWTH_MATURITY.length - 1 && <span aria-hidden className="text-muted-foreground">·</span>}
            </li>
          );
        })}
      </ol>
      <p className="text-sm text-muted-foreground mt-2">
        Set by {growth.maturitySetBy.by} on {new Date(growth.maturitySetBy.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.
        Maturity describes the growth itself. It is kept apart from build state below.
      </p>
    </div>
  );
}

function AgentGardenRelationship({ growth, featureName }: { growth: CrownGrowth; featureName?: string }) {
  const { data, isLoading, isError } = useGrowthTasks(growth.roadmapFeatureId);
  return (
    <div className="space-y-4">
      <p>
        Linked through the Living Roadmap feature{" "}
        <Link to={ROUTES.ROADMAP} className="underline underline-offset-2 decoration-primary/60 hover:text-primary">
          {featureName ?? growth.roadmapFeatureId}
        </Link>{" "}
        (<code className="text-sm">{growth.roadmapFeatureId}</code>), the same key Agent Garden tasks already carry.
      </p>
      <div className="rounded-md bg-secondary/60 px-4 py-3" aria-live="polite">
        <p className="text-sm font-medium text-secondary-foreground">Agent Garden tasks for this feature</p>
        {isLoading && <p className="text-sm mt-1">Listening…</p>}
        {isError && <p className="text-sm mt-1">The Agent Garden could not be reached just now. Nothing is assumed.</p>}
        {data && data.length === 0 && <p className="text-sm mt-1">No tasks are linked yet. Tending so far has been routed by hand.</p>}
        {data && data.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm">
            {data.map(t => (
              <li key={t.id} className="flex justify-between gap-3">
                <span>{t.title}</span><span className="text-muted-foreground">{t.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to={ROUTES.AGENT_GARDEN} className="inline-block text-sm mt-2 underline underline-offset-2 decoration-primary/60 hover:text-primary">
          Visit the Agent Garden
        </Link>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Specialist tending, routed by hand</p>
        <ul className="space-y-2">
          {growth.handoffs.map(h => (
            <li key={h.lane} className="text-sm">
              <span className="font-serif text-primary">{h.lane}</span>
              <span className="text-muted-foreground"> · </span>{h.tended}
              <span className="block text-muted-foreground">Returned as: {h.returned}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function GrowthFolio({ growth, build = servingBuild() }: { growth: CrownGrowth; build?: string | null }) {
  const taproot = taprootContext(growth);
  const placement = placeBuild(build, growth.releaseLine);
  const open = stillOpen(growth, placement);

  return (
    <div className="light">
      <article
        aria-labelledby="folio-title"
        className="parchment-card bg-background text-foreground mx-auto max-w-3xl px-5 py-7 sm:px-10 sm:py-10 leading-relaxed"
      >
        <div className="mb-8">
          <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground flex items-center gap-2">
            <Feather className="h-3.5 w-3.5 text-primary" aria-hidden /> Crown · Growth folio
          </p>
          <h1 id="folio-title" className="font-serif text-2xl sm:text-3xl mt-2 tracking-wide">{growth.title}</h1>
          <p className="font-serif italic text-muted-foreground mt-1">{growth.subtitle}</p>
          {growth.titleNote && <p className="text-sm text-muted-foreground mt-2">{growth.titleNote}</p>}
          <p className="text-sm mt-4">Read-only. Nothing on this page changes anything.</p>
        </div>

        <Section n="I" kicker="Crown" title="Where this growth came from" id="folio-origin">
          <div className="space-y-2">{growth.origin.map(line => <p key={line}>{line}</p>)}</div>
          <ol aria-label="Lineage" className="mt-4 flex flex-wrap gap-2 text-sm">
            {growth.seams.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2">
                <span className="rounded-md border border-border px-2 py-1">{s.surface}</span>
                {i < growth.seams.length - 1 && <span aria-hidden className="text-primary">→</span>}
              </li>
            ))}
          </ol>
        </Section>

        <Section n="II" kicker="Crown" title="Public maturity" id="folio-maturity">
          <MaturityStrip growth={growth} />
        </Section>

        <Section n="III" kicker="Realms" title="What it touches, and what it leaves alone" id="folio-realms">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium mb-2 flex items-center gap-1.5"><Leaf className="h-3.5 w-3.5 text-secondary-foreground" aria-hidden />Touches</p>
              <ul className="space-y-2">
                {growth.realms.touched.map(r => (
                  <li key={r.realm} className="text-sm">
                    <span className="font-serif text-secondary-foreground">{REALM_LABEL[r.realm]}</span>
                    <span className="text-muted-foreground"> · {r.weight}</span>
                    <span className="block">{r.where}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Does not touch</p>
              <ul className="space-y-1 text-sm list-disc pl-5 marker:text-muted-foreground">
                {growth.realms.notTouched.map(t => <li key={t}>{t}</li>)}
              </ul>
            </div>
          </div>
        </Section>

        <Section n="IV" kicker="Taproot" title="What it depends on" id="folio-taproot">
          <p>
            One source of truth: <code className="text-sm break-all">{taproot.source.path}</code>
          </p>
          <dl className="mt-3 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Circle</dt><dd>{taproot.source.circleTitle}</dd>
            <dt className="text-muted-foreground">Approval</dt><dd>{taproot.source.approved ? "Approved for public surfaces" : "Draft · public surfaces stay closed"}</dd>
            <dt className="text-muted-foreground">Revision</dt><dd><code>{taproot.source.revision}</code></dd>
            <dt className="text-muted-foreground">Destinations</dt><dd>{taproot.source.approvedDestinations} approved public links pass the link policy</dd>
          </dl>
          <p className="text-sm font-medium mt-4 mb-1">Read by</p>
          <ul className="space-y-1 text-sm">
            {taproot.readers.map(r => (
              <li key={r.path}><span>{r.role}</span> <code className="text-xs text-muted-foreground break-all">{r.path}</code></li>
            ))}
          </ul>
          {taproot.feature && (
            <p className="text-sm mt-4">
              Roadmap feature <span className="font-serif">{taproot.feature.name}</span>: {taproot.feature.statusLabel.toLowerCase()},{" "}
              {taproot.feature.stageLabel.toLowerCase()}. Connected to {taproot.feature.connections.map(c => c.name).join(" and ")}.
            </p>
          )}
        </Section>

        <Section n="V" kicker="Agent Garden" title="Who has tended it" id="folio-agent-garden">
          <AgentGardenRelationship growth={growth} featureName={taproot.feature?.name} />
        </Section>

        <Section n="VI" kicker="Dev Room" title="What has been built, tested and merged" id="folio-dev-room">
          <ul className="space-y-4">
            {growth.seams.map(s => {
              const inBuild = seamInBuild(s, placement, growth.releaseLine);
              return (
                <li key={s.id} className="rounded-md border border-border px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-serif">{s.surface}</span>
                    <StateMark state={s.state} />
                  </div>
                  <dl className="mt-2 grid grid-cols-[auto,1fr] gap-x-3 gap-y-0.5 text-sm">
                    {s.branch && (<><dt className="text-muted-foreground">Branch</dt><dd className="break-all"><code>{s.branch}</code></dd></>)}
                    <dt className="text-muted-foreground">Commits</dt><dd><code>{s.commits.map(short).join(" · ")}</code></dd>
                    {s.pr && (<><dt className="text-muted-foreground">Pull request</dt><dd>#{s.pr}{s.mergeSha && <> · merged <code>{short(s.mergeSha)}</code></>}</dd></>)}
                    {s.testsRecorded && (<><dt className="text-muted-foreground">Tests</dt><dd>{s.testsRecorded}</dd></>)}
                    <dt className="text-muted-foreground">Evidence</dt>
                    <dd>{s.evidence.map(e => (
                      <code key={e.path} className="block text-xs break-all">{e.path}{e.onBranch && ` (on ${e.onBranch})`}</code>
                    ))}</dd>
                    {inBuild !== null && (<><dt className="text-muted-foreground">This build</dt><dd>{inBuild ? "Included" : "Not included"}</dd></>)}
                  </dl>
                  {s.open?.map(o => <p key={o} className="text-sm mt-2">{o}</p>)}
                </li>
              );
            })}
          </ul>

          <div className="mt-5 text-sm">
            <p className="font-medium flex items-center gap-1.5"><GitMerge className="h-3.5 w-3.5 text-primary" aria-hidden />Release line · <code>{growth.releaseLine.branch}</code></p>
            <ol className="mt-2 space-y-1">
              {growth.releaseLine.points.map((p, i) => (
                <li key={p.sha} className="flex gap-3">
                  <code className="text-muted-foreground">{short(p.sha)}</code>
                  <span>{p.label}{placement.kind === "placed" && placement.index === i && <strong className="font-medium"> · serving this page</strong>}</span>
                </li>
              ))}
            </ol>
            <p className="mt-2 text-muted-foreground">
              {placement.kind === "unknown" && "The build serving this page is not known here."}
              {placement.kind === "placed" && `This page is served from “${placement.label}”.`}
              {placement.kind === "elsewhere" && `This page is served from build ${short(placement.build)}, which is not a recorded point on this release line.`}
            </p>
          </div>
        </Section>

        <Section n="VII" kicker="Dev Room" title="Still candidate, held or undeployed" id="folio-open">
          {open.length === 0 ? <p>Nothing is open.</p> : (
            <ul className="space-y-2 text-sm">
              {open.map(o => (
                <li key={o.seam.id}><span className="font-serif">{o.seam.surface}</span> <span className="text-muted-foreground">· {o.reason}</span></li>
              ))}
            </ul>
          )}
        </Section>

        <Section n="VIII" kicker="Heartwood" title="What is remembered" id="folio-heartwood">
          <p>{growth.heartwood.notYet}</p>
          <ul className="mt-2 flex flex-wrap gap-4 text-sm">
            {growth.heartwood.remembered.map(r => (
              <li key={r.route}><Link to={r.route} className="underline underline-offset-2 decoration-primary/60 hover:text-primary">{r.label}</Link></li>
            ))}
          </ul>
        </Section>

        <Section n="IX" kicker="TEOTAG · Curator" title="Decisions needed next" id="folio-decisions">
          <ol className="space-y-2 list-decimal pl-5 marker:text-primary marker:font-serif">
            {growth.nextDecisions.map(d => <li key={d}>{d}</li>)}
          </ol>
          <p className="text-sm text-muted-foreground mt-3">Decisions are made in conversation with TEOTAG. Nothing here can approve them.</p>
        </Section>

        <footer className="border-t border-border mt-8 pt-5 flex items-center justify-between gap-3 text-sm">
          <Link to={ROUTES.GOLDEN_DREAM} className="inline-flex items-center gap-1.5 underline underline-offset-2 decoration-primary/60 hover:text-primary">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Return to the Crown
          </Link>
          <Sprout className="h-4 w-4 text-secondary-foreground" aria-hidden />
        </footer>
      </article>
    </div>
  );
}
