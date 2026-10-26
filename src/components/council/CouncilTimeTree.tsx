import tree from '../../../public/council/time-tree.json';
import './council-time-tree.css';
const spatial = (number:number) => `/tetol/circle-235/pre-fire/tetol.html?circle=${number}#croom`;
export default function CouncilTimeTree({number=238}:{number?:number}) {
 const i=tree.editions.findIndex(e=>e.number===number), edition=tree.editions[i];
 const previous=tree.editions[i-1], next=tree.editions[i+1];
 return <nav className="council-time-tree" aria-label="Council Time Tree">
  <div>{previous?<a href={previous.canopy}>← Previous Circle</a>:<span aria-disabled="true">← Previous Circle</span>}
   <label>Circle <select aria-label="Choose a Council Circle" value={number} onChange={e=>{const target=tree.editions.find(c=>c.number===Number(e.target.value));if(target)window.location.assign(target.canopy);}}>{tree.editions.map(e=><option key={e.number} value={e.number}>{e.number} · {e.state}</option>)}</select></label>
   {next?<a href={next.canopy}>Next Circle →</a>:<span aria-disabled="true">Next Circle →</span>}</div>
  <p>Circle {number} · {edition?.state} · <a href={spatial(number)}>Original immersive TETOL</a>{number!==tree.current&&<> · <a href="/council/238">Return to current · 238</a></>}</p>
 </nav>;
}
