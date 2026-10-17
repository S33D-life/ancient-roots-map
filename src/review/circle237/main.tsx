import React, { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { appearance, identities, introductions, isPilotKey, PILOT_REVIEW_DATE, pilotHref, pilotState, returnHref, roster, type CompanionKey } from './registry';
import { invitation, publicationBlockers } from './invitation';
import './pilot.css';
const SpatialCouncil = lazy(() => import('./SpatialCouncil').then(module => ({default:module.SpatialCouncil})));
class SpatialBoundary extends React.Component<{children:React.ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<p role="status">The spatial view could not load. All ten named companion doorways remain available below.</p>:this.props.children;}
}

function Pilot() {
  const [search, setSearch] = useState(window.location.search);
  const state = pilotState(search);
  const [offline, setOffline] = useState(!navigator.onLine);
  const go = useCallback((href: string) => { window.history.pushState(null, '', href); setSearch(window.location.search); window.scrollTo(0,0); }, []);
  const open = useCallback((key: CompanionKey) => { go(pilotHref(pilotState(window.location.search).mode,'encounter',key)); },[go]);
  useEffect(()=>{const pop=()=>setSearch(window.location.search); const net=()=>setOffline(!navigator.onLine); window.addEventListener('popstate',pop); window.addEventListener('online',net); window.addEventListener('offline',net); return()=>{window.removeEventListener('popstate',pop);window.removeEventListener('online',net);window.removeEventListener('offline',net);};},[]);
  useEffect(()=>{
    const el = state.view === 'council' && state.returned ? document.getElementById(`${state.returned}-companion`) : document.querySelector('h1');
    if (el instanceof HTMLElement) el.focus({ preventScroll: false });
  }, [search, state.returned, state.view]);
  const key=state.key;
  const identity=key&&isPilotKey(key)?identities[key]:null;
  const item=roster.find(v=>v.key===key);
  function link(href: string, text: string) { return <a href={href} onClick={e=>{e.preventDefault();go(href);}}>{text}</a>; }
  return <main>
    <aside className="review">PRIVATE LOCAL PILOT · Circle 237 publication HOLD · No sign-in, saving or live data</aside>
    <header><p className="eyebrow">Council of Life · 237 / yOur Blooming Week</p>
      <h1 tabIndex={-1}>{state.view==='invitation'?invitation.title:state.view==='council' ? 'Companions, connected' : `${item?.name} · ${state.view==='record'?'Living Library':state.view==='harvest'?'Future Heartwood':state.view==='twin'?'Spatial twin reference':'Council appearance'}`}</h1>
      <p>{state.view==='council'?'Ten proposed companions. Noku returns; new threads gather around her. Introductions and portraits await editorial approval.':'A weekly doorway into a continuing living thread.'}</p>
    </header>
    {offline&&<p role="status">Offline · this already-loaded local study remains readable. Remote records are not fetched or verified.</p>}
    {state.view==='council' ? <>
      <nav aria-label="Council mode">{link(pilotHref('2d'),'2D Council')}{link(pilotHref('spatial'),'3D TETOL study')}</nav>
      {link(pilotHref(state.mode,'invitation'),'Read the draft invitation')}
      {state.mode==='spatial'&&<SpatialBoundary><Suspense fallback={<p role="status">Preparing the spatial study…</p>}><SpatialCouncil open={open}/></Suspense></SpatialBoundary>}
      <section className="gallery" aria-label="Ten companion constellation">{roster.map(c=><article className="portrait" key={c.key}>
        <p className="eyebrow">{c.category}</p><h2>{c.name}</h2><p className="fallback">Portrait pending intake</p>
        <p className="plaque">{c.plaque}</p>
        <p>{introductions[c.key as CompanionKey]}</p>
        <button id={c.appearanceId} onClick={()=>open(c.key as CompanionKey)}>Meet {c.name}</button>
        <small>Hawthorn live-edge frame specification · exact artwork and engraved lettering awaiting file review</small>
      </article>)}</section>
    </> : state.view==='invitation'?<section aria-label="Invitation editorial review">
      <p className="eyebrow">Draft for Ed’s approval · not ready to send</p>
      <p>{invitation.copy}</p>
      <h2>Proposed central question</h2><p>{invitation.proposedQuestion}</p><p>Awaiting Ed’s approval. No approved question has been assigned.</p>
      <h2>Opening Fire</h2><dl><dt>Date</dt><dd>Awaiting confirmation</dd><dt>UK time</dt><dd>Awaiting confirmation</dd><dt>Joining doorway</dt><dd>Awaiting confirmation</dd></dl>
      <p>No Circle 236 question, Fire date or joining link has been carried forward.</p>
      <details><summary>Publication checklist</summary><ul>{publicationBlockers().map(reason=><li key={reason}>{reason}</li>)}</ul></details>
      {link(pilotHref(state.mode),'Return to Circle 237')}
    </section>:key&&item ? <>
      <nav aria-label="Return">{link(returnHref(key,state.mode),`Return to Circle 237 · ${item.name}`)}</nav>
      {state.view==='encounter'&&<section>
        <p className="eyebrow">{item.category} · Circle appearance, not a new identity</p>
        <h2>{item.name}</h2><p>{item.plaque}</p><p>Artwork pending intake. No image has been generated or substituted.</p>
        <p>{introductions[key]}</p>
        <p>Portal proposal recorded <time dateTime={PILOT_REVIEW_DATE}>16 October 2026</time>. Council encounter / gathering date unconfirmed; no physical visit or Fire is asserted.</p>
        <p>{key==='noku'?'Noku is the Cape Town individual remembered in Circle 234 and selected to return in 237. She is distinct from the Camp Unicorn fig.':key==='fly-agaric'?'This is a provisional Council 237 appearance of the existing Fly Agaric Library subject, not a recorded mushroom sighting.':'This is a proposed Council appearance. Its enduring record binding is not yet verified; no new canonical identity is created.'}</p>
        {isPilotKey(key)?link(pilotHref(state.mode,'record',key),'Open enduring Library identity'):<p className="muted">Living Library connection awaiting record reconciliation.</p>}
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
          {link(pilotHref(state.mode,'twin',key),'Explore the experimental twin reference')}
        </>:<>
          <h2>Fly Agaric · continuing Library thread</h2><p>Existing Planetary Library subject preserved. Canonical taxonomy-index binding remains unresolved.</p>
          <p>Circle 235 appearance is source-recorded; the Weekly Harvest describes a longer 2018–2026 thread whose individual historical items still require reconciliation.</p>
          <p className="warning">Meet with care; never eat. Medicinal, toxicity, preparation and cultural claims in working sources require scientific and editorial review before public reuse. No preparation instructions are reproduced.</p>
          <p>This local view uses the existing Library reference. It does not open a private Notion page or create a new species record.</p>
        </>}
        {link(pilotHref(state.mode,'harvest',key),'Future Heartwood harvest pathway')}
      </section>}
      {state.view==='twin'&&<section><h2>Nokuphila Twin 0.1</h2><p>Existing experimental spatial interpretation · not surveyed field geometry, not proof of an encounter, and not the proposed Ubuntu Pod.</p><p>Guardian and image permission review remains open. This pilot does not embed or load the external artifact.</p>{link(pilotHref(state.mode,'record',key),'Return to Noku’s enduring identity')}</section>}
      {state.view==='harvest'&&<section><h2>Remember what is ready</h2><p>Future reviewed Heartwood pathway · not yet connected. Nothing is saved or published.</p><p>A harvest will reference approved knowledge and permissioned contributions without copying private memories or changing their visibility.</p>{link(pilotHref(state.mode,'record',key),'Return to enduring identity')}</section>}
      <p className="muted">Council appearance: {isPilotKey(key)?appearance(key,state.mode).id:item.appearanceId} · mode: {state.mode}</p>
    </> : null}
    <footer>Local review only · existing Councils, Library records and experimental artifacts remain unchanged.</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<Pilot/>);
