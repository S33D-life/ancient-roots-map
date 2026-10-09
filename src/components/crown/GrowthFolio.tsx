/**
 * Growth Folio — a read-only Crown view of one growth, in Living Parchment.
 *
 * Order (Claude Design · CROWN_HANDOFF_v3): header → in short → what happened
 * → where it grows → what has been built → still open → how it is held →
 * what needs deciding → return.
 *
 * Public maturity and engineering state never share a line, except in the
 * "what it rests on" tally, which names its states as engineering. Nothing
 * here writes, votes, endorses or publishes.
 */
import { useId, useState } from "react";
import CrownTreeFrame from "./CrownTreeFrame";
import { Link } from "react-router-dom";
import {
  GROWTH_MATURITY, IMPLEMENTATION_LABEL, MATURITY_LABEL,
  type CrownGrowth, type GrowthRealm, type GrowthSeam,
} from "@/data/crown/growths";
import { taprootContext } from "@/lib/crown/taprootContext";
import { placeBuild, seamInBuild, servingBuild, stillOpen, type BuildPlacement } from "@/lib/crown/devRoomEvidence";
import { returnTarget, type ReturnTarget } from "@/lib/crown/returnPath";
import { openItems, plural, restsOn } from "@/lib/crown/growthReading";
import { useGrowthTasks } from "@/hooks/use-growth-tasks";
import { ROUTES } from "@/lib/routes";
import MaturityGlyph from "./MaturityGlyph";
import "./living-parchment.css";

const REALM_LABEL: Record<GrowthRealm, string> = {
  roots: "Roots · Ancient Friends", heartwood: "Heartwood", canopy: "Canopy · Council of Life",
  crown: "Crown", taproot: "Taproot", "embodied-tetol": "Embodied TETOL",
};
const ORDINAL = ["first", "second", "third", "fourth", "fifth", "sixth"];
const short = (sha: string) => sha.slice(0, 8);

