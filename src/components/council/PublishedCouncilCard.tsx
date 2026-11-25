import { publishedEdition } from '../../../public/council/published-selector.js';
interface Catalogue {number:number;question?:string;fire:unknown}
export default function PublishedCouncilCard({tree,catalogues}:{tree:unknown;catalogues:Record<string,Catalogue>}){
 try {
  const edition=publishedEdition(tree);const circle=Object.values(catalogues).find(c=>c.number===edition.number);
  if(!circle) throw new Error('Catalogue missing');
  return <section id="next-gathering" className="canopy-field-note" aria-label="Current Circle"><p className="parchment-kicker">{edition.state}</p><h2>Circle {circle.number}</h2><p>{circle.question}</p><p>{circle.fire ? 'See the Council edition for Fire details.' : 'No Fire is scheduled.'}</p><a className="parchment-action" href={edition.canopy}>Enter Circle {circle.number} · meet its companions →</a><a className="parchment-action" href={`/tetol/circle-235/pre-fire/tetol.html?circle=${circle.number}#croom`}>Enter Circle {circle.number} in the original 3D TETOL Council Deck →</a></section>;
 }catch{return <section aria-label="Current Circle"><p role="alert">Current Council unavailable. Historical Circles remain accessible below.</p></section>;}
}
