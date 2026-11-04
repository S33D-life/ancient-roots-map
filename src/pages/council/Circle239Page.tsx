import { createElement, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import CouncilTimeTree from '@/components/council/CouncilTimeTree';
import { useDocumentTitle } from '@/hooks/use-document-title';
import { ROUTES } from '@/lib/routes';
import manifest from '../../../public/council/circle-239/companions.json';
import '@/review/circle237/pilot.css';

const spatial = '/tetol/circle-235/pre-fire/tetol.html?circle=239';

export default function Circle239Page() {
  useDocumentTitle('Council of Life · StarPod Circle 239 · Current / Open');
  const [query, setQuery] = useSearchParams();
  const selected = manifest.companions.find(c => c.key === query.get('companion'));
  const returned = query.get('returned');
  const review = ['127.0.0.1','localhost','[::1]'].includes(location.hostname) && query.get('review239') === '1';
  const navigate = (fields:Record<string,string>) => {const next=new URLSearchParams(query);for(const key of ['companion','returned','side'])next.delete(key);for(const [key,value] of Object.entries(fields))next.set(key,value);setQuery(next);};
  useEffect(() => {
    if(!document.getElementById('living-frames-239')){const script=document.createElement('script');script.id='living-frames-239';script.type='module';script.src='/council/circle-239/living-frame.js';document.head.append(script);}
  }, []);
  useEffect(() => {
    const el=document.querySelector('council-living-frame');
    const turn=(event:Event) => {const detail=(event as CustomEvent).detail;if(selected && detail.key===selected.key)navigate({companion:selected.key,...(detail.side==='reverse'?{side:'reverse'}:{})});};
    el?.addEventListener('council-frame-turn',turn);return()=>el?.removeEventListener('council-frame-turn',turn);
  }, [selected, query]);
  useEffect(() => {
    const target = returned ? document.getElementById('c239-' + returned) : document.querySelector(selected ? '#companion-heading' : 'h1');
    if (target instanceof HTMLElement) target.focus();
  }, [returned, selected?.key]);
  return <main className="circle237">
    <CouncilTimeTree number={239} />
    <nav aria-label="Council navigation"><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link><Link to={ROUTES.CIRCLE238}>Previous Circle · 238</Link></nav>
    <header><p className="eyebrow">CURRENT / OPEN · 2–8 November 2026 · Europe/London</p>
      <h1 tabIndex={-1}>{manifest.title}</h1><p>{manifest.question}</p>
      <p>Ten companions to notice and learn with. Open all week · no scheduled Fire.</p>
    </header>
    <a href={spatial + (review?'&review239=1':'') + '#croom'}>Enter Circle 239 in the original immersive TETOL →</a>
    {selected ? <section aria-label="Companion encounter">
      <h2 id="companion-heading" tabIndex={-1}>{selected.label}</h2><p>{selected.kind} · {selected.essence}</p>
      {createElement('council-living-frame', {'companion-key':selected.key,label:selected.label,front:selected.artwork,'front-alt':selected.alt,side:query.get('side')==='reverse'?'reverse':'front'}, <img className="companion-scene" src={selected.artwork} width={selected.width} height={selected.height} alt={selected.alt} style={{width:'100%',height:'auto'}} />)}
      <p>{selected.accuracyNote}</p>{selected.safetyNote && <p>{selected.safetyNote}</p>}
      <button onClick={() => navigate({returned:selected.key})}>Return to Circle 239</button>
      <a href={spatial + (review?'&review239=1':'') + '#' + selected.id}>Meet this companion in the original TETOL →</a>
    </section> : <section className="gallery" aria-label="Ten Council companions">{manifest.companions.map(c => <article className="portrait" key={c.key}>
      <h2>{c.order} · {c.label}</h2><p>{c.kind} · {c.essence}</p>
      <img className="companion-scene" src={c.artwork} width={c.width} height={c.height} alt={c.alt} loading="lazy" style={{width:'100%',height:'auto'}} />
      <button id={c.id} onClick={() => navigate({companion:c.key})}>Meet {c.label}</button>
    </article>)}</section>}
    <footer><p>These generated illustrations are artistic encounters, not documentary field photographs. This page collects no offerings or attendance.</p><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link></footer>
  </main>;
}
