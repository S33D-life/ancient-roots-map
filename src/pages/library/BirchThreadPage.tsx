import { Component, lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ParchmentGround } from "@/components/parchment/ParchmentGround";
import { applySiteTheme, useParchmentDark } from "@/hooks/use-parchment-dark";
import { ROUTES } from "@/lib/routes";
import { identityOpening, parseReturnContext, returnContextParams, restoreAppearanceFocus } from "@/lib/library/contextualReturn";
import { resolveRecordIdentity, resolveIdentityRelationship } from "@/lib/library/recordIdentity";
import { BIRCH_REF, SILVER_BIRCH_REF, BIRCH_SEED_SOURCE, BIRCH_PREPARATION_SOURCE, BIRCH_ARTIFACT, birchAppearance, birchThreadSources, publicThreadTree, publicBirchRecords, THREAD_ROUTES, threadReturn } from "@/data/library/birchThread";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { identityRefSchema } from "@/lib/library/recordIdentity";
import "@/styles/birch-thread.css";

const FrameStudy = lazy(() => import("@/components/council/BirchFrameStudy"));
class FrameBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <p>The spatial frame is unavailable here. The doorway below opens the same Birch.</p> : this.props.children; }
}
function Shell({ children }: { children: ReactNode }) {
  const dark = useParchmentDark();
  return <ParchmentGround realm="heartwood" className="birch-thread">
    <nav className="birch-threshold" aria-label="Study orientation"><Link to={ROUTES.S33D}>Return to the Tree</Link><button type="button" onClick={() => applySiteTheme(!dark)}>{dark ? "Living Parchment" : "Night Grove"}</button></nav>
    <main className="birch-paper">{children}</main>
  </ParchmentGround>;
}