function SeamRow({ seam, placement, growth }: { seam: GrowthSeam; placement: BuildPlacement; growth: CrownGrowth }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const inBuild = seamInBuild(seam, placement, growth.releaseLine);
  return (
    <li className="lp-seam">
      <button type="button" className="lp-seam-toggle" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(o => !o)}>
        <span className="lp-seam-surface">{seam.surface}</span>
        <span className={`lp-seam-state${seam.state === "blocked" ? " lp-seam-state--held" : ""}`}>{IMPLEMENTATION_LABEL[seam.state]}</span>
        <span aria-hidden className="text-center text-[19px] text-[color:var(--lp-ink)]">{open ? "–" : "+"}</span>
      </button>
      {open && (
        <div id={panel} className="lp-seam-detail">
          <dl className="lp-facts">
            {seam.branch && (<><dt>Branch</dt><dd><code className="break-all">{seam.branch}</code></dd></>)}
            <dt>Commits</dt><dd><code>{seam.commits.map(short).join(" · ")}</code></dd>
            {seam.pr && (<><dt>Pull request</dt><dd>#{seam.pr}{seam.mergeSha && <> · merged <code>{short(seam.mergeSha)}</code></>}</dd></>)}
            {seam.testsRecorded && (<><dt>Tests recorded</dt><dd>{seam.testsRecorded}</dd></>)}
          </dl>
          {seam.evidence.map(e => (
            <span key={e.path} className="lp-mono">{e.path}{e.onBranch && ` (on ${e.onBranch})`}</span>
          ))}
          {inBuild !== null && <span className="lp-small-meta">In this build: {inBuild ? "included" : "not included"}</span>}
          {seam.open?.map(o => (
            <span key={o} className="lp-open-row border-t-0 py-0.5"><span aria-hidden className="lp-stroke-dotted translate-y-[11px]" />{o}</span>
          ))}
        </div>
      )}
    </li>
  );
}

function Tending({ growth }: { growth: CrownGrowth }) {
  const { data, isLoading, isError } = useGrowthTasks(growth.roadmapFeatureId);
  return (
    <div>
      <span className="lp-meta">tended so far · routed by hand</span>
      <ul className="m-0 p-0 list-none">
        {growth.handoffs.map(h => (
          <li key={h.lane}>
            <span className="text-[color:var(--lp-ink)]">{h.lane}</span> · {h.tended}
            <span className="lp-small-meta block">Returned as: {h.returned}</span>
          </li>
        ))}
      </ul>
      <div aria-live="polite" className="mt-2">
        <span className="lp-meta">Agent Garden tasks for this growth</span>
        {isLoading && (
          <div className="flex flex-col gap-1.5 py-1">
            <span className="lp-small-meta">Listening…</span>
            <span aria-hidden className="lp-bar w-4/5" /><span aria-hidden className="lp-bar w-1/2" />
          </div>
        )}
        {isError && <p className="m-0">The Agent Garden could not be reached just now. Nothing is assumed.</p>}
        {data && data.length === 0 && <p className="m-0">No tasks are linked yet. Tending so far has been routed by hand.</p>}
        {data && data.length > 0 && (
          <ul className="m-0 p-0 list-none">
            {data.map(t => <li key={t.id}>{t.title} <span className="lp-small-meta">· {t.status}</span></li>)}
          </ul>
        )}
        <Link to={ROUTES.AGENT_GARDEN} className="lp-link">Visit the Agent Garden</Link>
      </div>
      <span className="lp-small-meta">The Agent Garden supports tending; it does not decide.</span>
    </div>
  );
}

function HowItIsHeld({ growth, placement }: { growth: CrownGrowth; placement: BuildPlacement }) {
  const [open, setOpen] = useState(false);
  const panel = useId();
  const taproot = taprootContext(growth);
  const points = growth.releaseLine.points;
  const latest = points[points.length - 1];
  return (
    <section aria-label="How it is held" className="lp-section gap-2">
      <button type="button" className="lp-more-toggle" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(o => !o)}>
        {open ? "Hide how it is held –" : "How it is held: Taproot, tending, memory, release line +"}
      </button>
      {open && (
        <div id={panel} className="lp-more">
          <div>
            <span className="lp-meta">Taproot understands · depends on</span>
            <span className="lp-mono text-[13.5px] text-[color:var(--lp-ink)]">{taproot.source.path}</span>
            <dl className="lp-facts">
              <dt>Circle</dt><dd>{taproot.source.circleTitle}</dd>
              <dt>Approval</dt><dd>{taproot.source.approved ? "Approved for public surfaces" : "Draft · public surfaces stay closed"}</dd>
              <dt>Revision</dt><dd><code>{taproot.source.revision}</code></dd>
              <dt>Destinations</dt><dd>{taproot.source.approvedDestinations} approved public links pass the link policy</dd>
            </dl>
            <span>read by {plural(taproot.readers.length, "surface", "surfaces")}</span>
            <ul aria-label="Read by" className="m-0 p-0 list-none">
              {taproot.readers.map(r => (
                <li key={r.path}>{r.role} <span className="lp-mono">{r.path}</span></li>
              ))}
            </ul>
            {taproot.feature && (
              <span className="lp-small-meta">
                Living Roadmap feature <Link to={ROUTES.ROADMAP} className="lp-link">{taproot.feature.name}</Link>{" "}
                (<code>{growth.roadmapFeatureId}</code>): {taproot.feature.statusLabel.toLowerCase()}, {taproot.feature.stageLabel.toLowerCase()}.
                Connected to {taproot.feature.connections.map(c => c.name).join(" and ")}.
              </span>
            )}
          </div>
          <Tending growth={growth} />
          <div>
            <span className="lp-meta">Heartwood remembers</span>
            <span>{growth.heartwood.notYet}</span>
            <span className="flex flex-wrap gap-x-4">
              {growth.heartwood.remembered.map(r => <Link key={r.route} to={r.route} className="lp-link">{r.label}</Link>)}
            </span>
          </div>
          <div>
            <span className="lp-meta">release line · {growth.releaseLine.branch}</span>
            <span>{plural(points.length, "recorded point", "recorded points")}; the latest reads “{latest?.label}”.</span>
            <ol aria-label="Release line" className="m-0 p-0 list-none">
              {points.map((p, i) => (
                <li key={p.sha} className="lp-release-point">
                  <code>{short(p.sha)}</code>
                  <span>{p.label}{placement.kind === "placed" && placement.index === i && <strong className="font-medium"> · serving this page</strong>}</span>
                </li>
              ))}
            </ol>
            <span className="lp-small-meta">
              {placement.kind === "unknown" && "The build serving this page is not known here."}
              {placement.kind === "placed" && `This page is served from “${placement.label}”.`}
              {placement.kind === "elsewhere" && `This page is served from build ${short(placement.build)}, which is not a recorded point on this release line.`}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

export default function GrowthFolio({ growth, build = servingBuild(), returnTo = returnTarget(undefined) }: {
  growth: CrownGrowth; build?: string | null; returnTo?: ReturnTarget;
}) {
  const placement = placeBuild(build, growth.releaseLine);
  const open = openItems(growth);
  // Build-aware: a merged seam is "open" here until the serving build is known to include it.
  const notLive = stillOpen(growth, placement);
  const stage = GROWTH_MATURITY.indexOf(growth.maturity);
  const setOn = new Date(growth.maturitySetBy.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="light lp">
      <article aria-labelledby="folio-title" className="lp-leaf">
        {/* A div, not <header>: the site styles every header element as chrome. */}
        <div className="flex flex-col gap-2.5">
          <span className="lp-meta text-[18px]">A growth in the Crown · read-only</span>
          <h1 id="folio-title" className="lp-folio-title">{growth.title}</h1>
          <p className="lp-subtitle">{growth.subtitle}</p>
          {growth.titleNote && <span className="text-[17px] text-[color:var(--lp-muted)]">{growth.titleNote}</span>}
        </div>

        <CrownTreeFrame depth="folio" />

        <section aria-label="In short" className="lp-inshort">
          <div className="flex gap-3 items-center">
            <MaturityGlyph maturity={growth.maturity} />
            <span className="flex flex-col">
              <span className="lp-inshort-label">how ripe</span>
              <span className="lp-inshort-value">{MATURITY_LABEL[growth.maturity]}, {ORDINAL[stage]} of six</span>
              <span className="lp-small-meta">set by {growth.maturitySetBy.by}, {setOn}</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="lp-inshort-label">what it rests on</span>
            <span className="lp-inshort-value">{restsOn(growth.seams)}</span>
            <span className="lp-small-meta">recorded evidence, not proof of deployment</span>
          </div>
          <div className="flex flex-col">
            <span className="lp-inshort-label">what it waits on</span>
            <span className="lp-inshort-value">{plural(growth.nextDecisions.length, "decision", "decisions")} with TEOTAG</span>
            <span className="lp-small-meta">{plural(open.length, "item", "items")} still open</span>
          </div>
        </section>

        <section aria-labelledby="folio-happened" className="lp-section gap-2.5">
          <h2 id="folio-happened" className="lp-h2">What happened</h2>
          {growth.origin.map(line => <p key={line} className="lp-p">{line}</p>)}
          <ol aria-label="Lineage" className="lp-lineage">
            {growth.seams.map(s => <li key={s.id}>{s.surface}</li>)}
          </ol>
        </section>

        <section aria-labelledby="folio-realms" className="lp-section gap-1">
          <h2 id="folio-realms" className="lp-h2 mb-1.5">Where it grows in the Tree</h2>
          <ul className="m-0 p-0 list-none">
            {growth.realms.touched.map(r => (
              <li key={r.realm} className="lp-realm-row">
                <span aria-hidden className="lp-stroke" />
                <span className="flex flex-col">
                  <span className="text-[19px] text-[color:var(--lp-ink)]">{REALM_LABEL[r.realm]}</span>
                  <span className="lp-small-meta">{r.weight}</span>
                </span>
                <span className="text-[17.5px] leading-[1.4]">{r.where}</span>
              </li>
            ))}
          </ul>
          <span className="lp-meta mt-2">leaves alone</span>
          <span className="text-[17.5px] leading-[1.5] opacity-75">{growth.realms.notTouched.join(" · ")}</span>
        </section>

        <section aria-labelledby="folio-built" className="lp-section gap-1">
          <h2 id="folio-built" className="lp-h2">What has been built</h2>
          <span className="lp-meta mb-1.5">
            Engineering state, from the Dev Room. It is kept apart from maturity: merged is not deployed, and deployed is not verified live.
          </span>
          <ul className="m-0 p-0 list-none">
            {growth.seams.map(s => <SeamRow key={s.id} seam={s} placement={placement} growth={growth} />)}
          </ul>
        </section>

        <section aria-labelledby="folio-open" className="lp-section">
          <h2 id="folio-open" className="lp-h2">Still open</h2>
          {open.length === 0 ? <p className="lp-p">Nothing is open.</p> : (
            <ul aria-label="Recorded open items" className="m-0 p-0 list-none">
              {open.map(o => (
                <li key={o.item} className="lp-open-row">
                  <span aria-hidden className="lp-stroke-dotted" />
                  <span className="flex flex-col">
                    <span className="text-[18.5px] leading-[1.42] text-[color:var(--lp-ink)]">{o.item}</span>
                    <span className="lp-small-meta">{o.seam.surface}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          <span className="lp-meta mt-3">candidate, held or not shown in this build</span>
          {notLive.length === 0 ? <p className="lp-p">Every recorded surface is included in the build serving this page.</p> : (
            <ul aria-label="Candidate, held or not in this build" className="m-0 p-0 list-none">
              {notLive.map(o => (
                <li key={o.seam.id} className="lp-open-row">
                  <span aria-hidden className="lp-stroke-dotted" />
                  <span className="flex flex-col">
                    <span className="text-[18.5px] leading-[1.42] text-[color:var(--lp-ink)]">{o.seam.surface}</span>
                    <span className="lp-small-meta">{o.reason}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <HowItIsHeld growth={growth} placement={placement} />

        <section aria-labelledby="folio-deciding" className="lp-deciding">
          <h2 id="folio-deciding" className="lp-h2">What needs deciding</h2>
          <ol className="m-0 p-0 list-none">
            {growth.nextDecisions.map((d, i) => (
              <li key={d} className="lp-decision"><span aria-hidden className="text-[22px] leading-[1.1]">{i + 1}</span><span>{d}</span></li>
            ))}
          </ol>
          <span className="lp-small-meta text-[16.5px] leading-[1.4]">
            Decisions are made with TEOTAG. Reading this page, holding a Staff or connecting an agent does not approve anything.
          </span>
        </section>

        <nav aria-label="Return" className="lp-return-row">
          <Link to={returnTo.to} className="lp-return">↩ {returnTo.label}</Link>
          <Link to={ROUTES.COUNCIL} className="lp-council">or visit the Council it came from →</Link>
        </nav>
      </article>
    </div>
  );
}
