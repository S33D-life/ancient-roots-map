import {renderCompanionPanel, installCompanionNavigation} from './companion-navigation-238.js?v=companion-nav-126-20261027';
export {decoratePanel, labelGrab, setNavigationContext, afterNavigation} from './companion-navigation-238.js?v=companion-nav-126-20261027';
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
  D.nodes.c238 = { ...D.nodes.c233, name:'StarPod Circle 238', sub:'yOur Blooming Week · CURRENT / OPEN · no scheduled Fire', circle:238, parent:'croom', status:'LIVE', stateShort:'OPEN', lives:[], actions:[], relations:[], question:QUESTION_COPY, purpose:QUESTION_COPY };
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
  // The shared runtime owns grab gestures once for every historical edition.
  const style = document.createElement('style');
  style.textContent = 'body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}#tetol-welcome{display:none!important}#council-return{left:16px!important;right:auto!important;bottom:16px!important;max-width:calc(100vw - 32px)}body.phone[data-sheet=mid] #council-return,body.phone[data-sheet=full] #council-return{display:none!important}' + (window.parent!==window?'#council-return{display:none!important}':'');
  document.head.append(style);
  window.addEventListener('click',e=>{const panel=e.target instanceof Element&&e.target.closest('#panel.peek');if(panel&&e.target.closest('button,a'))panel.classList.remove('peek');},true);
  document.title = 'TETOL · Circle 238 · OPEN Council of Life';
  const brand=document.getElementById('brandline');
  if(brand){const label='TETOL · Circle 238 · OPEN · ten companions';brand.textContent=label;new MutationObserver(()=>{if(brand.textContent!==label)brand.textContent=label;}).observe(brand,{childList:true});}
  const ret=document.getElementById('council-return');
  if(ret){ret.href='/council-of-life?from=spatial-council#next-gathering';ret.target='_top';ret.textContent='Return to Circle 238';}
  installCompanionNavigation();
  return circle;
}
export function companionPanel(D,id,esc) { return renderCompanionPanel(D,id,esc); }
// Hanging scene portraits are the companion representations in this edition.
// Earlier Circle-specific symbolic presences are preserved in historical editions.
export function buildCompanionPresence(){return null;}