export function BirchPreparationPage() {
  useDocumentTitle("Birch · Circle 236 preparation study");
  const { circleNumber } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate(), location = useLocation();
  const mode = params.get("mode") === "spatial" ? "spatial" : "2d";
  const appearance = useMemo(() => birchAppearance(mode), [mode]);
  const opening = identityOpening(appearance)!;
  const open = () => {
    navigate({ pathname: location.pathname, search: `?mode=${mode}&returned=1` }, { replace: true, state: { libraryReturn: appearance.returnContext } });
    navigate({ pathname: THREAD_ROUTES.identity(opening.identity), search: `?${returnContextParams(opening.returnContext)}` });
  };
  useEffect(() => {
    if (params.get("returned") !== "1") return;
    const frame = requestAnimationFrame(() => {
      if (appearance.returnContext.route === "council") restoreAppearanceFocus(appearance.returnContext);
      document.getElementById(appearance.id)?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, params, appearance.id, appearance.returnContext]);
  if (circleNumber !== "236") return <Shell><h1>Preparation unavailable</h1><Link to={ROUTES.COUNCIL}>Return to Council</Link></Shell>;
  return <Shell>
    <p className="birch-kicker">Canopy · Circle 236 · preparation study</p>
    <h1>A place for Birch.</h1>
    <p className="birch-lead">One companion. One living thread.</p>
    <p className="birch-status">Not an opened Circle or a record of a gathering.</p>
    <div className="birch-mode" aria-label="Companion view"><Link aria-current={mode === "2d" ? "page" : undefined} to={`${THREAD_ROUTES.circle(236)}?mode=2d`}>Companion</Link><Link aria-current={mode === "spatial" ? "page" : undefined} to={`${THREAD_ROUTES.circle(236)}?mode=spatial`}>Framed spatial study</Link></div>
    <section className="birch-clearing" aria-labelledby="birch-name">
      {mode === "spatial" ? <FrameBoundary><Suspense fallback={<p>Opening the framed study…</p>}><FrameStudy onOpen={open} /></Suspense></FrameBoundary> : <button className="birch-portrait" aria-label="Approach Birch" onClick={open}><img src={BIRCH_ARTIFACT} alt="Illustrative Birch presence with pale bark and leaves; not a photograph" /></button>}
      <div className="birch-recognition"><p className="birch-kicker">Tree companion</p><h2 id="birch-name">Birch</h2><p><em>Betula</em> · genus</p><p>{appearance.contextNote}</p><button className="birch-action" id="birch-companion" onClick={open}>Look closer at Birch →</button></div>
    </section>
    <p className="birch-status">Illustrative artifact · pale-bark frame study. Neither a specific tree nor documentary evidence.</p>
    <details><summary>Where this preparation comes from</summary><p>The companion choice is confirmed in <a href={BIRCH_PREPARATION_SOURCE}>Circle 236 preparation</a>. This review projection creates no Council history.</p></details>
  </Shell>;
}

export function BirchReadingPage() {
  useDocumentTitle("Birch · PLANeTary reading study");
  const { source, id } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const returnContext = parseReturnContext(params);
  const target = threadReturn(returnContext);
  const fromCircle = !!target.state;
  const selected = params.get("livingRecord");
  const validSelection = identityRefSchema.safeParse({ source: "trees", id: selected }).success;
  const selectionFocus = useRef<HTMLHeadingElement>(null);
  const identity = useQuery({ queryKey: ["thread-identity", source, id], queryFn: () => resolveRecordIdentity({ source, id }, birchThreadSources) });
  const strand = useQuery({ queryKey: ["thread-strand", id], enabled: identity.data?.status === "ready", queryFn: async () => {
    const relationship = await resolveIdentityRelationship({ kind: "species-strand", from: BIRCH_REF, to: SILVER_BIRCH_REF, evidence: [BIRCH_REF] }, birchThreadSources);
    if (!relationship) return null;
    return resolveRecordIdentity(relationship.to, birchThreadSources);
  } });
  const records = useQuery({ queryKey: ["thread-public-records", SILVER_BIRCH_REF.speciesKey], enabled: strand.data?.status === "ready", queryFn: publicBirchRecords });
  const tree = useQuery({ queryKey: ["thread-public-tree", selected], enabled: !!selected && validSelection, queryFn: async () => {
    const record = await publicThreadTree(selected!);
    if (!record) return null;
    const relation = await resolveIdentityRelationship({ kind: "individual-of-species", from: SILVER_BIRCH_REF, to: { source: "trees", id: record.id }, evidence: [{ source: "trees", id: record.id }] }, birchThreadSources);
    return relation ? record : null;
  } });
  useEffect(() => {
    if (!selected || !tree.data) return;
    selectionFocus.current?.focus({ preventScroll: true });
    selectionFocus.current?.scrollIntoView({ block: "center", behavior: "instant" });
  }, [selected, tree.data]);
  const select = (treeId: string | null) => {
    const next = new URLSearchParams(params);
    if (treeId) next.set("livingRecord", treeId); else next.delete("livingRecord");
    setParams(next);
  };
  if (identity.isPending) return <Shell><p role="status">Opening Birch…</p></Shell>;
  if (identity.data?.status !== "ready" || id !== BIRCH_REF.id || source !== BIRCH_REF.source) return <Shell><h1>This reading is unavailable</h1><Link to={ROUTES.LIBRARY}>Return to the Library</Link></Shell>;
  return <Shell>
    <button className="birch-return" onClick={() => navigate({ pathname: target.pathname, search: target.search }, { state: target.state })}>{fromCircle ? "← Return to Birch in Circle 236" : "← Return to the Library"}</button>
    <p className="birch-kicker">PLANeTary · a living thread</p><h1>{identity.data.identity.label}</h1><p className="birch-lead"><em>{identity.data.identity.scientificName}</em> · genus</p>
    <p className="birch-status">Source-linked reading study · not a canonical Library edition. The unpublished chapter remains closed.</p>
    <section><h2>What is Birch?</h2><p>Birch is the broad <em>Betula</em> lineage. Kew recognises it as a genus in the birch family, native across the temperate Northern Hemisphere.</p><p>The genus holds many species. This thread follows one species strand without making it the whole of Birch.</p><a href="https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:328387-2">Botanical source · Kew →</a></section>
    <section><h2>A species strand</h2>{strand.isError ? <p role="status">The species strand could not be loaded.</p> : strand.data?.status === "ready" ? <><h3>{strand.data.identity.label}</h3><p><em>{strand.data.identity.scientificName}</em></p><p>A principal/reference strand in this Birch study. The species has its own exact taxonomy record.</p><p className="birch-status">Relationship: belongs to <em>Betula</em> · supported by the <a href="https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:328387-2">Kew genus record</a> and existing exact species key.</p></> : strand.isPending ? <p role="status">Resolving the species strand…</p> : <p role="status">The species strand is unavailable. No mapped relationship is inferred.</p>}</section>
    <section><h2>Birch in the living world</h2><p>These are individual mapped records whose stored species key is <em>Betula pendula</em>. A mapped record does not establish a recognised Ancient Friend relationship.</p>{records.isError ? <p role="status">Mapped records could not be loaded.</p> : strand.data?.status !== "ready" ? <p>No mapped relationship can be shown until the species strand is available.</p> : records.isPending ? <p role="status">Looking for public mapped records…</p> : records.data?.length ? <ul className="birch-records">{records.data.map(record => <li key={record.id}><button onClick={() => select(record.id)} aria-expanded={selected === record.id}>{record.name} <span>Public mapped tree →</span></button></li>)}</ul> : <p>No public mapped records are available here.</p>}
    {selected && <div className="birch-field-record">{tree.isPending && validSelection ? <p role="status">Opening this mapped tree…</p> : tree.data ? <><h3 ref={selectionFocus} tabIndex={-1}>{tree.data.name} · mapped tree</h3><p>Recorded species: <em>Betula pendula</em>. Recognition as an Ancient Friend is not established by this projection.</p><p>{tree.data.latitude != null && tree.data.longitude != null ? `${tree.data.latitude.toFixed(5)}, ${tree.data.longitude.toFixed(5)}` : "Location not recorded"}</p>{tree.data.access_notes && <p>Recorded access note: {tree.data.access_notes}</p>}<Link className="birch-action" to={`${ROUTES.MAP}?tree=${tree.data.id}`}>Find this tree on the Map →</Link><p className="birch-status">Opening the Map takes you into the existing Roots experience. Browser Back returns to this reading and its Circle context.</p><button onClick={() => { select(null); requestAnimationFrame(() => document.getElementById("birch-record-list")?.focus()); }}>Return to the Birch thread ↑</button></> : <p role="status">This record is unavailable in the public Birch thread.</p>}</div>}
    <h3 id="birch-record-list" tabIndex={-1}>The same thread, different lives.</h3><p>Birch is the genus. Silver Birch is a species. Each mapped tree keeps its own identity.</p></section>
    <section><h2>Back into life</h2><p>If you meet a birch, pause beside it. Notice the bark and its markings, then the shape of a leaf if one is present. What do you notice when you take your time?</p><p className="birch-status">Observation invitation, not a required task or a claim that an encounter has been recorded. <a href="https://www.woodlandtrust.org.uk/trees-woods-and-wildlife/british-trees/a-z-of-british-trees/silver-birch/">Silver Birch field reference →</a></p></section>
    <details><summary>Source and identity</summary><p>The durable authored Birch home is <a href={BIRCH_SEED_SOURCE}>Birch — Living Library Seed</a>. This small manual projection uses its existing reference and current genus scope; it does not publish its draft chapter.</p><p>Mapped trees and taxonomy are read through existing access rules. No new tree, encounter, Offering or authority state is created.</p></details>
    <button className="birch-action" onClick={() => navigate({ pathname: target.pathname, search: target.search }, { state: target.state })}>{fromCircle ? "Return to Birch in Circle 236 ↑" : "Return to the Library ↑"}</button>
  </Shell>;
}
