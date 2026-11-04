/** Circle239 fronts in the original TETOL. No reverse folios, new renderer or writes. */
const QUESTION = 'What remains alive when everything appears to be sleeping?';
const KEYS = ['defynnog-yew','european-beech','ginger','sycamore-helicopter-seed','ginkgo-leaf','dahlia','rosehip','fly-agaric','slender-billed-northern-nutcracker','the-secret-garden'];
export async function installCompanionFrames(D) {
  const response = await fetch('/council/circle-239/companions.json', {cache:'no-store'});
  if (!response.ok) throw new Error('Circle 239 companion manifest unavailable');
  const circle = await response.json();
  if (circle.number !== 239 || circle.status !== 'OPEN' || circle.question !== QUESTION || circle.fire !== null ||
      circle.companions?.length !== 10 || circle.companions.some((c,i) => c.key !== KEYS[i] || c.id !== 'c239-'+c.key ||
        !c.artwork.startsWith('/council/circle-239/portraits/') || !/^[a-f0-9]{64}$/.test(c.sha256) || c.width !== 1536 || c.height !== 1024))
    throw new Error('Circle 239 edition does not match its reviewed front manifest');
  D.nodes.c239 = {...D.nodes.c233, name:'Circle 239', sub:circle.title, circle:239, parent:'croom', status:'LIVE', stateShort:'OPEN', lives:[],actions:[],relations:[],question:QUESTION,purpose:QUESTION};
  D.council.circles[239] = {node:'c239',number:239,status:'open',companions:circle.companions.map((c,i) => {
    D.nodes[c.id] = {...D.nodes.yewc233,name:c.label,sub:c.kind+' · '+c.essence,circle:239,parent:'croom',status:'LIVE',stateShort:'OPEN',
      statusNote:c.accuracyNote,part:c.kind,purpose:c.essence,practical:c.accuracyNote,lives:[],actions:[],relations:[{to:'croom',dim:'place',text:'Return to Circle 239'}],
      sources:['Owner-selected generated front portrait, 4 November 2026; publication review pending'],location:'A hanging portrait in the original Council Deck.'};
    return {id:c.id,kind:c.kind,seat:Math.PI/2+i*2*Math.PI/10,repr:{form:'circleFrame',artwork:c.artwork,width:c.width,height:c.height,frameFamily:'beech'}};
  })};
  D.council.active = 239; D.council.current = 'c239'; D.councilPresent = {number:239,state:'OPEN'};
  Object.assign(D.nodes.croom,{name:'The Council Deck · Circle 239',sub:circle.title,question:QUESTION,purpose:QUESTION+' Open all week; no scheduled Fire.',relations:circle.companions.map(c=>({to:c.id,dim:'place',text:c.label}))});
  D.circleFrameCompanions = circle.companions;
  // Edition-specific presentation only: the old hearth must not announce a239 session.
  if (D.nodes.live_fire) Object.assign(D.nodes.live_fire,{name:'The Fire · Circle 239',sub:'No scheduled Fire',stateShort:'UNSCHEDULED',question:QUESTION,purpose:'No live Fire is scheduled for this Circle.',practical:'Explore the companions in your own time. No attendance or offerings are recorded here.',lives:[],actions:[],where:[],relations:[{to:'croom',dim:'place',text:'Return to Circle 239'}]});
  // Reuse the established shared sheet and #grab gesture ownership.
  const style = document.createElement('style');
  style.textContent = 'body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}#tetol-welcome{display:none!important}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}';
  if (window.parent !== window) style.textContent += '#council-return{display:none!important}';
  document.head.append(style);
  return circle;
}
export function companionPanel(D,id,esc) {
  const items = D.circleFrameCompanions || [], c = items.find(c=>c.id===id);
  if (!c && id !== 'croom' && id !== 'c239') return null;
  const link = (id,label) => '<button type="button" class="act" data-go="'+id+'">'+esc(label)+'</button>';
  return '<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore Circle 239"><i></i></button><div class="pbody"><p class="eyebrow">StarPod Circle 239 · '+esc(D.councilPresent.state)+'</p><h2 class="pname">'+(c?esc(c.label):'The Council of Life · yOur Blooming Week')+'</h2><p class="psub">'+esc(QUESTION)+'</p>'
    +(c?'<p>'+esc(c.kind)+' · '+esc(c.essence)+'</p><img data-circle-artwork="'+c.id+'" src="'+c.artwork+'" alt="'+esc(c.alt)+'" style="width:100%;height:auto;border-radius:8px"><p>'+esc(c.accuracyNote)+'</p>'+(c.safetyNote?'<p>'+esc(c.safetyNote)+'</p>':'')+link('croom','Return to the Council Deck'):items.map(c=>link(c.id,c.label)).join(''))+'<p>Open all week · no scheduled Fire. No offerings or attendance are collected here.</p><a class="act" target="_top" href="/council/239'+(c?'?companion='+c.key:'')+'">Visit the 2D Circle 239 →</a><a class="act" target="_top" href="/council-of-life">Return to the Canopy →</a></div>';
}
export function buildCompanionPresence(){return null;}
