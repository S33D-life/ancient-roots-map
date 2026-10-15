import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Circle236Fire from "@/components/council/Circle236Fire";
import Footer from "@/components/Footer";
import { ROUTES } from "@/lib/routes";
import { identityOpening, parseReturnContext, returnContextParams, restoreAppearanceFocus } from "@/lib/library/contextualReturn";
import { resolveRecordIdentity, resolveIdentityRelationship } from "@/lib/library/recordIdentity";
import { BIRCH_REF, SILVER_BIRCH_REF, BIRCH_SEED_SOURCE, BIRCH_PREPARATION_SOURCE, BIRCH_ARTIFACT, birchAppearance, birchThreadSources, publicThreadTree, publicBirchRecords, THREAD_ROUTES, threadReturn } from "@/data/library/birchThread";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { identityRefSchema } from "@/lib/library/recordIdentity";
import "@/styles/birch-thread.css";

import circleFrames from "../../../public/council/circle-236/companions.json";

function Shell({ children }: { children: ReactNode }) {
  return <div className="birch-thread bg-background text-foreground">
    <Header />
    <nav className="birch-threshold pt-24" aria-label="Council orientation"><Link to={ROUTES.COUNCIL}>Return to Council</Link><Link to={ROUTES.S33D}>Return to the Tree</Link></nav>
    <main className="birch-paper">{children}</main>
    <Footer />
  </div>;
}

export function BirchPreparationPage() {
  useDocumentTitle("Circle 236 · Open");
  const { circleNumber } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate(), location = useLocation();
  const mode = params.get("mode") === "spatial" ? "spatial" : "2d";
  const appearance = useMemo(() => birchAppearance(mode), [mode]);
  const opening = identityOpening(appearance)!;
  const artworkDialog = useRef<HTMLDialogElement>(null);
  const [viewedArtwork, setViewedArtwork] = useState(circleFrames.companions[0]);
  const viewArtwork = (companion: typeof viewedArtwork) => {
    setViewedArtwork(companion);
    artworkDialog.current?.showModal();
  };
  const open = () => {
    navigate({ pathname: location.pathname, search: `?mode=${mode}&returned=1` }, { replace: true, state: { libraryReturn: appearance.returnContext } });
    navigate({ pathname: THREAD_ROUTES.identity(opening.identity), search: `?${returnContextParams(opening.returnContext)}` });
  };
  useEffect(() => {
    if (params.get("returned") !== "1") return;
    const frame = requestAnimationFrame(() => {
      const focusId = params.get("companion") === "ely-plane-companion" ? "ely-plane-companion" : appearance.id;
      if (focusId === appearance.id && appearance.returnContext.route === "council") restoreAppearanceFocus(appearance.returnContext);
      else document.getElementById(focusId)?.focus({ preventScroll: true });
      document.getElementById(focusId)?.scrollIntoView({ block: "center", behavior: "instant" });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, params, appearance.id, appearance.returnContext]);
  if (circleNumber !== "236") return <Shell><h1>Preparation unavailable</h1><Link to={ROUTES.COUNCIL}>Return to Council</Link></Shell>;
  return <Shell>
    <p className="birch-kicker">Canopy · OPEN</p>
    <h1>Circle 236</h1>
    <p className="birch-lead">Meet this week’s companion constellation.</p>
    <p className="birch-status">The Circle is open. Fires come and go; the Circle remains.</p>
    <Circle236Fire />
    <section aria-labelledby="preparing-companions"><h2 id="preparing-companions">The companions</h2>
      <p>The companions are confirmed; the Circle is open. Birch’s source-linked study and Ely’s researched Ancient Friend folio are available. Other deeper doorways remain in preparation.</p>
    </section>
    <div className="birch-mode" aria-label="Companion view"><Link aria-current={mode === "2d" ? "page" : undefined} to={`${THREAD_ROUTES.circle(236)}?mode=2d`}>Companion frames</Link><Link aria-current={mode === "spatial" ? "page" : undefined} to={`${THREAD_ROUTES.circle(236)}?mode=spatial`}>Enter the spatial Council</Link></div>
    {mode === "spatial" && <iframe className="circle-spatial-room" title="Circle 236 companion frames in the existing Council room" src={`/tetol/circle-235/pre-fire/tetol.html?circle=236#${params.get("returned") === "1" ? "birch-companion" : "croom"}`} />}
    <div className="circle-companion-frames">
      {circleFrames.companions.map(companion => <figure key={companion.id}>
        {companion.reader ? <button id={companion.id} onClick={open} aria-label="Look closer at Birch →"><img src={companion.artwork} alt="Birch · supplied Circle artwork" width="1280" height="853" loading="lazy" /></button> : companion.id === "ely-plane-companion" ? <Link id={companion.id} to="/ancient-friends/ely/folio?from=2d" aria-label="Read Ely Plane’s living folio →"><img src={companion.artwork} alt={`${companion.label} · supplied Circle illustration`} width="1280" height="853" loading="lazy" /></Link> : <button id={companion.id} onClick={() => viewArtwork(companion)} aria-label={`View ${companion.label} artwork`}><img src={companion.artwork} alt={`${companion.label} · supplied Circle artwork`} width="1280" height="853" loading="lazy" /></button>}
        <figcaption><h2>{companion.label}</h2><p>{companion.kind}</p><p className="birch-status">{companion.reader ? "Open the Living Record study →" : companion.id === "ely-plane-companion" ? "Read the source-attributed Ely folio →" : "Artwork available · Living Record not ready"}</p></figcaption>
      </figure>)}
    </div>
    <dialog ref={artworkDialog} className="circle-artwork-dialog" aria-label={`${viewedArtwork.label} artwork`}><button autoFocus onClick={() => artworkDialog.current?.close()}>Return to the companions</button><h2>{viewedArtwork.label}</h2><img src={viewedArtwork.artwork} alt={`${viewedArtwork.label} · supplied Circle artwork`} /><p>Circle artwork · Living Record doorway not ready.</p></dialog>
    <p className="birch-status">Supplied Circle artwork · not documentary photographs or Ancient Friend verification. Knowledge and identity remain in the Living Records.</p>
    <details><summary>The Ely encounter</summary><p>Ed visited the Great London Plane of Ely on 11 October 2026. The trunk could not be reached, and there is a wish to return. Its canonical Atlas identity is still to be confirmed; this page creates no tree record or Ancient Friend recognition.</p><p>No private encounter notes or photographs are published here.</p></details>
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
