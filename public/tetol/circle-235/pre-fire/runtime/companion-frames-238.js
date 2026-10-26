/** Circle 238 inside the original immersive TETOL Tree (not the isolated frame-gallery experiment).
 *  The original Circle 235 directory remains immutable and visitable as history.
 *  The 10 scene-only crops are read from the same approved 2D release manifest's exported static roster.
 */
const EXPECTED = 238;
const CIRCLE_URL = '/council/circle-238/companions.json';
const QUESTION = "What is taking root, ripening, or asking to be tended this week?";
const QUESTION_COPY = QUESTION;
export async function installCompanionFrames(D) {
  const response = await fetch(CIRCLE_URL, {cache:'no-store'});
  if (!response.ok) throw new Error('Circle 238 Council companion roster unavailable');
  const circle = await response.json();
  if (circle.number !== EXPECTED || circle.status !== 'OPEN' || circle.companions.length !== 10 || circle.question !== QUESTION)
    throw new Error('Circle 238 edition/roster does not match this versioned TETOL Tree');
  const base = D.nodes.yewc233;
  D.nodes.c238 = { ...D.nodes.c233, name:'Circle 238', sub:'CURRENT / OPEN · Fig-wood Council · no scheduled Fire', circle:238, parent:'croom', status:'LIVE', stateShort:'OPEN', lives:[], actions:[], relations:[], question:QUESTION_COPY, purpose:QUESTION_COPY };
  D.council.circles[238] = { node:'c238', number:238, status:'open', companions:circle.companions.map((c,i) => {
    D.nodes[c.id] = { ...base, name:c.label, sub:c.kind+' · Circle 238', circle:238, parent:'croom', status:'LIVE', statusNote:'Generated illustration, not field evidence or an attendance claim', stateShort:'OPEN', part:c.kind+' · Circle 238', practical:c.accuracyNote || 'This is a living invitation to notice and learn, not field evidence.', purpose:'Meet this companion in the open weekly Council and follow the thread into life.', lives:[], actions:[], relations:[{to:'croom',dim:'place',text:'Return to Circle 238'}], sources:['Circle 238 supplied artwork; scene-only derivative reviewed 26 October 2026; publication pending'], location:'A hanging portrait and encounter in the established Canopy Council room.' };
    return {id:c.id,kind:c.kind,seat:Math.PI/2+i*2*Math.PI/10,repr:{form:'circleFrame',artwork:c.artwork,width:c.width,height:c.height,frameFamily:'fig-wood'}};
  })};
  D.council.active = 238;
  D.council.current = 'c238';
  D.councilPresent = {number:238,state:'OPEN'};
  D.nodes.croom.name = 'The Council Deck · Circle 238';
  D.nodes.croom.sub = 'Circle 238 · OPEN · ten companions';
  D.nodes.croom.question = QUESTION_COPY;
  D.nodes.croom.purpose = QUESTION_COPY + ' No scheduled live Fire is asserted this week.';
  D.nodes.croom.relations = circle.companions.map(c=>({to:c.id,dim:'place',text:c.label}));
  D.circleFrameCompanions = circle.companions;
  // Mobile native-touch fallback: the old shared TETOL sheet sometimes ignores
  // pointerup on its grab handle (the 238 phone-browser acceptance caught this).
  // If the existing handler already opened the sheet, do nothing: never double-toggle.
  // Kept in the 238 edition only, leaving historic 235/236 touch mechanics intact.
  let grabTapStartY = null;
  document.addEventListener('pointerdown', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('#grab')) return;
    grabTapStartY = event.clientY;
  }, true);
  document.addEventListener('pointerup', (event) => {
    const startedOnGrab = grabTapStartY !== null;
    const tapDistance = startedOnGrab ? Math.abs(event.clientY - grabTapStartY) : Infinity;
    grabTapStartY = null;
    if (!startedOnGrab || tapDistance > 16 || !document.body.classList.contains('phone')) return;
    if (!(event.target instanceof Element) || !event.target.closest('#grab')) return;
    if (document.body.dataset.sheet !== 'peek') return;
    document.body.dataset.sheet = 'mid';
    const grab = document.getElementById('grab');
    if (grab) { grab.setAttribute('aria-expanded','true'); grab.setAttribute('aria-label','Show the full companion panel'); }
  }, true);
  document.addEventListener('click', (event) => {
    if (!document.body.classList.contains('phone')) return;
    if (!(event.target instanceof Element) || !event.target.closest('#grab')) return;
    if (document.body.dataset.sheet !== 'peek') return;
    document.body.dataset.sheet = 'mid';
    const grab = document.getElementById('grab');
    if (grab) {
      grab.setAttribute('aria-expanded', 'true');
      grab.setAttribute('aria-label', 'Show the full companion panel');
    }
  }, true);
  const style = document.createElement('style');
  style.textContent = 'body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}#tetol-welcome{display:none!important}#council-return{left:16px!important;right:auto!important;bottom:16px!important;max-width:calc(100vw - 32px)}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}' + (window.parent!==window?'#council-return{display:none!important}':'');
  document.head.append(style);
  window.addEventListener('click',e=>{const panel=e.target instanceof Element&&e.target.closest('#panel.peek');if(panel&&e.target.closest('button,a'))panel.classList.remove('peek');},true);
  document.title = 'TETOL · Circle 238 · OPEN Council of Life';
  const brand=document.getElementById('brandline');
  if(brand){const label='TETOL · Circle 238 · OPEN · ten companions';brand.textContent=label;new MutationObserver(()=>{if(brand.textContent!==label)brand.textContent=label;}).observe(brand,{childList:true});}
  const ret=document.getElementById('council-return');
  if(ret){ret.href='/council-of-life?from=spatial-council#next-gathering';ret.target='_top';ret.textContent='Return to Circle 238';}
  return circle;
}
export function companionPanel(D,id,esc) {
  const items=D.circleFrameCompanions||[];
  const c=items.find(c=>c.id===id);
  if(!c && id!=='croom' && id!=='c238') return null;
  const link=(id,label)=>'<button type="button" class="act" data-go="'+id+'">'+esc(label)+'</button>';
  return '<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore Council 238"><i></i></button><div class="pbody"><p class="eyebrow">Circle 238 · Open Council</p><h2 class="pname">'+(c?esc(c.label):'Fig-wood Council')+'</h2><p class="psub">'+esc(QUESTION_COPY)+'</p>'
    +(c?(c.artwork?'<img data-circle-artwork="'+c.id+'" src="'+c.artwork+'" alt="'+esc(c.label)+' — illustrated companion" style="width:100%;height:auto;border-radius:8px">':'<p data-artwork-pending>Scene illustration awaiting verification</p>')+'<p>'+esc(c.kind)+' · Artistic interpretation, not field evidence.</p>'+(c.accuracyNote?'<p>'+esc(c.accuracyNote)+'</p>':'')+link('croom','Return to the Council Deck'):items.map(c=>link(c.id,c.label)).join(''))
    +'<a class="act" target="_top" href="/council/238">Visit the 2D Circle 238 →</a><a class="act" target="_top" href="/council-of-life">Return to the Canopy →</a><a class="act" href="https://t.me/s33dlife" target="_blank" rel="noopener noreferrer">Council community · Telegram (not a Fire room)</a></div>';
}
// Hanging scene portraits are the companion representations in this edition.
// Earlier Circle-specific symbolic presences are preserved in historical editions.
export function buildCompanionPresence(){return null;}
