import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { TETOL_PAGE } from '@/lib/tetolStaffRoom';
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
    <aside className="review">CIRCLE 237 · OPEN COUNCIL · Explore freely · Offerings are not collected on this page yet</aside>
    {basePath !== PILOT_PATH && <nav aria-label="Council navigation"><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link><Link to={ROUTES.HOME}>TETOL</Link></nav>}
    <header><p className="eyebrow">Council of Life · 237 / yOur Blooming Week</p>
      <h1 tabIndex={-1}>{state.view==='invitation'?invitation.title:state.view==='council' ? 'Companions, connected' : `${item?.name} · ${state.view==='record'?'Living Library':state.view==='harvest'?'Future Heartwood':state.view==='twin'?'Spatial twin reference':'Council appearance'}`}</h1>
      <p>{state.view==='council'?'Ten companions and ten illustrated scenes. Noku returns; new threads gather around her. Visit freely, without a fixed Fire time this week.':'A weekly doorway into a continuing living thread.'}</p>
    </header>
    {offline&&<p role="status">Offline · this already-loaded local study remains readable. Remote records are not fetched or verified.</p>}
    {state.view==='council' ? <>
      <nav aria-label="Council mode">{link(href('2d'),'2D Council')}<a href="/tetol/circle-237/pre-fire/tetol.html#croom">3D TETOL · Circle 237 Canopy</a><a href={`${TETOL_PAGE}#croom`}>Historical TETOL · Circle 235</a>{link(href('spatial'),'Experimental frame study')}</nav>
      {invitation.approved && link(href(state.mode,'invitation'),'Read the Council invitation')}
      {state.mode==='spatial'&&<p className="review">This simple 3D frame gallery is an experimental companion study, not the original TETOL Canopy or Council Deck.</p>}
{state.mode==='spatial'&&<SpatialBoundary><Suspense fallback={<p role="status">Preparing the spatial study…</p>}><SpatialCouncil open={open}/></Suspense></SpatialBoundary>}
      <section className="gallery" aria-label="Ten companion constellation">{roster.map(c=><article className="portrait" key={c.key}>
        <p className="eyebrow">{c.category}</p><h2>{c.name}</h2>{c.artwork ? <img className="companion-scene" src={c.artwork} width={c.artworkWidth} height={c.artworkHeight} loading="lazy" alt={`${c.name} · curated Council illustration, not field evidence`} /> : <p className="fallback">Portrait withheld pending clearance</p>}
        <p className="plaque">{c.plaque}</p>
        {c.key==='sunflower' && <p className="muted">Illustrative sunflower scene — not a botanically exact depiction of the double-flowered Teddy Bear cultivar.</p>}
        {c.key==='faraway-tree' && <p className="muted">Independent imaginative tree-house illustration; not official book-cover artwork.</p>}
        <p>{introductions[c.key as CompanionKey]}</p>
        <button id={c.appearanceId} onClick={()=>open(c.key as CompanionKey)}>Meet {c.name}</button>
        <small>Hawthorn frame family · scene-only illustration; original text panels withheld</small>
      </article>)}</section>
    </> : state.view==='invitation'?<section aria-label="Invitation editorial review">
      <p className="eyebrow">Invitation preview · not yet sent to Telegram</p>
      <p>{invitation.copy}</p>
      <h2>Our Council question</h2><p>{invitation.approvedQuestion}</p><p>We will share the illustrated PDF and Telegram invitation after reviewing the open Council.</p>
      <h2>Come as you are</h2><p>Circle 237 is open to explore at any time this week. No live Fire gathering is scheduled.</p><p><a href={invitation.communityLink} rel="noopener noreferrer">Council community · Telegram</a></p><p>Telegram is our Council community, not a direct live Fire-room link.</p>
      <p>This week's gathering does not need a meeting time. You are welcome to listen, discover and return.</p>
      <details><summary>Publication checklist</summary><ul>{publicationBlockers().map(reason=><li key={reason}>{reason}</li>)}</ul></details>
      {link(href(state.mode),'Return to Circle 237')}
    </section>:key&&item ? <>
      <nav aria-label="Return">{link(returnHref(key,state.mode,basePath),`Return to Circle 237 · ${item.name}`)}</nav>
      {state.view==='encounter'&&<section>
        <p className="eyebrow">{item.category} · Circle appearance, not a new identity</p>
        <h2>{item.name}</h2><p>{item.plaque}</p><p>These approved scene illustrations are artistic interpretations, not photographic or field evidence. The Sunflower scene is illustrative rather than a botanically exact Teddy Bear cultivar.</p>
        <p>{introductions[key]}</p>
        <p>Companion doorway first prepared <time dateTime={PILOT_REVIEW_DATE}>16 October 2026</time>. Circle 237 is open for exploration; no completed encounter or physical visit is asserted.</p>
        <p>{key==='noku'?'Noku is the Cape Town individual remembered in Circle 234 and selected to return in 237. She is distinct from the Camp Unicorn fig.':key==='fly-agaric'?'This is a provisional Council 237 appearance of the existing Fly Agaric Library subject, not a recorded mushroom sighting.':'This Council appearance is now open to explore. Its enduring record binding is not yet verified; no new canonical identity is created.'}</p>
        {isPilotKey(key)?link(href(state.mode,'record',key),'Open enduring Library identity'):<p className="muted">Living Library connection awaiting record reconciliation.</p>}
      </section>}
      {state.view==='record'&&identity&&<section>
        <p className="eyebrow">Enduring identity · curated local read projection</p>
        <p className="identifier">{identity.source}:{identity.id}</p>
        {key==='noku'?<>
          <h2>One Cape Town Ancient Friend</h2><p>The existing Atlas identity is retained. Live availability is not checked in this pilot; no record is created.</p>
          <p>Circle 234: remembered appearance. Circle 237: an open return. Original Circle 234 history remains unchanged.</p>
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
    <footer>Circle 237 · a living weekly doorway · past Councils and Library records remain preserved.</footer>
  </main>;
}
