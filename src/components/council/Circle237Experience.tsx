import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { appearance, identities, introductions, isPilotKey, PILOT_PATH, PILOT_REVIEW_DATE, pilotHref, pilotState, returnHref, roster, type CompanionKey } from '@/review/circle237/registry';
import { invitation, publicationBlockers } from '@/review/circle237/invitation';
import '@/review/circle237/pilot.css';
const SpatialCouncil = lazy(() => import('@/review/circle237/SpatialCouncil').then(module => ({default:module.SpatialCouncil})));
class SpatialBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="status">The spatial view could not load. All ten named companion doorways remain available below.</p>:this.props.children;}
}

export default function Circle237Experience({ basePath = PILOT_PATH }: { basePath?: string }) {
  const { search } = useLocation();
  const navigate = useNavigate();
  const href = useCallback((mode: '2d' | 'spatial', view = 'council', key?: CompanionKey) => pilotHref(mode, view, key, basePath), [basePath]);
  const state = pilotState(search, basePath === PILOT_PATH ? 'view' : 'c237view');
  const [offline, setOffline] = useState(!navigator.onLine);
  const go = useCallback((destination: string) => { navigate(destination); window.scrollTo(0,0); }, [navigate]);
  const open = useCallback((key: CompanionKey) => { go(href(state.mode,'encounter',key)); },[go, href, state.mode]);
  useEffect(()=>{const net=()=>setOffline(!navigator.onLine); window.addEventListener('online',net); window.addEventListener('offline',net); return()=>{window.removeEventListener('online',net);window.removeEventListener('offline',net);};},[]);
  useEffect(()=>{
    const el = state.view === 'council' && state.returned ? document.getElementById(`${state.returned}-companion`) : document.querySelector('h1');
    if (el instanceof HTMLElement) el.focus({ preventScroll: false });
  }, [search, state.returned, state.view]);
  const key=state.key;
  const identity=key&&isPilotKey(key)?identities[key]:null;
  const item=roster.find(v=>v.key===key);
  function link(href: string, text: string) { return <a href={href} onClick={e=>{e.preventDefault();go(href);}}>{text}</a>; }
  return <main className="circle237">
    <aside className="review">CIRCLE 237 · EDITORIAL DRAFT · Publication HOLD · No contributions are saved here</aside>
    {basePath !== PILOT_PATH && <nav aria-label="Council navigation"><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link><Link to={ROUTES.HOME}>TETOL</Link></nav>}
    <header><p className="eyebrow">Council of Life · 237 / yOur Blooming Week</p>
      <h1 tabIndex={-1}>{state.view==='invitation'?invitation.title:state.view==='council' ? 'Companions, connected' : `${item?.name} · ${state.view==='record'?'Living Library':state.view==='harvest'?'Future Heartwood':state.view==='twin'?'Spatial twin reference':'Council appearance'}`}</h1>
      <p>{state.view==='council'?'Ten companions. Noku returns; new threads gather around her. Seven cleared scenes are available; three images remain withheld. Publication review continues.':'A weekly doorway into a continuing living thread.'}</p>
    </header>
    {offline&&<p role="status">Offline · this already-loaded local study remains readable. Remote records are not fetched or verified.</p>}
    {state.view==='council' ? <>
      <nav aria-label="Council mode">{link(href('2d'),'2D Council')}{link(href('spatial'),'3D TETOL study')}</nav>
      {link(href(state.mode,'invitation'),'Read the draft invitation')}
      {state.mode==='spatial'&&<SpatialBoundary><Suspense fallback={<p role="status">Preparing the spatial study…</p>}><SpatialCouncil open={open}/></Suspense></SpatialBoundary>}
      <section className="gallery" aria-label="Ten companion constellation">{roster.map(c=><article className="portrait" key={c.key}>
        <p className="eyebrow">{c.category}</p><h2>{c.name}</h2>{c.artwork ? <img className="companion-scene" src={c.artwork} width={1024} height={645} loading="lazy" alt={`${c.name} · curated Council illustration, not field evidence`} /> : <p className="fallback">Portrait withheld pending clearance</p>}
        <p className="plaque">{c.plaque}</p>
        <p>{introductions[c.key as CompanionKey]}</p>
        <button id={c.appearanceId} onClick={()=>open(c.key as CompanionKey)}>Meet {c.name}</button>
        <small>Hawthorn frame family · scene-only illustration; original text panels withheld</small>
      </article>)}</section>
    </> : state.view==='invitation'?<section aria-label="Invitation editorial review">
      <p className="eyebrow">Draft · publication HOLD · not ready to send</p>
      <p>{invitation.copy}</p>
      <h2>Central question · approved 23 October 2026</h2><p>{invitation.approvedQuestion}</p><p>Publication review is still required before this invitation can be shared.</p>
      <h2>Opening Fire</h2><p><time dateTime="2026-10-23T15:30:00+01:00">Friday 23 October 2026 · {invitation.openingFireTimeUK}</time></p><p><a href={invitation.communityLink} rel="noopener noreferrer">Council community · Telegram</a></p><p>The community link is not a verified direct Fire-room URL.</p>
      <p>No Circle 236 question, Fire date or joining link has been carried forward.</p>
      <details><summary>Publication checklist</summary><ul>{publicationBlockers().map(reason=><li key={reason}>{reason}</li>)}</ul></details>
      {link(href(state.mode),'Return to Circle 237')}
    </section>:key&&item ? <>
      <nav aria-label="Return">{link(returnHref(key,state.mode,basePath),`Return to Circle 237 · ${item.name}`)}</nav>
      {state.view==='encounter'&&<section>
        <p className="eyebrow">{item.category} · Circle appearance, not a new identity</p>
        <h2>{item.name}</h2><p>{item.plaque}</p><p>Scene-only artwork is shown where cleared. Unresolved images remain withheld.</p>
        <p>{introductions[key]}</p>
        <p>Portal proposal recorded <time dateTime={PILOT_REVIEW_DATE}>16 October 2026</time>. Opening Fire scheduled for 23 October 2026 at 15:30 UK (BST); no completed encounter or physical visit is asserted.</p>
        <p>{key==='noku'?'Noku is the Cape Town individual remembered in Circle 234 and selected to return in 237. She is distinct from the Camp Unicorn fig.':key==='fly-agaric'?'This is a provisional Council 237 appearance of the existing Fly Agaric Library subject, not a recorded mushroom sighting.':'This is a proposed Council appearance. Its enduring record binding is not yet verified; no new canonical identity is created.'}</p>
        {isPilotKey(key)?link(href(state.mode,'record',key),'Open enduring Library identity'):<p className="muted">Living Library connection awaiting record reconciliation.</p>}
      </section>}
      {state.view==='record'&&identity&&<section>
        <p className="eyebrow">Enduring identity · curated local read projection</p>
        <p className="identifier">{identity.source}:{identity.id}</p>
        {key==='noku'?<>
          <h2>One Cape Town Ancient Friend</h2><p>The existing Atlas identity is retained. Live availability is not checked in this pilot; no record is created.</p>
          <p>Circle 234: remembered appearance. Circle 237: proposed return. Original Circle 234 history remains unchanged.</p>
          <p>Guardian-source biography, photographs, cultural accounts and public permissions require reconciliation; no private documents or guardian details are loaded here.</p>
          <p>Ficus natalensis is a source-attributed working identity. The older ledger says “Fig”; this pilot does not silently settle that difference.</p>
          <p className="identifier">Existing Atlas path: /tree/{identities.noku.id} · not fetched here</p>
          {link(href(state.mode,'twin',key),'Explore the experimental twin reference')}
        </>:<>
          <h2>Fly Agaric · continuing Library thread</h2><p>Existing Planetary Library subject preserved. Canonical taxonomy-index binding remains unresolved.</p>
          <p>Circle 235 appearance is source-recorded; the Weekly Harvest describes a longer 2018–2026 thread whose individual historical items still require reconciliation.</p>
          <p className="warning">Meet with care; never eat. Medicinal, toxicity, preparation and cultural claims in working sources require scientific and editorial review before public reuse. No preparation instructions are reproduced.</p>
          <p>This local view uses the existing Library reference. It does not open a private Notion page or create a new species record.</p>
        </>}
        {link(href(state.mode,'harvest',key),'Future Heartwood harvest pathway')}
      </section>}
      {state.view==='twin'&&<section><h2>Nokuphila Twin 0.1</h2><p>Existing experimental spatial interpretation · not surveyed field geometry, not proof of an encounter, and not the proposed Ubuntu Pod.</p><p>Guardian and image permission review remains open. This pilot does not embed or load the external artifact.</p>{link(href(state.mode,'record',key),'Return to Noku’s enduring identity')}</section>}
      {state.view==='harvest'&&<section><h2>Remember what is ready</h2><p>Future reviewed Heartwood pathway · not yet connected. Nothing is saved or published.</p><p>A harvest will reference approved knowledge and permissioned contributions without copying private memories or changing their visibility.</p>{link(href(state.mode,'record',key),'Return to enduring identity')}</section>}
      <p className="muted">Council appearance: {isPilotKey(key)?appearance(key,state.mode).id:item.appearanceId} · mode: {state.mode}</p>
    </> : null}
    <footer>Local review only · existing Councils, Library records and experimental artifacts remain unchanged.</footer>
  </main>;
}
