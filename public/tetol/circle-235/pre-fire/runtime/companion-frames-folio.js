// Compatible folio editions share one adapter; authored catalogues remain unchanged.
import { loadFolioEdition,registerFolioFrame } from '/council/shared/folio-edition.js';
import { connectLivingScene,spatialSide } from '/council/circle-239/living-frame.js';
export async function createFolioAdapter(number) {
const edition=await loadFolioEdition(number),circleNode='c'+number;
registerFolioFrame(edition);
const connectLivingFrames=scene=>connectLivingScene(scene,{element:'canopy-folio-frame',reverseRoot:`/council/circle-${number}/`,extension:'webp'});
async function installCompanionFrames(D) {
  const circle = edition;
  const companions = circle.companions;
  if(number===242){const style=document.createElement('style');style.textContent='body.grace-p.g-arriving aside#panel,body[data-q] aside#panel #grab,body[data-q] aside#panel .pbody>*{opacity:1!important;pointer-events:auto!important}';document.head.append(style);}
  D.nodes[circleNode] = {...D.nodes.c233, name:`Circle ${number}`, circle:number, parent:'croom', question:circle.question, actions:[], relations:[], lives:[]};
  D.council.circles[number] = {node:circleNode, number, status:'open', companions:companions.map((item, index) => {
    D.nodes[item.id] = {...D.nodes.yewc233, name:item.label, sub:item.kind, circle:number, parent:'croom',
      purpose:`Circle ${number} companion`, actions:[], relations:[], lives:[]};
    return {id:item.id, kind:item.kind, seat:Math.PI/2+index*Math.PI/5,
      repr:{form:'circleFrame', artwork:item.artwork, width:item.width, height:item.height, frameFamily:circle.frameFamily||'wood'}};
  })};
  D.council.active = number;
  D.council.current = circleNode;
  D.circleFrameCompanions = companions;
  Object.assign(D.council.place, {name:`Circle ${number} Fire`, sub:'No scheduled gathering'});
  Object.assign(D.nodes.live_fire, {circle:number, parent:'croom', name:`The Fire · Circle ${number}`, sub:'No scheduled Fire', question:null, actions:[], lives:[], where:[], relations:[]});
  Object.assign(D.nodes.seat_you, {circle:number, parent:'croom', name:'A place to pause', actions:[], relations:[]});
  Object.assign(D.nodes.croom, {question:circle.question, purpose:'No scheduled Fire.', actions:[], lives:[],
    relations:companions.map(item => ({to:item.id, dim:'place', text:item.label}))});
}

function companionPanel(D, id, esc) {
  const items = D.circleFrameCompanions;
  const item = items.find(entry => entry.id === id);
  if (!item && !['croom',circleNode,'live_fire','seat_you'].includes(id)) return null;
  const button = (target, label) => `<button type="button" class="act" data-go="${esc(target)}">${esc(label)}</button>`;
  const content = item
    ? `<canopy-folio-frame context="spatial" circle="${number}" companion-key="${esc(item.key)}" label="${esc(item.label)}" front="${esc(item.artwork)}" front-alt="${esc(item.alt)}" side="${spatialSide(item.key)}"></canopy-folio-frame>`
    : id === 'live_fire' ? '<p>No scheduled gathering.</p>'+button('croom','Return to the Council Deck') : id === 'seat_you' ? button('croom','Return to the Council Deck') : button('live_fire','Visit the Fire')+items.map(entry => button(entry.id, entry.label)).join('');
  return `<button type="button" class="grab" id="grab" aria-expanded="false" aria-label="Explore Circle ${number}"><i></i></button>
    <div class="pbody"><h2 class="pname">${esc(item?.label ?? `Circle ${number}`)}</h2>
    <p class="psub">No scheduled Fire</p>
    ${D.nodes[circleNode].question && !item ? `<p>${esc(D.nodes[circleNode].question)}</p>` : ''}${item?.scientificName ? `<p><i>${esc(item.scientificName)}</i></p>` : ''}${content}
    <a href="/council/circle-${number}/index.html" class="act">Visit the 2D Circle ${number}</a></div>`;
}

function buildCompanionPresence() { return null; }

return {installCompanionFrames,companionPanel,connectLivingFrames,buildCompanionPresence};
}
