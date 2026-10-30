import manifest from '../../../public/council/circle-238/companions.json';
export const companions = manifest.companions;
export const edition = manifest.edition;
export const question = manifest.question;
export const kinds = ['Song','Story','Photograph','Voice','Message','Poem'] as const;
export type Kind = typeof kinds[number] | 'Future companion' | 'Link existing offering';
export type Audience = 'private' | 'circle-proposal';
export type Companion = typeof companions[number];
export const selectedCompanion = (key: string | null) => companions.find(c => c.key === key);
export const deckUrl = (c?: Companion) => `/tetol/circle-235/pre-fire/tetol.html?circle=238#${c?.id ?? 'croom'}`;
export const sourceOffering = { id:'fixture:offering:oak-story', title:'A quiet moment beneath an oak', author:'Demo Wanderer', visibility:'private' } as const;
export const songs = ['A canopy hum — demo melody','Rain on leaves — demo rhythm','Morning chorus — demo composition'];
export const photograph = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="720" height="540" viewBox="0 0 720 540"><rect width="720" height="540" fill="#e4dcc1"/><circle cx="360" cy="220" r="135" fill="#507557"/><path d="M360 220v250M360 330l-75-65M360 300l70-75" stroke="#694f34" stroke-width="22" fill="none"/><text x="360" y="515" text-anchor="middle" font-size="24" fill="#243c30">Synthetic image example · no photograph uploaded</text></svg>');
export function voiceSample() {
 const rate=8000,n=4000,b=new ArrayBuffer(44+n*2),v=new DataView(b);
 const text=(offset:number,s:string)=>[...s].forEach((c,i)=>v.setUint8(offset+i,c.charCodeAt(0)));
 text(0,'RIFF');v.setUint32(4,36+n*2,true);text(8,'WAVE');text(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);text(36,'data');v.setUint32(40,n*2,true);
 for(let i=0;i<n;i++)v.setInt16(44+i*2,Math.sin(i*2*Math.PI*220/rate)*2000*Math.sin(i*Math.PI/n),true);
 return new Blob([b],{type:'audio/wav'});
}
export function demoReceipt(c: Companion, kind: Kind, audience: Audience, text: string, attribution: string) {
 return {circle:238,edition,companionKey:c.key,kind,audience,attribution,...(kind==='Link existing offering'?{sourceOfferingId:sourceOffering.id}:{text}),status:'demo-only' as const};
}

export const invitation = {question:'What would you like to offer this companion?',hint:'It stays with you unless you choose to share it for review.'};

// Existing approved kinds, not a new taxonomy or canonical submission model.
export const recommendationCategories = [...new Set(companions.map(c => c.kind))];
export const offeringActionLabel = (audience: Audience) => audience === 'private' ? 'Keep this private (demo)' : 'Propose for curator review (demo)';
