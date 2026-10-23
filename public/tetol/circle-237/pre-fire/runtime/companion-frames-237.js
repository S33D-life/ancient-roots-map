/** Circle 237 inside the original immersive TETOL Tree (not the isolated frame-gallery experiment).
 *  The original Circle 235 directory remains immutable and visitable as history.
 *  The 10 scene-only crops are read from the same approved 2D release manifest's exported static roster.
 */
const EXPECTED = 237;
const CIRCLE_URL = '/council/circle-237/companions.json';
const QUESTION = "What is life teaching us through the beings we encounter?";
export async function installCompanionFrames(D) {
  const response = await fetch(CIRCLE_URL, {cache:'no-store'});
  if (!response.ok) throw new Error('Circle 237 Council companion roster unavailable');
  const circle = await response.json();
  if (circle.number !== EXPECTED || circle.status !== 'OPEN' || circle.companions.length !== 10 || circle.question !== QUESTION)
    throw new Error('Circle 237 edition/roster does not match this versioned TETOL Tree');
  const base = D.nodes.yewc233;
  D.nodes.c237 = { ...D.nodes.c233, name:'Circle 237', sub:'OPEN · yOur Blooming Week · no fixed Fire', circle:237, parent:'croom', status:'LIVE', stateShort:'OPEN', lives:[], actions:[], relations:[], question:QUESTION, purpose:'What is life teaching us through the beings we encounter? The Circle remains open for visits all week.' };
  D.council.circles[237] = { node:'c237', number:237, status:'open', companions:circle.companions.map((c,i) => {
    D.nodes[c.id] = { ...base, name:c.label, sub:c.kind+' · Circle 237', circle:237, parent:'croom', status:'LIVE', statusNote:'Approved generated scene illustration, not documentary evidence or an attendance record', stateShort:'OPEN', part:c.kind+' · Circle 237', practical:c.accuracyNote || 'This is a living invitation to notice and learn, not field evidence.', purpose:'Meet this companion in the open weekly Council and follow the thread into life.', lives:[], actions:[], relations:[{to:'croom',dim:'place',text:'Return to Circle 237'}], sources:['S33D Circle 237 scene-only illustration, curator approved 23 October 2026'], location:'A hanging portrait and encounter in the established Canopy Council room.' };
    return {id:c.id,kind:c.kind,seat:Math.PI/2+i*2*Math.PI/10,repr:{form:'circleFrame',artwork:c.artwork,width:c.width,height:c.height}};
  })};
  D.council.active = 237;
  D.council.current = 'c237';
  D.councilPresent = {number:237,state:'OPEN'};
  D.nodes.croom.name = 'The Council Deck · Circle 237';
  D.nodes.croom.sub = 'Circle 237 · OPEN · ten companions';
  D.nodes.croom.question = QUESTION;
  D.nodes.croom.purpose = QUESTION + ' No scheduled live Fire is asserted this week.';
  D.nodes.croom.relations = circle.companions.map(c=>({to:c.id,dim:'place',text:c.label}));
  D.circleFrameCompanions = circle.companions;
  const style = document.createElement('style');
  style.textContent = 'body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}#tetol-welcome{display:none!important}#council-return{left:16px!important;right:auto!important;bottom:16px!important;max-width:calc(100vw - 32px)}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}' + (window.parent!==window?'#council-return{display:none!important}':'');
  document.head.append(style);
  window.addEventListener('click',e=>{const panel=e.target instanceof Element&&e.target.closest('#panel.peek');if(panel&&e.target.closest('button,a'))panel.classList.remove('peek');},true);
  document.title = 'TETOL · Circle 237 · OPEN Council of Life';
  const brand=document.getElementById('brandline');
  if(brand){const label='TETOL · Circle 237 · OPEN · ten companions';brand.textContent=label;new MutationObserver(()=>{if(brand.textContent!==label)brand.textContent=label;}).observe(brand,{childList:true});}
  const ret=document.getElementById('council-return');
  if(ret){ret.href='/council-of-life?from=spatial-council#next-gathering';ret.target='_top';ret.textContent='Return to Circle 237';}
  return circle;
}
export function companionPanel(D,id,esc) {
  const items=D.circleFrameCompanions||[];
  const c=items.find(c=>c.id===id);
  if(!c && id!=='croom' && id!=='c237') return null;
  const link=(id,label)=>'<button type="button" class="act" data-go="'+id+'">'+esc(label)+'</button>';
  return '<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore Council 237"><i></i></button><div class="pbody"><p class="eyebrow">Circle 237 · Open Council</p><h2 class="pname">'+(c?esc(c.label):'yOur Blooming Week')+'</h2><p class="psub">'+esc(QUESTION)+'</p>'
    +(c?'<img data-circle-artwork="'+c.id+'" src="'+c.artwork+'" alt="'+esc(c.label)+' — illustrated companion" style="width:100%;height:auto;border-radius:8px"><p>'+esc(c.kind)+' · Artistic interpretation, not field evidence.</p>'+(c.accuracyNote?'<p>'+esc(c.accuracyNote)+'</p>':'')+link('croom','Return to the Council fire'):items.map(c=>link(c.id,c.label)).join(''))
    +'<a class="act" target="_top" href="/council/237">Visit the 2D Circle 237 →</a><a class="act" target="_top" href="/council-of-life">Return to the Canopy →</a><a class="act" href="https://t.me/s33dlife" target="_blank" rel="noopener noreferrer">Council community · Telegram (not a Fire room)</a></div>';
}
// Hanging scene portraits are the companion representations in this edition.
// Earlier Circle-specific symbolic presences are preserved in historical editions.
export function buildCompanionPresence(){return null;}
