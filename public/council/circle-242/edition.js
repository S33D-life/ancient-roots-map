export const root='/council/circle-242/';
export function reviewHost(where=location) {return ['127.0.0.1','localhost','[::1]'].includes(where.hostname);}
export function validateEdition(data, where=location) {
  if(data?.number!==242 || data.fire!==null || data.companions?.length!==10) throw new Error('Circle 242 manifest unavailable');
  if(data.publicationApproved!==true && !(reviewHost(where) && data.status==='PRIVATE_REVIEW' && data.assetsReady===true)) throw new Error('Circle 242 is awaiting release approval');
  for(const [index,item] of data.companions.entries()) {
    if(item.order!==index+1 || item.id!=='c242-'+item.key || item.artwork!==root+item.key+'-front.webp' || item.reverse?.artwork!==root+item.key+'.webp' || !item.reverse.readableText?.trim()) throw new Error('Circle 242 pair unavailable');
  }
  return data;
}
export async function loadEdition() {const r=await fetch(root+'catalogue.json',{cache:'no-store'});if(!r.ok)throw new Error('Circle 242 unavailable');return validateEdition(await r.json());}
