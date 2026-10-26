import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import manifest from '../../../public/council/circle-238/companions.json';
import { ROUTES } from '@/lib/routes';
import { useDocumentTitle } from '@/hooks/use-document-title';
import '@/review/circle237/pilot.css';
export default function Circle238Page(){
 useDocumentTitle('Council of Life · 238 · Current / Open');
 const [query,setQuery]=useSearchParams();
 const selected=manifest.companions.find(c=>c.key===query.get('companion'));
 useEffect(()=>{const key=query.get('returned');const target=key?document.getElementById(key+'-companion'):document.querySelector('h1');if(target instanceof HTMLElement)target.focus();},[query]);
 const spatial='/tetol/circle-235/pre-fire/tetol.html?circle=238#croom';
 return <main className="circle237">
  <nav aria-label="Council navigation"><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link><Link to={ROUTES.CIRCLE237}>Previous Circle · 237</Link></nav>
  <header><p className="eyebrow">CURRENT / OPEN · Monday 26 October 2026 · Europe/London</p><h1 tabIndex={-1}>Circle 238 · Fig-wood Council</h1><p>Ten companions to notice and learn with. Visit at your own pace.</p><p>Our question and Fire time await approval.</p></header>
  <a href={spatial}>Enter the original immersive TETOL Canopy →</a>
  <p role="status">The ten selected scene illustrations await verified intake and review. These named doorways use honest placeholders.</p>
  {selected?<section aria-label="Companion encounter"><h2 tabIndex={-1}>{selected.label}</h2><p>{selected.kind}</p><p>{selected.accuracyNote}</p><div className="fallback">Scene illustration awaiting verification</div><button onClick={()=>setQuery({returned:selected.key})}>Return to Circle 238</button><a href={spatial.replace('#croom','#'+selected.id)}>Meet this companion in the original TETOL →</a></section>:
  <section className="gallery" aria-label="Ten Council companions">{manifest.companions.map(c=><article className="portrait" key={c.key}><h2>{c.label}</h2><p>{c.kind}</p><div className="fallback">Scene illustration awaiting verification</div><p>{c.accuracyNote}</p><button id={c.id} onClick={()=>setQuery({companion:c.key})}>Meet {c.label}</button></article>)}</section>}
  <footer><p>Illustrations will be artistic interpretations, not documentary field evidence. The illustrated PDF remains in review and has no public link.</p><Link to={ROUTES.COUNCIL}>Return to the Council Canopy</Link></footer>
 </main>;
}
