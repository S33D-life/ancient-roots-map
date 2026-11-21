/** Published selection is explicit, never inferred from the clock or folder name. */
export function publishedEdition(tree) {
  const n=tree?.current;
  const current=tree?.editions?.filter(e=>/^CURRENT(?:\s*\/\s*OPEN)?$/.test(e.state));
  if(!Number.isInteger(n)||n<1||current?.length!==1||current[0].number!==n) throw new Error('Published Council selector unavailable');
  const edition=current[0];
  if(typeof edition.canopy!=='string'||!edition.canopy.startsWith('/')||edition.canopy.startsWith('//')) throw new Error('Invalid Council destination');
  return edition;
}
export function selectedEdition(query,tree){
  if(query!==null){if(!/^\d+$/.test(query)||!tree.editions.some(e=>e.number===Number(query))) throw new Error('Historical Circle unavailable');return Number(query);}
  return publishedEdition(tree).number;
}
